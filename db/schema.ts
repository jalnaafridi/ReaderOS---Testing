import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export const genreEnum = pgEnum("genre", [
  "MYSTERY",
  "THRILLER",
  "FANTASY",
  "ROMANCE",
]);

export const archetypeEnum = pgEnum("archetype", [
  "INVESTIGATOR",
  "STRATEGIST",
  "EXPLORER",
  "DIPLOMAT",
  "GUARDIAN",
  "REBEL",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

// ─────────────────────────────────────────────
// BOOKS  (was: courses)
// genre → book → chapter → scene → choice
// ─────────────────────────────────────────────

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull().default("Reader OS"),
  description: text("description").notNull(),
  coverEmoji: text("cover_emoji").notNull().default("📖"),
  coverColor: text("cover_color").notNull().default("#ede8f8"),
  genre: genreEnum("genre").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("INTERMEDIATE"),
  // The single moral question that drives every choice in this book (Truby principle)
  designingQuestion: text("designing_question").notNull(),
  totalChapters: integer("total_chapters").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
});

export const booksRelations = relations(books, ({ many }) => ({
  chapters: many(chapters),
  userBookProgress: many(userBookProgress),
}));

// ─────────────────────────────────────────────
// CHAPTERS  (was: units)
// Each chapter = one daily reading session
// ─────────────────────────────────────────────

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id")
    .references(() => books.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  // Truby structural step this chapter maps to (1–7)
  trubyStep: integer("truby_step").notNull().default(1),
  // One-line description shown on the chapter map
  description: text("description").notNull(),
});

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
  scenes: many(scenes),
}));

// ─────────────────────────────────────────────
// SCENES  (was: lessons)
// 2–3 scenes per chapter; one scene = one choice moment
// ─────────────────────────────────────────────

export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id")
    .references(() => chapters.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  // Full prose content of the scene (Lora serif, immersive reading)
  content: text("content").notNull(),
  // One-line setup for the choice: what is at stake RIGHT NOW
  choiceContext: text("choice_context").notNull(),
  // The question surfaced to the reader at peak tension
  choiceQuestion: text("choice_question").notNull(),
});

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [scenes.chapterId],
    references: [chapters.id],
  }),
  choices: many(choices),
  sceneProgress: many(sceneProgress),
}));

// ─────────────────────────────────────────────
// CHOICES  (was: challengeOptions)
// 3 choices per scene — no "correct" answer,
// each reveals different reader traits
// ─────────────────────────────────────────────

export const choices = pgTable("choices", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id")
    .references(() => scenes.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  // What happens in the story after this choice (flavour continuation)
  consequence: text("consequence").notNull(),
  // Trait deltas as JSON: { curiosity: 3, logic: -1, empathy: 2, risk: 0, trust: 1 }
  traitDeltas: jsonb("trait_deltas").notNull().default("{}"),
  // Human-readable summary of what the choice reveals
  traitLabel: text("trait_label").notNull(),
  // Which archetype this choice most aligns with
  archetypeSignal: archetypeEnum("archetype_signal"),
});

export const choicesRelations = relations(choices, ({ one, many }) => ({
  scene: one(scenes, {
    fields: [choices.sceneId],
    references: [scenes.id],
  }),
  choiceProgress: many(choiceProgress),
}));

// ─────────────────────────────────────────────
// SCENE PROGRESS  (was: challengeProgress)
// Records which choice the user made in each scene
// ─────────────────────────────────────────────

export const sceneProgress = pgTable("scene_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sceneId: integer("scene_id")
    .references(() => scenes.id, { onDelete: "cascade" })
    .notNull(),
  choiceId: integer("choice_id")
    .references(() => choices.id, { onDelete: "cascade" })
    .notNull(),
  completed: boolean("completed").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sceneProgressRelations = relations(sceneProgress, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneProgress.sceneId],
    references: [scenes.id],
  }),
  choice: one(choices, {
    fields: [sceneProgress.choiceId],
    references: [choices.id],
  }),
}));

// ─────────────────────────────────────────────
// CHOICE PROGRESS  (tracks individual choice selections)
// ─────────────────────────────────────────────

export const choiceProgress = pgTable("choice_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  choiceId: integer("choice_id")
    .references(() => choices.id, { onDelete: "cascade" })
    .notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const choiceProgressRelations = relations(choiceProgress, ({ one }) => ({
  choice: one(choices, {
    fields: [choiceProgress.choiceId],
    references: [choices.id],
  }),
}));

// ─────────────────────────────────────────────
// USER BOOK PROGRESS  (was: userProgress)
// Tracks which book is active + the Reader Genome
// ─────────────────────────────────────────────

export const userBookProgress = pgTable("user_book_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("Reader"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),

  // Active book (was: activeCourseId)
  activeBookId: integer("active_book_id").references(() => books.id, {
    onDelete: "cascade",
  }),

  // Gamification (kept from Duolingo)
  hearts: integer("hearts").notNull().default(5),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastReadAt: timestamp("last_read_at"),

  // THE READER GENOME — built from every choice across every book
  curiosity: integer("curiosity").notNull().default(50),
  logic: integer("logic").notNull().default(50),
  empathy: integer("empathy").notNull().default(50),
  risk: integer("risk").notNull().default(50),
  trust: integer("trust").notNull().default(50),

  // Current dominant archetype (recomputed after each chapter)
  currentArchetype: archetypeEnum("current_archetype").default("INVESTIGATOR"),

  // Total books finished
  booksCompleted: integer("books_completed").notNull().default(0),
  totalChoicesMade: integer("total_choices_made").notNull().default(0),
});

export const userBookProgressRelations = relations(
  userBookProgress,
  ({ one }) => ({
    activeBook: one(books, {
      fields: [userBookProgress.activeBookId],
      references: [books.id],
    }),
  })
);

// ─────────────────────────────────────────────
// USER SUBSCRIPTION  (unchanged from Duolingo)
// ─────────────────────────────────────────────

export const userSubscription = pgTable("user_subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end").notNull(),
});
