/**
 * Spaced repetition for a skill's key facts and cues, using FSRS (the same
 * scheduler as Retain). Each session opens with a short warm-up of due cards:
 * retrieval practice, spaced out, is the best-supported way to keep what you learn.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FsrsCard, type Grade } from "ts-fsrs";

export type CardState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
};

const engine = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: true, maximum_interval: 365 * 2 }));

function toFsrs(s: CardState): FsrsCard {
  return { ...s, due: new Date(s.due), last_review: s.last_review ? new Date(s.last_review) : undefined } as FsrsCard;
}
function fromFsrs(c: FsrsCard): CardState {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review).toISOString() : null,
  };
}

export function newCard(now = new Date()): CardState {
  return fromFsrs(createEmptyCard(now));
}

/** 1 forgot, 2 hard, 3 good, 4 easy */
export type Recall = 1 | 2 | 3 | 4;
const RATING: Record<Recall, Grade> = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy };

export function review(state: CardState, recall: Recall, now = new Date()): CardState {
  return fromFsrs(engine.next(toFsrs(state), now, RATING[recall]).card);
}

export function isDue(state: CardState, now = new Date()): boolean {
  return new Date(state.due).getTime() <= now.getTime();
}

/** "in 3 days", "tomorrow", "in 10 minutes" */
export function whenLabel(iso: string, now = new Date()): string {
  const ms = new Date(iso).getTime() - now.getTime();
  const min = Math.round(ms / 60_000);
  if (min < 60) return `in ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "tomorrow";
  if (d < 30) return `in ${d} days`;
  const m = Math.round(d / 30);
  return m === 1 ? "in a month" : `in ${m} months`;
}
