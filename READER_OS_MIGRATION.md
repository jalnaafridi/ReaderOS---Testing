# Reader OS — Migration from Duolingo Clone

## Schema mapping (Duolingo → Reader OS)

| Duolingo        | Reader OS           | Notes                                      |
|-----------------|---------------------|--------------------------------------------|
| `courses`       | `books`             | + genre, designingQuestion, coverEmoji     |
| `units`         | `chapters`          | + trubyStep, description                   |
| `lessons`       | `scenes`            | + content (prose), choiceContext, choiceQuestion |
| `challenges`    | `choices`           | No "correct" answer — all reveal identity  |
| `challengeOptions` | (merged into choices) | traitDeltas replaces correct/incorrect |
| `challengeProgress` | `sceneProgress`  | Stores which choice was made              |
| `userProgress`  | `userBookProgress`  | + full Reader Genome (5 traits + archetype)|

## Key new concepts

### Reader Genome
Five trait scores (0–100) built from every choice across every book:
- **Curiosity** — desire to investigate, ask, discover
- **Logic** — preference for evidence over instinct
- **Empathy** — reading people and relationships
- **Risk** — willingness to act without certainty
- **Trust** — default openness vs. skepticism toward others

### Archetype (computed, not chosen)
Derived from dominant traits after each chapter:
- INVESTIGATOR → Curiosity leads
- STRATEGIST → Logic leads, Risk < 50
- EXPLORER → Risk ≥ 60
- DIPLOMAT → Empathy leads, Trust ≥ 55
- GUARDIAN → Trust ≥ 60, Risk < 50
- REBEL → all others

### Truby Steps
Each chapter maps to one of Truby's 7 structural steps:
1. Weakness and need
2. Desire
3. Opponent
4. Plan
5. Battle
6. Self-revelation
7. New equilibrium

Choices at each step activate different traits (e.g. Battle chapters → Risk/Empathy tension peak).

## StackBlitz setup

1. Push this repo to GitHub
2. Open: `https://stackblitz.com/github/YOUR_USERNAME/reader-os`
3. Add `.env.local`:
   ```
   DATABASE_URL=your_neon_connection_string
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```
4. Run: `npm run db:push` then `npm run db:seed`
5. Run: `npm run dev`

## Files changed from Duolingo clone

### Replaced entirely
- `db/schema.ts` — full Reader OS schema
- `db/queries.ts` — Reader OS queries
- `scripts/seed.ts` — Book 1 with 3 chapters and 9 choices
- `app/(main)/learn/page.tsx` — Chapter map page
- `app/lesson/quiz.tsx` — Reading session with choice engine + identity update
- `actions/challenge-progress.ts` → `actions/choice-progress.ts`
- `actions/user-progress.ts` — Updated for book/reader model

### New files
- `components/reader-progress.tsx` — Sidebar with genome + archetype
- `app/(main)/learn/book-banner.tsx` — Book title + designing question
- `app/(main)/learn/chapter-map.tsx` — Duolingo-style chapter path

### Unchanged (still work)
- `components/ui/*` — All shadcn components
- `app/(main)/leaderboard/` — Now shows XP-based reader rankings
- `app/(marketing)/` — Landing page (update copy to Reader OS)
- `store/*` — Zustand modals still work
- `middleware.ts` — Clerk auth unchanged
- `drizzle.config.ts` — Only DATABASE_URL changes

## Content model for authors

To add a new book:
1. Insert into `books` with genre + designingQuestion
2. Insert `chapters` in order, each with trubyStep (1–7)
3. Insert `scenes` per chapter (2–3 per chapter, 9–12 min total)
4. Insert `choices` per scene (always 3, no correct answer)
   - Each choice needs `traitDeltas` JSON and `traitLabel`
   - Choices should all relate to the book's `designingQuestion`
