import { cache } from "react";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import {
  books,
  chapters,
  scenes,
  sceneProgress,
  choiceProgress,
  userBookProgress,
  userSubscription,
} from "@/db/schema";

// ─── USER ───────────────────────────────────

export const getUserProgress = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  return db.query.userBookProgress.findFirst({
    where: eq(userBookProgress.userId, userId),
    with: { activeBook: true },
  });
});

export const getUserSubscription = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const data = await db.query.userSubscription.findFirst({
    where: eq(userSubscription.userId, userId),
  });
  if (!data) return null;

  const DAY_IN_MS = 86_400_000;
  const isActive =
    data.stripePriceId &&
    data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  return { ...data, isActive: !!isActive };
});

// ─── BOOKS / LIBRARY ────────────────────────

export const getBooks = cache(async () => {
  return db.query.books.findMany({
    where: eq(books.isPublished, true),
  });
});

export const getBookById = cache(async (bookId: number) => {
  return db.query.books.findFirst({
    where: eq(books.id, bookId),
    with: {
      chapters: {
        orderBy: (chapters, { asc }) => [asc(chapters.order)],
        with: { scenes: { orderBy: (s, { asc }) => [asc(s.order)] } },
      },
    },
  });
});

// ─── CHAPTERS (the path map) ─────────────────

export const getChapters = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeBookId) return [];

  const data = await db.query.chapters.findMany({
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    where: eq(chapters.bookId, userProgress.activeBookId),
    with: {
      scenes: {
        orderBy: (scenes, { asc }) => [asc(scenes.order)],
        with: {
          sceneProgress: {
            where: eq(sceneProgress.userId, userId),
          },
        },
      },
    },
  });

  // Annotate each chapter with completion status
  return data.map((chapter) => {
    const scenesWithStatus = chapter.scenes.map((scene) => {
      const completed =
        scene.sceneProgress.length > 0 &&
        scene.sceneProgress.some((p) => p.completed);
      return { ...scene, completed };
    });

    const chapterCompleted =
      scenesWithStatus.length > 0 &&
      scenesWithStatus.every((s) => s.completed);

    return { ...chapter, scenes: scenesWithStatus, completed: chapterCompleted };
  });
});

// ─── BOOK PROGRESS ───────────────────────────

export const getBookProgress = cache(async () => {
  const { userId } = await auth();
  const userProgress = await getUserProgress();

  if (!userId || !userProgress?.activeBookId) return null;

  const allChapters = await db.query.chapters.findMany({
    orderBy: (chapters, { asc }) => [asc(chapters.order)],
    where: eq(chapters.bookId, userProgress.activeBookId),
    with: {
      scenes: {
        with: {
          sceneProgress: {
            where: eq(sceneProgress.userId, userId),
          },
        },
      },
    },
  });

  const firstIncompleteChapter = allChapters.find((chapter) =>
    chapter.scenes.some(
      (scene) =>
        !scene.sceneProgress ||
        scene.sceneProgress.length === 0 ||
        !scene.sceneProgress.some((p) => p.completed)
    )
  );

  return {
    activeChapter: firstIncompleteChapter,
    activeChapterId: firstIncompleteChapter?.id,
  };
});

// ─── SCENE (the reading session) ─────────────

export const getScene = cache(async (id?: number) => {
  const { userId } = await auth();
  if (!userId) return null;

  const bookProgress = await getBookProgress();
  const sceneId = id || bookProgress?.activeChapter?.scenes?.[0]?.id;
  if (!sceneId) return null;

  const data = await db.query.scenes.findFirst({
    where: eq(scenes.id, sceneId),
    with: {
      choices: true,
      sceneProgress: {
        where: eq(sceneProgress.userId, userId),
      },
    },
  });

  if (!data) return null;

  const completed =
    data.sceneProgress.length > 0 && data.sceneProgress.some((p) => p.completed);
  return { ...data, completed };
});

export const getScenePercentage = cache(async () => {
  const bookProgress = await getBookProgress();
  if (!bookProgress?.activeChapterId) return 0;

  const { userId } = await auth();
  if (!userId) return 0;

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, bookProgress.activeChapterId),
    with: {
      scenes: {
        with: {
          sceneProgress: { where: eq(sceneProgress.userId, userId) },
        },
      },
    },
  });

  if (!chapter || chapter.scenes.length === 0) return 0;

  const completedScenes = chapter.scenes.filter(
    (s) => s.sceneProgress.length > 0 && s.sceneProgress.some((p) => p.completed)
  );

  return Math.round((completedScenes.length / chapter.scenes.length) * 100);
});

// ─── LEADERBOARD ─────────────────────────────

export const getTopTenReaders = cache(async () => {
  const { userId } = await auth();
  if (!userId) return [];

  return db.query.userBookProgress.findMany({
    orderBy: (u, { desc }) => [desc(u.xp)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      xp: true,
      streakDays: true,
      currentArchetype: true,
    },
  });
});
