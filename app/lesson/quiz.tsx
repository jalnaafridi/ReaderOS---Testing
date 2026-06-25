"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { toast } from "sonner";
import { X } from "lucide-react";

import { recordChoice } from "@/actions/choice-progress";
import { scenes, choices, sceneProgress } from "@/db/schema";

type Scene = typeof scenes.$inferSelect & {
  completed: boolean;
  choices: typeof choices.$inferSelect[];
  sceneProgress: typeof sceneProgress.$inferSelect[];
};

type TraitDeltas = {
  curiosity?: number;
  logic?: number;
  empathy?: number;
  risk?: number;
  trust?: number;
};

type Props = {
  initialScenePercentage: number;
  initialSceneId: number;
  initialScenes: Scene[];
  chapterTitle: string;
};

const ARCHETYPE_EMOJI: Record<string, string> = {
  INVESTIGATOR: "🔍",
  STRATEGIST: "🧠",
  EXPLORER: "🌍",
  DIPLOMAT: "🕊️",
  GUARDIAN: "🛡️",
  REBEL: "⚡",
};

export const Quiz = ({
  initialScenePercentage,
  initialSceneId,
  initialScenes,
  chapterTitle,
}: Props) => {
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [pending, startTransition] = useTransition();

  const [sceneList] = useState(initialScenes);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = sceneList.findIndex((s) => !s.completed);
    return idx === -1 ? 0 : idx;
  });
  const [percentage, setPercentage] = useState(initialScenePercentage);
  const [selectedChoice, setSelectedChoice] = useState<number>();

  // Identity update overlay state
  const [showIdentity, setShowIdentity] = useState(false);
  const [identityData, setIdentityData] = useState<{
    label: string;
    deltas: TraitDeltas;
    archetype: string;
  } | null>(null);

  // Chapter complete state
  const [chapterComplete, setChapterComplete] = useState(false);

  // Reading phase: "reading" | "choosing" | "identity" | "done"
  const [phase, setPhase] = useState<"reading" | "choosing" | "done">("reading");

  const currentScene = sceneList[activeIndex];

  const onContinueReading = () => {
    setPhase("choosing");
  };

  const onSelectChoice = (id: number) => {
    if (pending || phase !== "choosing") return;
    setSelectedChoice(id);
  };

  const onConfirmChoice = () => {
    if (!selectedChoice || !currentScene) return;

    startTransition(() => {
      recordChoice(currentScene.id, selectedChoice)
        .then((result) => {
          if ("alreadyCompleted" in result && result.alreadyCompleted) {
            advanceScene();
            return;
          }

          const res = result as {
            newTraits: { curiosity: number; logic: number; empathy: number; risk: number; trust: number };
            newArchetype: string;
            traitDeltas: TraitDeltas;
            choiceLabel: string;
          };

          setIdentityData({
            label: res.choiceLabel,
            deltas: res.traitDeltas,
            archetype: res.newArchetype,
          });
          setShowIdentity(true);
          setPercentage((prev) => prev + 100 / sceneList.length);
        })
        .catch(() => toast.error("Something went wrong. Please try again."));
    });
  };

  const advanceScene = () => {
    setShowIdentity(false);
    setIdentityData(null);
    setSelectedChoice(undefined);

    const nextIndex = activeIndex + 1;
    if (nextIndex >= sceneList.length) {
      setChapterComplete(true);
    } else {
      setActiveIndex(nextIndex);
      setPhase("reading");
    }
  };

  // ── CHAPTER COMPLETE ──────────────────────
  if (chapterComplete) {
    return (
      <>
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={400}
          tweenDuration={8000}
        />
        <div className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center max-w-lg mx-auto">
          <span className="text-6xl animate-bounce">📖</span>
          <h1 className="text-3xl font-bold font-serif text-neutral-800">
            Chapter complete!
          </h1>
          <p className="text-neutral-500">
            Come back tomorrow for the next chapter. Your streak continues. 🔥
          </p>
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={() => router.push("/learn")}
              className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition"
            >
              Back to map
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="flex-1 border-2 border-violet-300 text-violet-600 font-bold py-3 rounded-xl transition hover:bg-violet-50"
            >
              Leaderboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!currentScene) return null;

  const paragraphs = currentScene.content.split("\n\n").filter(Boolean);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 flex-shrink-0">
        <button
          onClick={() => router.push("/learn")}
          className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-neutral-400 mb-1">
            {chapterTitle} · Scene {activeIndex + 1} of {sceneList.length}
          </p>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Story content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl mx-auto w-full">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">
          {currentScene.title}
        </p>
        <div className="prose prose-lg font-serif text-neutral-800 leading-relaxed">
          {paragraphs.map((para, i) => {
            if (para.startsWith("*") && para.endsWith("*")) {
              return (
                <p key={i} className="text-center italic text-xl my-8 text-neutral-700">
                  {para.replace(/\*/g, "")}
                </p>
              );
            }
            return <p key={i} className="mb-5">{para}</p>;
          })}
        </div>

        {/* Continue to choice / choice UI */}
        {phase === "reading" && (
          <button
            onClick={onContinueReading}
            className="w-full mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition"
          >
            Make your choice →
          </button>
        )}

        {phase === "choosing" && (
          <div className="mt-8">
            <div className="bg-violet-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-violet-400 font-medium mb-1">{currentScene.choiceContext}</p>
              <p className="text-base font-bold font-serif text-neutral-800">
                {currentScene.choiceQuestion}
              </p>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {currentScene.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onSelectChoice(choice.id)}
                  disabled={pending}
                  className={`text-left p-4 rounded-xl border-2 transition ${
                    selectedChoice === choice.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-neutral-200 hover:border-violet-300 bg-white"
                  }`}
                >
                  <p className="text-sm font-medium text-neutral-800 mb-1">{choice.text}</p>
                  <p className="text-xs text-neutral-400">{choice.traitLabel}</p>
                </button>
              ))}
            </div>

            <button
              onClick={onConfirmChoice}
              disabled={!selectedChoice || pending}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition"
            >
              {pending ? "Recording..." : "Confirm choice"}
            </button>
          </div>
        )}
      </div>

      {/* Identity Update Overlay */}
      {showIdentity && identityData && (
        <div className="absolute inset-0 bg-stone-50 flex flex-col items-center justify-center px-6 text-center z-50">
          <div className="text-5xl mb-4">
            {ARCHETYPE_EMOJI[identityData.archetype] ?? "📖"}
          </div>
          <h2 className="text-2xl font-bold font-serif text-neutral-800 mb-2">
            {identityData.label.split("—")[0]}
          </h2>
          <p className="text-neutral-500 text-sm mb-8 max-w-sm">
            {identityData.label}
          </p>

          {/* Trait delta display */}
          <div className="w-full max-w-sm bg-white border border-neutral-100 rounded-2xl p-5 mb-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Reader Genome updated
            </p>
            {Object.entries(identityData.deltas)
              .filter(([, v]) => v !== 0)
              .map(([trait, delta]) => (
                <div key={trait} className="flex items-center justify-between mb-2">
                  <span className="text-sm capitalize text-neutral-600">{trait}</span>
                  <span
                    className={`text-sm font-bold ${
                      (delta as number) > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {(delta as number) > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              ))}
            <div className="border-t border-neutral-100 mt-3 pt-3">
              <p className="text-xs text-neutral-400">
                Archetype: <span className="font-semibold text-violet-600">
                  {ARCHETYPE_EMOJI[identityData.archetype]} The {identityData.archetype.charAt(0) + identityData.archetype.slice(1).toLowerCase()}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={advanceScene}
            className="w-full max-w-sm bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition"
          >
            Continue the story →
          </button>
        </div>
      )}
    </div>
  );
};
