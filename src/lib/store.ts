"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SkillKind } from "./skill/schema";
import type { CardState } from "./srs";

/**
 * Where a person's progress lives. Signed out, it stays on this device so
 * anyone can try the app without an account. Signed in, it lives in Supabase
 * (row-level security) and follows them across devices. On first sign-in,
 * whatever was done as a guest is moved up to the account.
 */

export interface LibraryItem {
  slug: string;
  stage: number;
  sessions: number;
  addedAt: string;
  lastPracticedAt: string | null;
}

export interface LogEntry {
  slug: string;
  stageId: string;
  activityId: string;
  kind: string;
  attempts?: number | null;
  successes?: number | null;
  score?: number | null;
  level?: number;
  data?: Record<string, unknown>;
  createdAt?: string;
}

export interface CardRow {
  slug: string;
  cardId: string;
  state: CardState;
}

export interface SessionRow {
  slug: string;
  stageId: string;
  startedAt: string;
  endedAt: string;
  goalMet: boolean | null;
  note?: string;
}

export interface Prefs {
  onboarded: boolean;
  kinds: SkillKind[];
  indoorOnly: boolean;
  noGearOnly: boolean;
  interests: string[];
  /** A "when and where" plan for the next session (implementation intention). */
  plan?: string;
}

export const DEFAULT_PREFS: Prefs = { onboarded: false, kinds: ["mental", "physical", "mixed"], indoorOnly: false, noGearOnly: false, interests: [] };

export interface Store {
  readonly remote: boolean;
  library(): Promise<LibraryItem[]>;
  item(slug: string): Promise<LibraryItem | null>;
  add(slug: string): Promise<void>;
  update(slug: string, patch: Partial<Pick<LibraryItem, "stage" | "sessions" | "lastPracticedAt">>): Promise<void>;
  remove(slug: string): Promise<void>;
  log(entry: LogEntry): Promise<void>;
  logs(slug: string, activityId?: string, limit?: number): Promise<LogEntry[]>;
  cards(slug?: string): Promise<CardRow[]>;
  saveCards(rows: CardRow[]): Promise<void>;
  saveSession(row: SessionRow): Promise<void>;
  sessions(limit?: number): Promise<SessionRow[]>;
  prefs(): Promise<Prefs>;
  savePrefs(p: Prefs): Promise<void>;
  feedback(slug: string, verdict: "skip" | "like"): Promise<void>;
  skipped(): Promise<string[]>;
}

// ---------------------------------------------------------------- local (guest)

const KEY = "adept:guest:v1";
interface LocalData {
  library: LibraryItem[];
  logs: LogEntry[];
  cards: CardRow[];
  sessions: SessionRow[];
  prefs: Prefs;
  feedback: Record<string, "skip" | "like">;
}
const empty = (): LocalData => ({ library: [], logs: [], cards: [], sessions: [], prefs: { ...DEFAULT_PREFS }, feedback: {} });

function readLocal(): LocalData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<LocalData>) };
  } catch {
    return empty();
  }
}
function writeLocal(d: LocalData) {
  try {
    // Keep the log bounded so storage never fills up.
    d.logs = d.logs.slice(-1500);
    d.sessions = d.sessions.slice(-300);
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage blocked or full: progress lasts for this visit only */
  }
}
function mutate(fn: (d: LocalData) => void) {
  const d = readLocal();
  fn(d);
  writeLocal(d);
}

export function hasGuestData(): boolean {
  const d = readLocal();
  return d.library.length > 0 || d.logs.length > 0;
}

export const localStore: Store = {
  remote: false,
  async library() {
    return readLocal().library.sort((a, b) => (b.lastPracticedAt ?? b.addedAt).localeCompare(a.lastPracticedAt ?? a.addedAt));
  },
  async item(slug) {
    return readLocal().library.find((l) => l.slug === slug) ?? null;
  },
  async add(slug) {
    mutate((d) => {
      if (!d.library.some((l) => l.slug === slug)) d.library.push({ slug, stage: 0, sessions: 0, addedAt: new Date().toISOString(), lastPracticedAt: null });
    });
  },
  async update(slug, patch) {
    mutate((d) => {
      const it = d.library.find((l) => l.slug === slug);
      if (it) Object.assign(it, patch);
    });
  },
  async remove(slug) {
    mutate((d) => {
      d.library = d.library.filter((l) => l.slug !== slug);
    });
  },
  async log(entry) {
    mutate((d) => d.logs.push({ ...entry, createdAt: entry.createdAt ?? new Date().toISOString() }));
  },
  async logs(slug, activityId, limit = 50) {
    return readLocal()
      .logs.filter((l) => l.slug === slug && (!activityId || l.activityId === activityId))
      .reverse()
      .slice(0, limit);
  },
  async cards(slug) {
    return readLocal().cards.filter((c) => !slug || c.slug === slug);
  },
  async saveCards(rows) {
    mutate((d) => {
      for (const r of rows) {
        const i = d.cards.findIndex((c) => c.slug === r.slug && c.cardId === r.cardId);
        if (i >= 0) d.cards[i] = r;
        else d.cards.push(r);
      }
    });
  },
  async saveSession(row) {
    mutate((d) => d.sessions.push(row));
  },
  async sessions(limit = 100) {
    return readLocal().sessions.slice(-limit).reverse();
  },
  async prefs() {
    return { ...DEFAULT_PREFS, ...readLocal().prefs };
  },
  async savePrefs(p) {
    mutate((d) => {
      d.prefs = p;
    });
  },
  async feedback(slug, verdict) {
    mutate((d) => {
      d.feedback[slug] = verdict;
    });
  },
  async skipped() {
    return Object.entries(readLocal().feedback)
      .filter(([, v]) => v === "skip")
      .map(([k]) => k);
  },
};

