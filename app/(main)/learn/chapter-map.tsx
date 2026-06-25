"use client";
import Link from "next/link";
import { Check, Lock, BookOpen, Crown } from "lucide-react";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Chapter = {
  id: number;
  order: number;
  title: string;
  description: string;
  trubyStep: number;
  completed: boolean;
  scenes: { completed: boolean }[];
};

type Props = {
  chapters: Chapter[];
  activeChapterId?: number;
  scenePercentage: number;
};

export const ChapterMap = ({ chapters, activeChapterId, scenePercentage }: Props) => {
  return (
    <div className="flex flex-col items-center">
      {chapters.map((chapter, index) => {
        const isCompleted = chapter.completed;
        const isCurrent = chapter.id === activeChapterId;
        const isLocked = !isCompleted && !isCurrent;
        const isLast = index === chapters.length - 1;

        const Icon = isCompleted ? Check : isLast ? Crown : BookOpen;
        const href = isCompleted ? `/lesson/${chapter.id}` : "/lesson";

        // Zigzag indentation (same pattern as Duolingo)
        const cycleIndex = index % 8;
        let indent = 0;
        if (cycleIndex <= 2) indent = cycleIndex;
        else if (cycleIndex <= 4) indent = 4 - cycleIndex;
        else if (cycleIndex <= 6) indent = 4 - cycleIndex;
        else indent = cycleIndex - 8;

        return (
          <div
            key={chapter.id}
            className="flex flex-col items-center"
            style={{ marginTop: index === 0 ? 16 : 0 }}
          >
            <div
              className="relative flex flex-col items-center"
              style={{ right: `${indent * 36}px`, marginBottom: 8 }}
            >
              {isCurrent && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                  <div className="bg-white border-2 border-violet-400 text-violet-600 text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wide whitespace-nowrap">
                    Today
                    <div className="absolute left-1/2 -bottom-2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-violet-400 -translate-x-1/2" />
                  </div>
                </div>
              )}

              <Link
                href={isLocked ? "#" : href}
                aria-disabled={isLocked}
                style={{ pointerEvents: isLocked ? "none" : "auto" }}
              >
                {isCurrent ? (
                  <div className="h-[90px] w-[90px]">
                    <CircularProgressbarWithChildren
                      value={scenePercentage}
                      styles={{
                        path: { stroke: "#7c3aed" },
                        trail: { stroke: "#e5e7eb" },
                      }}
                    >
                      <Button
                        size="rounded"
                        variant="secondary"
                        className="h-[68px] w-[68px] border-b-8 bg-violet-500 hover:bg-violet-400"
                      >
                        <Icon className="h-8 w-8 fill-white text-white" />
                      </Button>
                    </CircularProgressbarWithChildren>
                  </div>
                ) : (
                  <Button
                    size="rounded"
                    variant={isLocked ? "locked" : "secondary"}
                    className={cn(
                      "h-[68px] w-[68px] border-b-8",
                      isCompleted && "bg-violet-500 hover:bg-violet-400"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-8 w-8",
                        isLocked
                          ? "fill-neutral-400 text-neutral-400 stroke-neutral-400"
                          : "fill-white text-white",
                        isCompleted && "fill-none stroke-[3]"
                      )}
                    />
                  </Button>
                )}
              </Link>

              <div className="text-center mt-2 mb-6 max-w-[110px]">
                <p className={cn("text-xs font-semibold",
                  isCurrent ? "text-violet-600" : isLocked ? "text-neutral-400" : "text-neutral-600"
                )}>
                  Ch. {chapter.order} · {chapter.title}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{chapter.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
