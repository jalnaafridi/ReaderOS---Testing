import { redirect } from "next/navigation";
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { ReaderProgress } from "@/components/reader-progress";
import {
  getBookProgress,
  getChapters,
  getScenePercentage,
  getUserProgress,
  getUserSubscription,
} from "@/db/queries";
import { ChapterMap } from "./chapter-map";
import { BookBanner } from "./book-banner";

const LearnPage = async () => {
  const [userProgress, chapters, bookProgress, scenePercentage, userSubscription] =
    await Promise.all([
      getUserProgress(),
      getChapters(),
      getBookProgress(),
      getScenePercentage(),
      getUserSubscription(),
    ]);

  if (!userProgress?.activeBook) redirect("/courses");
  if (!bookProgress) redirect("/courses");

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <ReaderProgress
          activeBook={userProgress.activeBook}
          xp={userProgress.xp}
          streakDays={userProgress.streakDays}
          curiosity={userProgress.curiosity}
          logic={userProgress.logic}
          empathy={userProgress.empathy}
          risk={userProgress.risk}
          trust={userProgress.trust}
          archetype={userProgress.currentArchetype ?? "INVESTIGATOR"}
          hasActiveSubscription={!!userSubscription?.isActive}
        />
      </StickyWrapper>
      <FeedWrapper>
        <BookBanner
          title={userProgress.activeBook.title}
          designingQuestion={userProgress.activeBook.designingQuestion}
        />
        <ChapterMap
          chapters={chapters}
          activeChapterId={bookProgress.activeChapterId}
          scenePercentage={scenePercentage}
        />
      </FeedWrapper>
    </div>
  );
};

export default LearnPage;
