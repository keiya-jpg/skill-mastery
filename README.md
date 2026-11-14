# Adept

Pick any skill, mental or physical, and get a short, focused practice plan built on how people actually get good at things. Find something new when you're bored, or search for anything; the AI builds an interactive plan once, and from then on everyone gets the saved version.

Built from the learning-science foundations of [Retain](https://github.com/keiya-jpg/Retain) (spaced repetition, retrieval practice, hints that fade, focus sessions, no streaks), extended with motor learning, expertise research and engagement psychology. The evidence and the design rule it produced are in **[docs/RESEARCH.md](docs/RESEARCH.md)**. The name is a placeholder: change `APP_NAME` in `src/lib/core/config.ts`.

Everything runs on free tiers: Vercel (hosting), Supabase (accounts and data), Groq with Gemini as fallback (AI).

---

## What's in it

**Three hand-built skills** (work offline, no AI needed):

| Skill | What's interactive |
|---|---|
| 🧠 Memory training | Honest take on "photographic memory", baseline test, build your own memory palace, word lists through the palace, Major system for numbers, digit span staircase, visual "snapshot" drill |
| ♟️ Chess | Board you tap to move (phone friendly), rules quizzes, a computer opponent at 3 levels with hints and take-backs, a "checks, captures, threats" habit prompt, 120 rated puzzles (mate in 1, mate in 2, win material) that adapt to your level |
| 🏀 Basketball | Form shooting, a free-throw routine with quiet-eye training and mental rehearsal, ball handling, layups, random-spot shooting with a spot caller. You log makes; the drill moves you to the harder or easier version |

**Any other skill:** search it, and the AI designs a 4-6 stage plan, then builds each stage from a fixed set of interactive pieces (explain with predict-first, quiz with an explanation for every option, recall, put-in-order, logged drills with easier/harder versions, guided imagery, reflection, spaced-repetition cards). Stage 1 is built immediately, the next stage is prepared in the background while you practise, and every stage is saved in the shared catalog so it's never built twice.

**Discover:** three quick preference taps, then one skill at a time with a one-line hook, "Try it", "Show another", or "Not for me". About one suggestion in five is a wildcard outside your usual picks. 75 skill ideas are seeded; built skills join the pool.

**Every session** is a focus mode: one goal you can check, a warm-up of due spaced-repetition cards, one idea, practice that adapts, then "did you reach the goal?" (Yes moves you on; "Not yet" repeats the stage, which is how practice works), and an optional "when and where is your next session?".

**Accounts:** use it as a guest (saved on the device) or sign in with email or Google to sync across devices. Guest progress moves to the account on first sign-in. Building a new skill needs an account (it uses AI quota).

### Why the AI doesn't write code

Generating a whole app per skill (raw HTML/JS) sounds great but in practice is often broken, can't be safely shared between users, and would make every skill look different. Here the AI writes **data** (a module in `src/lib/skill/schema.ts`), validated with zod, and the app renders it with tested components. Skills that need a real engine (chess, memory) get hand-built ones. New engines can be added to `ENGINES` in the schema and `src/components/session/engine.tsx`.

---

## Run it locally

Needs Node 20+ and pnpm 10.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without Supabase keys it runs in guest mode: the three hand-built skills, discover and the library all work. To try building new skills offline, also start a local Supabase (`pnpm db:start`, needs Docker), fill in the keys it prints, and set `AI_MOCK=1`.

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

`pnpm test` includes a check that re-verifies every chess puzzle with the engine. To regenerate puzzles: `node scripts/make-puzzles.ts 40` (about 20 minutes).

## Deploy (free)

1. **Supabase:** create a project at supabase.com. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`, or paste `supabase/migrations/*.sql` into the SQL editor. You can reuse Retain's Supabase project if you want one login for both apps; the tables don't overlap except `ai_usage`, which has the same shape.
2. **Auth:** Authentication → URL Configuration: set the Site URL to your Vercel URL and add `https://<your-app>.vercel.app/**` to the redirect URLs. For Google sign-in, follow Retain's README step B (same steps).
3. **Vercel:** import the repo (root directory is the repo root), and add environment variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` (Project Settings → API → secret key). **Server only**; it's only used to save validated modules to the shared catalog. The build fails if it leaks into browser code.
   - `GROQ_API_KEY` and/or `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. Optional: set the `APP_URL` Actions variable to turn on `.github/workflows/keep-awake.yml`, so free Supabase doesn't pause after a week idle.

## How data is protected

- Per-user tables (`library`, `practice_log`, `card_state`, `sessions`, `user_prefs`, `skill_feedback`, `ai_usage`) have row-level security: a user can only touch their own rows.
- The shared `skills` catalog is readable by everyone and writable only by the server, after validation. Stage builds use a short database lock (`claim_skill_stage`) so two people opening the same new skill don't both spend AI quota.
- Requests that would teach harm (weapons, hacking others, self-harm, cheating) are refused at the outline step.
- Each account has a daily AI budget (`AI_DAILY_REQUEST_LIMIT`, default 40) and can create at most `SKILL_DAILY_LIMIT` (default 5) brand-new skills a day.

## Layout

```
src/app/            pages: / (Today), /discover, /skill, /practice, /review, /library, /settings, /about, auth pages, /api (Hono)
src/components/     session/ (activity players), chess/, memory/, skill/, shared UI
src/lib/skill/      module schema, prompts, catalog, seeds/ (hand-built skills), ideas.ts (discover pool)
src/lib/ai/         provider router from Retain: Groq → Gemini → OpenRouter fallback, JSON repair, rate limits
src/lib/server/     API, skill building, Supabase clients
src/lib/chess/      engine (search, hints, puzzle checks), puzzles.json
src/lib/store.ts    guest (on-device) and Supabase stores, guest → account migration
supabase/           migrations
docs/RESEARCH.md    the research brief
```

## What's next

- Real-game chess puzzles from the Lichess puzzle database (CC0) to replace the engine-generated set.
- A native shell (Capacitor, like Retain's Android app) for home-screen install and reminders at the time you planned.
- Progress charts per skill (puzzle rating, digit span, free-throw % over time). The data is already logged.
- More hand-built engines (rhythm/metronome, typing, mental arithmetic), and a way to report a bad AI-built stage so it gets rebuilt.
