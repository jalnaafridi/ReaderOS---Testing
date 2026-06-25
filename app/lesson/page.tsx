import { redirect } from "next/navigation";
import { getBookProgress, getScene, getScenePercentage, getUserProgress } from "@/db/queries";
import { Quiz } from "./quiz";

const LessonPage = async () => {
  const userProgress = await getUserProgress();
  const bookProgress = await getBookProgress();

  if (!userProgress || !userProgress.activeBookId) redirect("/courses");
  if (!bookProgress?.activeChapter) redirect("/learn");

  const chapter = bookProgress.activeChapter;

  // Load all scenes in this chapter with their choices + progress
  const { db } = await import("@/db/drizzle");
  const { scenes, choices, sceneProgress } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  const { auth } = await import("@clerk/nextjs");
  const { userId } = await auth();

  const scenesData = await db.query.scenes.findMany({
    where: eq(scenes.chapterId, chapter.id),
    orderBy: [asc(scenes.order)],
    with: {
      choices: true,
      sceneProgress: {
        where: eq(sceneProgress.userId, userId!),
      },
    },
  });

  const normalizedScenes = scenesData.map((scene) => ({
    ...scene,
    completed:
      scene.sceneProgress.length > 0 && scene.sceneProgress.some((p) => p.completed),
  }));

  const scenePercentage = await getScenePercentage();

  return (
    <Quiz
      initialScenePercentage={scenePercentage}
      initialSceneId={normalizedScenes[0]?.id ?? 0}
      initialScenes={normalizedScenes}
      chapterTitle={`Ch. ${chapter.order} · ${chapter.title}`}
    />
  );
};

export default LessonPage;
