import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);
// @ts-ignore
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("🌱 Seeding Reader OS database...");

    // Clear in reverse dependency order
    await db.delete(schema.sceneProgress);
    await db.delete(schema.choiceProgress);
    await db.delete(schema.choices);
    await db.delete(schema.scenes);
    await db.delete(schema.chapters);
    await db.delete(schema.books);
    await db.delete(schema.userBookProgress);
    await db.delete(schema.userSubscription);

    // ─────────────────────────────────────────────
    // BOOK 1: The Vanishing Hour (Mystery)
    // Truby designing question: "How much truth does justice require?"
    // ─────────────────────────────────────────────

    await db.insert(schema.books).values([
      {
        id: 1,
        title: "The Vanishing Hour",
        author: "Reader OS",
        description:
          "Detective Mara Osei investigates a locked-room disappearance in a coastal mansion. Every resident has a secret. Every secret has a price.",
        coverEmoji: "📖",
        coverColor: "#ede8f8",
        genre: "MYSTERY",
        difficulty: "INTERMEDIATE",
        designingQuestion: "How much truth does justice require?",
        totalChapters: 12,
      },
      {
        id: 2,
        title: "The Last Witness",
        author: "Reader OS",
        description:
          "The only witness to a murder has disappeared. Former detective Priya Nair has 48 hours to find them before the wrong person is convicted.",
        coverEmoji: "🗝️",
        coverColor: "#e1f5ee",
        genre: "MYSTERY",
        difficulty: "ADVANCED",
        designingQuestion: "When does protecting someone become betraying them?",
        totalChapters: 10,
      },
      {
        id: 3,
        title: "The Glass Kingdom",
        author: "Reader OS",
        description:
          "A mapmaker's apprentice discovers the kingdom's borders are built on a centuries-old lie — and she holds the only proof.",
        coverEmoji: "⚔️",
        coverColor: "#fef3dc",
        genre: "FANTASY",
        difficulty: "INTERMEDIATE",
        designingQuestion: "When does duty become a cage?",
        totalChapters: 14,
      },
    ]);

    // ─────────────────────────────────────────────
    // CHAPTERS for Book 1 (first 5 seeded — Truby steps 1–5)
    // ─────────────────────────────────────────────

    await db.insert(schema.chapters).values([
      {
        id: 1,
        bookId: 1,
        order: 1,
        trubyStep: 1,
        title: "Arrival",
        description: "Mara arrives at Thorn House",
      },
      {
        id: 2,
        bookId: 1,
        order: 2,
        trubyStep: 1,
        title: "The Body",
        description: "What the locked room says",
      },
      {
        id: 3,
        bookId: 1,
        order: 3,
        trubyStep: 2,
        title: "The Study",
        description: "A letter changes everything",
      },
      {
        id: 4,
        bookId: 1,
        order: 4,
        trubyStep: 3,
        title: "The Alibi",
        description: "A man with the perfect story",
      },
      {
        id: 5,
        bookId: 1,
        order: 5,
        trubyStep: 3,
        title: "The Confession",
        description: "Someone talks too soon",
      },
    ]);

    // ─────────────────────────────────────────────
    // SCENES for Chapter 4: "The Alibi" (3 scenes)
    // ─────────────────────────────────────────────

    await db.insert(schema.scenes).values([
      {
        id: 1,
        chapterId: 4,
        order: 1,
        title: "The Man with the Perfect Story",
        content: `Elliot Marsh had the kind of alibi that was almost too clean. Three witnesses, a restaurant receipt, a parking ticket — every minute of Friday night accounted for, layered and cross-referenced like a man who had anticipated being asked.

Detective Mara Osei laid the papers across the kitchen table and watched him watch her read them. He was calm. Not the calm of innocence, she had learned long ago, but the calm of preparation.

"You knew we'd come," she said. Not a question.

"I knew someone would come," Elliot replied. "When a person disappears from a locked room in your employer's house, the business partner tends to attract attention."

He poured her tea without asking if she wanted any. She noticed his hands were steady.

In the hallway, her partner DS Kwame Rivers pulled her aside. "Alibi checks out so far," he said quietly. "But the restaurant manager gave me a strange look when I asked about the booking."

"Strange how?"

"Like he was deciding something." Kwame paused. "I think someone called ahead."

Mara looked back through the doorway. Elliot was adding milk to her tea — exactly one sugar, without having asked.`,
        choiceContext:
          "Elliot's alibi is technically clean. But something is rehearsed about it.",
        choiceQuestion:
          "Mara has thirty minutes before she must leave. How does she use them?",
      },
      {
        id: 2,
        chapterId: 4,
        order: 2,
        title: "The Letter in the Study",
        content: `The victim's study was exactly as he had left it. Mara stood in the doorway and let her eyes do the work — the books arranged by colour, not subject; the single photo on the desk (professional, not personal); the small red mark on the edge of the blotter where a wax seal had been pressed and removed.

She found the letter behind the false back of the desk drawer. Thick cream paper, fountain pen ink, no signature. Seven words:

*"You know what you have to do."*

She heard a sound behind her and turned. Elliot Marsh was standing in the doorway. He had seen her find it. Their eyes met across the length of the room.

Neither of them spoke. The clock on the mantelpiece ticked twice.

Mara held the letter carefully and thought about the next thirty seconds.`,
        choiceContext:
          "Elliot has seen you find the letter. He says nothing. You hold the evidence.",
        choiceQuestion: "What does Mara do in the next thirty seconds?",
      },
      {
        id: 3,
        chapterId: 4,
        order: 3,
        title: "What the Choice Cost",
        content: `Later, walking back along the coast path with Kwame, Mara turned the moment over in her mind.

Every investigation had these hinges — places where the weight of the case shifted, where one decision sent you down one corridor and closed off the others.

She had made her choice. She didn't know yet whether it was right. She knew only that it had been hers.

"What do you think of him?" Kwame asked.

She thought about the tea. The one sugar. The steady hands.

"I think," she said carefully, "that he has been carrying something for a very long time. And I think he is almost ready to put it down."

The sea was grey and flat below them. Somewhere in the house behind them, the clock was still ticking.`,
        choiceContext: "The chapter is drawing to a close.",
        choiceQuestion:
          "Reflecting on today — what does Mara feel she now understands?",
      },
    ]);

    // ─────────────────────────────────────────────
    // CHOICES for Scene 1 (Chapter 4, Scene 1)
    // Question: How does Mara use the thirty minutes?
    // ─────────────────────────────────────────────

    await db.insert(schema.choices).values([
      {
        id: 1,
        sceneId: 1,
        text: "Push directly — ask him to walk her through Friday night, minute by minute, while she watches",
        consequence:
          "Elliot tells the story flawlessly. Too flawlessly. On the third telling she spots the micro-hesitation — the half-second before he names the restaurant. She writes it down.",
        traitDeltas: JSON.stringify({ curiosity: 3, risk: 4, logic: 1, empathy: 0, trust: -2 }),
        traitLabel: "Risk ↑ · Curiosity ↑ — you push toward truth, even before you're ready",
        archetypeSignal: "INVESTIGATOR",
      },
      {
        id: 2,
        sceneId: 1,
        text: "Say nothing about the alibi — ask instead about his relationship with the victim",
        consequence:
          "Something shifts in Elliot's expression when she mentions Hargreaves's name. Not grief exactly. Something more complicated. She stores it.",
        traitDeltas: JSON.stringify({ curiosity: 4, empathy: 3, logic: 2, risk: 0, trust: 0 }),
        traitLabel: "Empathy ↑ · Curiosity ↑ — you read people before you read evidence",
        archetypeSignal: "DIPLOMAT",
      },
      {
        id: 3,
        sceneId: 1,
        text: "Excuse herself — go back to the restaurant alone, tonight, unannounced",
        consequence:
          "The manager flinches when she shows her badge. In the space of that flinch, she learns more than she would have in three more conversations with Elliot.",
        traitDeltas: JSON.stringify({ logic: 4, curiosity: 2, risk: 2, empathy: 0, trust: -1 }),
        traitLabel: "Logic ↑ — you verify independently rather than confront directly",
        archetypeSignal: "STRATEGIST",
      },
    ]);

    // ─────────────────────────────────────────────
    // CHOICES for Scene 2 (The Letter)
    // Question: What does Mara do in the next thirty seconds?
    // ─────────────────────────────────────────────

    await db.insert(schema.choices).values([
      {
        id: 4,
        sceneId: 2,
        text: "Confront him now — ask what he knows about this letter",
        consequence:
          "Something shifted in his eyes — too fast to name. Then his expression settled back into calm. 'Nothing,' he said. 'I've never seen it before.' He was lying. She was certain of it. But certainty wasn't evidence.",
        traitDeltas: JSON.stringify({ risk: 5, curiosity: 3, trust: -2, logic: 0, empathy: 0 }),
        traitLabel: "Risk ↑ · Curiosity ↑ — you need truth now, not later",
        archetypeSignal: "INVESTIGATOR",
      },
      {
        id: 5,
        sceneId: 2,
        text: "Pocket the letter and say nothing — investigate alone first",
        consequence:
          "She slipped the letter into her pocket with one smooth motion, her eyes never leaving Elliot's. That night, she photographed every word under a magnifying light. At 2 a.m., she found a match — and it wasn't Elliot's handwriting.",
        traitDeltas: JSON.stringify({ logic: 5, curiosity: 2, trust: -2, risk: 0, empathy: 0 }),
        traitLabel: "Logic ↑ — you trust your own analysis more than you trust people",
        archetypeSignal: "STRATEGIST",
      },
      {
        id: 6,
        sceneId: 2,
        text: "Hand the letter to him openly — watch his reaction before deciding",
        consequence:
          "Elliot looked at the paper. His jaw tightened. His left hand moved toward his pocket and stopped. 'Do you recognise the handwriting?' she asked. He looked up and she saw something she hadn't expected: not guilt, but grief. 'Yes,' he said. 'It's mine.'",
        traitDeltas: JSON.stringify({ empathy: 6, curiosity: 3, trust: 2, risk: -1, logic: 0 }),
        traitLabel: "Empathy ↑ — you give people the chance to reveal themselves",
        archetypeSignal: "DIPLOMAT",
      },
    ]);

    // ─────────────────────────────────────────────
    // CHOICES for Scene 3 (Reflection)
    // Question: What does Mara feel she now understands?
    // ─────────────────────────────────────────────

    await db.insert(schema.choices).values([
      {
        id: 7,
        sceneId: 3,
        text: "That Elliot is protecting someone — and that person is still inside Thorn House",
        consequence:
          "The thought settles with the weight of certainty. She turns back toward the house.",
        traitDeltas: JSON.stringify({ curiosity: 3, empathy: 2, logic: 1, risk: 0, trust: 0 }),
        traitLabel: "Empathy ↑ — you see protection where others see guilt",
        archetypeSignal: "DIPLOMAT",
      },
      {
        id: 8,
        sceneId: 3,
        text: "That the alibi was designed — and someone helped him design it",
        consequence:
          "She stops walking. 'The restaurant manager,' she says aloud. Kwame looks at her. 'We go back tonight,' she says.",
        traitDeltas: JSON.stringify({ logic: 4, curiosity: 2, risk: 2, trust: -1, empathy: 0 }),
        traitLabel: "Logic ↑ — you follow the system to find the break in the system",
        archetypeSignal: "STRATEGIST",
      },
      {
        id: 9,
        sceneId: 3,
        text: "That she has moved too fast today — and needs to sit with what she knows",
        consequence:
          "She says nothing to Kwame. She will think. And then she will know what to do.",
        traitDeltas: JSON.stringify({ trust: 3, logic: 2, risk: -2, curiosity: 1, empathy: 1 }),
        traitLabel: "Trust ↑ — you know when to pause and when to push",
        archetypeSignal: "GUARDIAN",
      },
    ]);

    console.log("✅ Reader OS seeded successfully!");
    console.log("   Books: 3");
    console.log("   Chapters: 5 (Book 1)");
    console.log("   Scenes: 3 (Chapter 4 — The Alibi)");
    console.log("   Choices: 9 (3 per scene)");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw new Error("Failed to seed the database");
  }
};

main();
