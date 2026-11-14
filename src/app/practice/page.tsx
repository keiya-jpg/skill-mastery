"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Drill } from "@/components/session/drill";
import { Engine } from "@/components/session/engine";
import { Explain } from "@/components/session/explain";
import { ImageryPlayer } from "@/components/session/imagery";
import { Kicker, NextButton } from "@/components/session/bits";
import { Order } from "@/components/session/order";
import { Quiz } from "@/components/session/quiz";
import { Recall } from "@/components/session/recall";
import { Reflect } from "@/components/session/reflect";
import type { ActivityCtx, ActivityResult } from "@/components/session/types";
import { Warmup, type DueCard } from "@/components/session/warmup";
import { useStore } from "@/components/store-provider";
import { Alert, Spinner } from "@/components/ui";
import { stageReady, type Activity, type SkillSpec, type Stage } from "@/lib/skill/schema";
import { ensureStage, getSkill } from "@/lib/skills-client";
import { isDue, newCard } from "@/lib/srs";
import type { LibraryItem, LogEntry } from "@/lib/store";

type Phase = { k: "intro" } | { k: "warmup" } | { k: "activity"; i: number } | { k: "close" } | { k: "summary"; goalMet: boolean; added: number };

const MAX_WARMUP = 5;

function ActivityView({ activity, ctx, onDone }: { activity: Activity; ctx: ActivityCtx; onDone: (r: ActivityResult) => void }) {
  switch (activity.type) {
    case "explain":
      return <Explain activity={activity} ctx={ctx} onDone={onDone} />;
    case "quiz":
      return <Quiz activity={activity} ctx={ctx} onDone={onDone} />;
    case "recall":
      return <Recall activity={activity} ctx={ctx} onDone={onDone} />;
    case "order":
      return <Order activity={activity} ctx={ctx} onDone={onDone} />;
    case "drill":
      return <Drill activity={activity} ctx={ctx} onDone={onDone} />;
    case "imagery":
      return <ImageryPlayer title={activity.title} script={activity.script} seconds={activity.seconds} onDone={() => onDone({})} />;
    case "reflect":
      return <Reflect activity={activity} ctx={ctx} onDone={onDone} />;
    case "engine":
      return <Engine activity={activity} ctx={ctx} onDone={onDone} />;
  }
}

/**
 * A session is a focus mode: no navigation, one activity on screen, a thin
 * progress line, and a clear finish. Arc: arrive with one goal, warm up with
 * spaced recall, learn one idea, practise it with feedback, then close.
 */
