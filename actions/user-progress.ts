"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs";

import db from "@/db/drizzle";
import { getBookById, getUserProgress } from "@/db/queries";
import { userBookProgress, sceneProgress, choiceProgress } from "@/db/schema";

// ── Select / switch active book ──────────────────────────

export const upsertUserProgress = async (bookId: number) => {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) throw new Error("Unauthorized");

  const book = await getBookById(bookId);
  if (!book) throw new Error("Book not found");
  if (!book.chapters.length) throw new Error("Book has no chapters yet");

  const existingProgress = await getUserProgress();

  if (existingProgress) {
    await db.update(userBookProgress).set({
      activeBookId: bookId,
      userName: user.firstName || "Reader",
      userImageSrc: user.imageUrl || "/mascot.svg",
    });
  } else {
    await db.insert(userBookProgress).values({
      userId,
      activeBookId: bookId,
      userName: user.firstName || "Reader",
      userImageSrc: user.imageUrl || "/mascot.svg",
    });
  }

  revalidatePath("/learn");
  revalidatePath("/courses");
  redirect("/learn");
};

// ── Streak update (call on daily session complete) ───────

export const updateStreak = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const progress = await getUserProgress();
  if (!progress) throw new Error("User progress not found");

  const now = new Date();
  const lastRead = progress.lastReadAt;
  const oneDayMs = 86_400_000;

  let newStreak = progress.streakDays;

  if (!lastRead) {
    newStreak = 1;
  } else {
    const hoursSince = (now.getTime() - lastRead.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      // Same session — no change
    } else if (hoursSince < 48) {
      newStreak = progress.streakDays + 1;
    } else {
      newStreak = 1; // Streak broken
    }
  }

  await db
    .update(userBookProgress)
    .set({ streakDays: newStreak, lastReadAt: now })
    .where(eq(userBookProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");

  return { newStreak };
};
