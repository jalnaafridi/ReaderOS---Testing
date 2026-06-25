import Link from "next/link";
import { Flame, BookOpen } from "lucide-react";
import { books } from "@/db/schema";

const ARCHETYPE_EMOJI: Record<string, string> = {
  INVESTIGATOR: "🔍",
  STRATEGIST: "🧠",
  EXPLORER: "🌍",
  DIPLOMAT: "🕊️",
  GUARDIAN: "🛡️",
  REBEL: "⚡",
};

type Props = {
  activeBook: typeof books.$inferSelect;
  xp: number;
  streakDays: number;
  curiosity: number;
  logic: number;
  empathy: number;
  risk: number;
  trust: number;
  archetype: string;
  hasActiveSubscription: boolean;
};

const TraitBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2 mb-1.5">
    <span className="text-xs text-neutral-500 w-16 flex-shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
    <span className="text-xs font-semibold text-neutral-700 w-6 text-right">{value}</span>
  </div>
);

export const ReaderProgress = ({
  activeBook, xp, streakDays,
  curiosity, logic, empathy, risk, trust, archetype,
}: Props) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Active book */}
      <Link href="/courses">
        <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100 hover:bg-violet-100 transition cursor-pointer">
          <span className="text-2xl">{activeBook.coverEmoji ?? "📖"}</span>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Reading</p>
            <p className="text-sm font-bold text-neutral-700 leading-tight">{activeBook.title}</p>
          </div>
        </div>
      </Link>

      {/* XP + Streak */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <BookOpen className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-neutral-500">XP</p>
            <p className="text-sm font-bold text-amber-600">{xp}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-neutral-500">Streak</p>
            <p className="text-sm font-bold text-orange-600">{streakDays} days</p>
          </div>
        </div>
      </div>

      {/* Archetype */}
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-1">
          Your Archetype
        </p>
        <p className="text-sm font-bold text-violet-700">
          {ARCHETYPE_EMOJI[archetype] ?? "📖"} The {archetype.charAt(0) + archetype.slice(1).toLowerCase()}
        </p>
      </div>

      {/* Reader Genome */}
      <div className="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">
          Reader Genome
        </p>
        <TraitBar label="Curiosity" value={curiosity} color="#7c3aed" />
        <TraitBar label="Logic"     value={logic}     color="#1d4ed8" />
        <TraitBar label="Empathy"   value={empathy}   color="#059669" />
        <TraitBar label="Risk"      value={risk}      color="#dc2626" />
        <TraitBar label="Trust"     value={trust}     color="#d97706" />
      </div>
    </div>
  );
};