function Practice() {
  const params = useSearchParams();
  const slug = params.get("s") ?? "";
  const stageIndex = Math.max(0, Number(params.get("stage") ?? 0) || 0);
  const router = useRouter();
  const { user } = useAuth();
  const { store, ready } = useStore();
  const [spec, setSpec] = useState<SkillSpec | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [due, setDue] = useState<DueCard[]>([]);
  const [phase, setPhase] = useState<Phase>({ k: "intro" });
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [plan, setPlan] = useState("");
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    if (!ready || !slug) return;
    let live = true;
    (async () => {
      try {
        const s = await getSkill(slug);
        if (!s) throw new Error("That skill couldn't be found.");
        if (!live) return;
        setSpec(s);
        let st = s.stages[stageIndex];
        if (!st) throw new Error("That stage doesn't exist.");
        await store.add(slug);
        const [it, lg, cards, prefs] = await Promise.all([store.item(slug), store.logs(slug, undefined, 300), store.cards(slug), store.prefs()]);
        if (!live) return;
        setItem(it);
        setLogs(lg);
        setPlan(prefs.plan ?? "");
        const byId = new Map(s.stages.flatMap((x) => x.cards).map((c) => [c.id, c]));
        setDue(
          cards
            .filter((c) => isDue(c.state) && byId.has(c.cardId))
            .sort((a, b) => a.state.due.localeCompare(b.state.due))
            .slice(0, MAX_WARMUP)
            .map((row) => ({ row, card: byId.get(row.cardId)! })),
        );
        if (!stageReady(st)) {
          if (!user) throw new Error("This session hasn't been prepared yet. Log in to have it built (it only happens once, for everyone).");
          setPreparing(true);
          st = await ensureStage(slug, stageIndex);
          if (!live) return;
          setPreparing(false);
        }
        setStage(st);
        // Quietly prepare the next stage so it's ready when they get there.
        const next = s.stages[stageIndex + 1];
        if (user && next && !stageReady(next) && s.source !== "seed") ensureStage(slug, stageIndex + 1).catch(() => {});
      } catch (e) {
        if (live) {
          setPreparing(false);
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [ready, slug, stageIndex, store, user]);

  const ctxFor = useMemo(
    () => (a: Activity): ActivityCtx => ({ slug, stageId: stage?.id ?? "", store, history: logs.filter((l) => l.activityId === a.id) }),
    [slug, stage, store, logs],
  );

  if (error) {
    return (
      <div className="flex flex-col gap-4 py-10">
        <Alert>{error}</Alert>
        <div className="flex gap-4">
          {!user && (
            <Link href={`/login?next=${encodeURIComponent(`/practice?s=${slug}&stage=${stageIndex}`)}`} className="text-accent">
              Log in
            </Link>
          )}
          <Link href={slug ? `/skill?s=${slug}` : "/"} className="text-accent">
            Back
          </Link>
        </div>
      </div>
    );
  }

  if (!spec || !stage) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center text-muted">
        {preparing ? (
          <>
            <span className="breathe block h-16 w-16 rounded-full bg-accent-soft" aria-hidden />
            <p className="max-w-xs">Preparing this session. It&apos;s built once and saved, so it&apos;s instant from now on.</p>
            <Spinner label="Working…" />
          </>
        ) : (
          <Spinner label="Loading…" />
        )}
      </div>
    );
  }

  const acts = stage.activities;
  const steps = (due.length ? 1 : 0) + acts.length + 1;
  const position = phase.k === "intro" ? 0 : phase.k === "warmup" ? 1 : phase.k === "activity" ? (due.length ? 1 : 0) + phase.i + 1 : steps;
  const pct = Math.round((position / steps) * 100);

  async function record(a: Activity, r: ActivityResult) {
    const entry: LogEntry = {
      slug,
      stageId: stage!.id,
      activityId: a.id,
      kind: a.type === "engine" ? `engine:${a.engine}` : a.type,
      attempts: r.attempts ?? null,
      successes: r.successes ?? null,
      score: r.score ?? null,
      level: r.level ?? 0,
      data: r.data ?? {},
      createdAt: new Date().toISOString(),
    };
    setLogs((l) => [entry, ...l]);
    await store.log(entry).catch((e) => console.warn("[log]", e));
  }

  function after(i: number) {
    if (i + 1 < acts.length) setPhase({ k: "activity", i: i + 1 });
    else setPhase({ k: "close" });
  }

  async function close(goalMet: boolean) {
    const now = new Date().toISOString();
    const existing = new Set((await store.cards(slug)).map((c) => c.cardId));
    const fresh = stage!.cards.filter((c) => !existing.has(c.id)).map((c) => ({ slug, cardId: c.id, state: newCard() }));
    await store.saveCards(fresh).catch(() => {});
    const current = item ?? (await store.item(slug));
    const advance = goalMet && (current?.stage ?? 0) === stageIndex;
    await store.update(slug, { stage: advance ? stageIndex + 1 : (current?.stage ?? 0), sessions: (current?.sessions ?? 0) + 1, lastPracticedAt: now }).catch(() => {});
    await store.saveSession({ slug, stageId: stage!.id, startedAt: startedAt.current, endedAt: now, goalMet }).catch(() => {});
    setPhase({ k: "summary", goalMet, added: fresh.length });
  }

  const nextStage = spec.stages[stageIndex + 1];

  return (
    <div className="flex min-h-dvh flex-col pt-3">
      <div className="flex items-center gap-3">
        <Link href={`/skill?s=${slug}`} aria-label="Leave session" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span aria-hidden className="w-10 text-center text-xl">{spec.emoji}</span>
      </div>

      <div key={phase.k === "activity" ? `a${phase.i}` : phase.k} className="rise flex-1 pt-8">
        {phase.k === "intro" && (
          <div>
            <Kicker>
              {spec.name} · stage {stageIndex + 1} of {spec.stages.length}
            </Kicker>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{stage.title}</h1>
            <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm text-muted">Today&apos;s one goal</p>
              <p className="mt-1 text-lg">{stage.goal}</p>
            </div>
            <details className="mt-4 text-[15px]">
              <summary className="cursor-pointer text-muted">Why this matters</summary>
              <p className="mt-2 leading-relaxed">{stage.why}</p>
            </details>
            <p className="mt-6 text-sm text-muted">
              About {stage.minutes} minutes{due.length ? `, starting with ${due.length} quick recall${due.length > 1 ? "s" : ""}` : ""}. Silence your notifications, it helps more than you&apos;d think.
            </p>
            <NextButton onClick={() => setPhase(due.length ? { k: "warmup" } : { k: "activity", i: 0 })}>I&apos;m ready</NextButton>
          </div>
        )}

        {phase.k === "warmup" && (
          <Warmup cards={due} onSave={(rows) => store.saveCards(rows)} onDone={() => setPhase({ k: "activity", i: 0 })} />
        )}

        {phase.k === "activity" && acts[phase.i] && (
          <ActivityView
            activity={acts[phase.i]!}
            ctx={ctxFor(acts[phase.i]!)}
            onDone={(r) => {
              const a = acts[(phase as { i: number }).i]!;
              void record(a, r);
              after((phase as { i: number }).i);
            }}
          />
        )}

        {phase.k === "close" && (
          <div>
            <Kicker>Last step</Kicker>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Did you reach today&apos;s goal?</h2>
            <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-[17px]">{stage.goal}</p>
            <p className="mt-3 text-sm text-muted">Be honest: &ldquo;not yet&rdquo; just means you get this stage again, which is how practice works. Most stages take a few sessions.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => close(true)} className="min-h-14 rounded-xl bg-accent font-medium text-on-accent">
                Yes
              </button>
              <button type="button" onClick={() => close(false)} className="min-h-14 rounded-xl border border-border bg-surface font-medium">
                Not yet
              </button>
            </div>
          </div>
        )}

        {phase.k === "summary" && (
          <div>
            <div aria-hidden className="pop text-5xl">{phase.goalMet ? "🎯" : "🌱"}</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{phase.goalMet ? "Stage done." : "Good session."}</h2>
            <p className="mt-2 text-[17px] leading-relaxed">
              {phase.goalMet
                ? nextStage
                  ? `Next time: ${nextStage.title}.`
                  : "That's the whole plan. Come back to keep it sharp; skills fade without use."
                : "Same goal next time. You'll start from where you are now, and the practice adjusts to you."}
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-[15px] text-muted">
              {phase.added > 0 && <li>· {phase.added} key {phase.added === 1 ? "idea comes" : "ideas come"} back as a quick recall next session.</li>}
              {spec.kind !== "mental" && <li>· Sleep tonight does a lot of the locking-in. Seriously.</li>}
              <li>· Spacing sessions a day or two apart beats one long session.</li>
            </ul>
            <div className="mt-6 rounded-xl border border-border bg-surface p-4">
              <label htmlFor="plan" className="font-medium">
                When and where is your next session?
              </label>
              <p className="text-sm text-muted">Optional. People who decide this are far more likely to follow through.</p>
              <input
                id="plan"
                value={plan}
                maxLength={120}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="e.g. Tomorrow after dinner, in my room"
                className="mt-3 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base"
              />
            </div>
            <NextButton
              onClick={async () => {
                if (plan.trim()) {
                  const prefs = await store.prefs();
                  await store.savePrefs({ ...prefs, plan: plan.trim() }).catch(() => {});
                }
                router.push("/");
              }}
            >
              Done
            </NextButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}
