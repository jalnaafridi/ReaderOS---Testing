"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import {
  choiceProgress,
  choices,
  sceneProgress,
  userBookProgress,
} from "@/db/schema";

// ── Trait delta type ────────────────────────
type TraitDeltas = {
  curiosity?: number;
  logic?: number;
  empathy?: number;
  risk?: number;
  trust?: number;
};

// ── Archetype computation ────────────────────
function computeArchetype(traits: {
  curiosity: number;
  logic: number;
  empathy: number;
  risk: number;
  trust: number;
}): "INVESTIGATOR" | "STRATEGIST" | "EXPLORER" | "DIPLOMAT" | "GUARDIAN" | "REBEL" {
  const { curiosity, logic, empathy, risk, trust } = traits;

  if (curiosity >= logic && curiosity >= empathy) return "INVESTIGATOR";
  if (logic >= curiosity && logic >= empathy && risk < 50) return "STRATEGIST";
  if (risk >= 60) return "EXPLORER";
  if (empathy >= logic && trust >= 55) return "DIPLOMAT";
  if (trust >= 60 && risk < 50) return "GUARDIAN";
  return "REBEL";
}

// ── Main action: record a choice, update Reader Genome ──

export const recordChoice = async (sceneId: number, choiceId: number) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const currentProgress = await getUserProgress();
  if (!currentProgress) throw new Error("User progress not found");

  // Get the choice and its trait deltas
  const choice = await db.query.choices.findFirst({
    where: eq(choices.id, choiceId),
  });
  if (!choice) throw new Error("Choice not found");

  // Check if already made a choice in this scene
  const existingProgress = await db.query.sceneProgress.findFirst({
    where: and(
      eq(sceneProgress.userId, userId),
      eq(sceneProgress.sceneId, sceneId)
    ),
  });

  if (existingProgress) {
    // Scene already completed — no re-processing traits
    return { alreadyCompleted: true };
  }

  // Parse trait deltas
  const deltas = (choice.traitDeltas as TraitDeltas) || {};

  // Clamp helper: keep traits between 0 and 100
  const clamp = (val: number) => Math.min(100, Math.max(0, val));

  const newCuriosity = clamp(currentProgress.curiosity + (deltas.curiosity || 0));
  const newLogic = clamp(currentProgress.logic + (deltas.logic || 0));
  const newEmpathy = clamp(currentProgress.empathy + (deltas.empathy || 0));
  const newRisk = clamp(currentProgress.risk + (deltas.risk || 0));
  const newTrust = clamp(currentProgress.trust + (deltas.trust || 0));

  const newArchetype = computeArchetype({
    curiosity: newCuriosity,
    logic: newLogic,
    empathy: newEmpathy,
    risk: newRisk,
    trust: newTrust,
  });

  // Record the scene completion with choice made
  await db.insert(sceneProgress).values({
    userId,
    sceneId,
    choiceId,
    completed: true,
  });

  // Update Reader Genome + XP
  await db
    .update(userBookProgress)
    .set({
      curiosity: newCuriosity,
      logic: newLogic,
      empathy: newEmpathy,
      risk: newRisk,
      trust: newTrust,
      currentArchetype: newArchetype,
      xp: currentProgress.xp + 10,
      totalChoicesMade: currentProgress.totalChoicesMade + 1,
      lastReadAt: new Date(),
    })
    .where(eq(userBookProgress.userId, userId));

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return {
    newTraits: {
      curiosity: newCuriosity,
      logic: newLogic,
      empathy: newEmpathy,
      risk: newRisk,
      trust: newTrust,
    },
    newArchetype,
    traitDeltas: deltas,
    choiceLabel: choice.traitLabel,
  };
};