// ---------------------------------------------------------------- Supabase

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

type Row = Record<string, unknown>;
const toItem = (r: Row): LibraryItem => ({
  slug: r.slug as string,
  stage: r.stage as number,
  sessions: r.sessions as number,
  addedAt: r.added_at as string,
  lastPracticedAt: (r.last_practiced_at as string | null) ?? null,
});
const toLog = (r: Row): LogEntry => ({
  slug: r.slug as string,
  stageId: r.stage_id as string,
  activityId: r.activity_id as string,
  kind: r.kind as string,
  attempts: r.attempts as number | null,
  successes: r.successes as number | null,
  score: r.score as number | null,
  level: r.level as number,
  data: (r.data as Record<string, unknown>) ?? {},
  createdAt: r.created_at as string,
});
const fromLog = (e: LogEntry) => ({
  slug: e.slug,
  stage_id: e.stageId,
  activity_id: e.activityId,
  kind: e.kind,
  attempts: e.attempts ?? null,
  successes: e.successes ?? null,
  score: e.score ?? null,
  level: e.level ?? 0,
  data: e.data ?? {},
  ...(e.createdAt ? { created_at: e.createdAt } : {}),
});

export function remoteStore(db: SupabaseClient): Store {
  return {
    remote: true,
    async library() {
      const rows = check(await db.from("library").select("*").eq("archived", false).order("last_practiced_at", { ascending: false, nullsFirst: false }).order("added_at", { ascending: false }));
      return (rows as Row[]).map(toItem);
    },
    async item(slug) {
      const row = check(await db.from("library").select("*").eq("slug", slug).maybeSingle());
      return row ? toItem(row as Row) : null;
    },
    async add(slug) {
      check(await db.from("library").upsert({ slug, archived: false }, { onConflict: "user_id,slug", ignoreDuplicates: false }).select());
    },
    async update(slug, patch) {
      const p: Row = {};
      if (patch.stage !== undefined) p.stage = patch.stage;
      if (patch.sessions !== undefined) p.sessions = patch.sessions;
      if (patch.lastPracticedAt !== undefined) p.last_practiced_at = patch.lastPracticedAt;
      check(await db.from("library").update(p).eq("slug", slug));
    },
    async remove(slug) {
      check(await db.from("library").delete().eq("slug", slug));
    },
    async log(entry) {
      check(await db.from("practice_log").insert(fromLog(entry)));
    },
    async logs(slug, activityId, limit = 50) {
      let q = db.from("practice_log").select("*").eq("slug", slug);
      if (activityId) q = q.eq("activity_id", activityId);
      const rows = check(await q.order("created_at", { ascending: false }).limit(limit));
      return (rows as Row[]).map(toLog);
    },
    async cards(slug) {
      let q = db.from("card_state").select("slug, card_id, state");
      if (slug) q = q.eq("slug", slug);
      const rows = check(await q.limit(2000));
      return (rows as Row[]).map((r) => ({ slug: r.slug as string, cardId: r.card_id as string, state: r.state as CardState }));
    },
    async saveCards(rows) {
      if (!rows.length) return;
      check(await db.from("card_state").upsert(rows.map((r) => ({ slug: r.slug, card_id: r.cardId, due: r.state.due, state: r.state })), { onConflict: "user_id,slug,card_id" }));
    },
    async saveSession(row) {
      check(await db.from("sessions").insert({ slug: row.slug, stage_id: row.stageId, started_at: row.startedAt, ended_at: row.endedAt, goal_met: row.goalMet, note: row.note?.slice(0, 500) ?? null }));
    },
    async sessions(limit = 100) {
      const rows = check(await db.from("sessions").select("*").order("started_at", { ascending: false }).limit(limit));
      return (rows as Row[]).map((r) => ({ slug: r.slug as string, stageId: r.stage_id as string, startedAt: r.started_at as string, endedAt: (r.ended_at as string) ?? (r.started_at as string), goalMet: r.goal_met as boolean | null, note: (r.note as string) ?? undefined }));
    },
    async prefs() {
      const row = check(await db.from("user_prefs").select("prefs").maybeSingle());
      return { ...DEFAULT_PREFS, ...(((row as Row | null)?.prefs as Partial<Prefs>) ?? {}) };
    },
    async savePrefs(p) {
      check(await db.from("user_prefs").upsert({ prefs: p, updated_at: new Date().toISOString() }, { onConflict: "user_id" }));
    },
    async feedback(slug, verdict) {
      check(await db.from("skill_feedback").upsert({ slug, verdict }, { onConflict: "user_id,slug" }));
    },
    async skipped() {
      const rows = check(await db.from("skill_feedback").select("slug").eq("verdict", "skip"));
      return (rows as Row[]).map((r) => r.slug as string);
    },
  };
}

/** Moves guest progress into the account after sign-in, then clears it from the device. */
export async function migrateGuest(remote: Store, db: SupabaseClient): Promise<void> {
  const d = readLocal();
  if (!d.library.length && !d.logs.length && !d.prefs.onboarded) return;
  for (const it of d.library) {
    await remote.add(it.slug);
    const existing = await remote.item(it.slug);
    if (existing && existing.stage < it.stage) await remote.update(it.slug, { stage: it.stage, sessions: existing.sessions + it.sessions, lastPracticedAt: it.lastPracticedAt });
  }
  if (d.logs.length) check(await db.from("practice_log").insert(d.logs.map(fromLog)));
  await remote.saveCards(d.cards);
  for (const s of d.sessions) await remote.saveSession(s);
  const current = await remote.prefs();
  if (!current.onboarded && d.prefs.onboarded) await remote.savePrefs(d.prefs);
  for (const [slug, v] of Object.entries(d.feedback)) await remote.feedback(slug, v);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
