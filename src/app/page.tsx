"use client";
import Link from "next/link";
import { useStore } from "@/components/store-provider";
import { SkillSearch } from "@/components/skill/skill-search";
import { SkillTile } from "@/components/skill/skill-tile";
import { Spinner } from "@/components/ui";
import { suggest } from "@/lib/discover";
import { getSkill } from "@/lib/skills-client";
import { isDue } from "@/lib/srs";
import { stageReady } from "@/lib/skill/schema";
import { useLoad } from "@/lib/use-load";

/**
 * Today: one clear next step, a search box, and up to three ideas.
 * Enough to never feel empty, never so much that it feels like work.
 */
export default function Today() {
  const { store, ready } = useStore();
  const { data, loading } = useLoad(async () => {
    if (!ready) return null;
    const [library, prefs, cards, skipped] = await Promise.all([store.library(), store.prefs(), store.cards(), store.skipped()]);
    const top = library[0];
    const spec = top ? await getSkill(top.slug).catch(() => null) : null;
    const due = cards.filter((c) => isDue(c.state)).length;
    const exclude = new Set([...skipped, ...library.map((l) => l.slug)]);
    const ideas = suggest({ prefs, exclude, count: library.length ? 2 : 3 });
    return { library, top, spec, due, ideas };
  }, [store, ready]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner label="Loading…" />
      </div>
    );
  }

  const { top, spec, due, ideas, library } = data;
  const stageIndex = top && spec ? Math.min(top.stage, spec.stages.length - 1) : 0;
  const stage = spec?.stages[stageIndex];
  const finished = top && spec ? top.stage >= spec.stages.length : false;

  return (
    <div className="flex flex-col gap-8">
      {top && spec && stage ? (
        <section aria-labelledby="continue" className="rise">
          <p id="continue" className="text-sm text-muted">
            {top.lastPracticedAt ? "Pick up where you left off" : "Ready when you are"}
          </p>
          <div className="mt-2 rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-3xl">{spec.emoji}</span>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight">{spec.name}</h1>
                <p className="text-sm text-muted">
                  {finished ? "Plan complete. Keep it sharp." : `Stage ${stageIndex + 1} of ${spec.stages.length} · ${stage.title}`}
                </p>
              </div>
            </div>
            <p className="mt-4 text-[15px]">
              <span className="text-muted">Today&apos;s goal: </span>
              {stage.goal}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/practice?s=${spec.slug}&stage=${stageIndex}`}
                className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-on-accent hover:bg-accent-hover"
              >
                {stageReady(stage) ? `Start · about ${stage.minutes} min` : "Prepare this session"}
              </Link>
              <Link href={`/skill?s=${spec.slug}`} className="text-sm text-muted underline-offset-4 hover:underline">
                See the whole plan
              </Link>
            </div>
          </div>
          {due > 0 && (
            <Link href="/review" className="mt-3 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3 text-sm">
              <span>
                <strong>{due}</strong> quick {due === 1 ? "recall is" : "recalls are"} due. About {Math.max(1, Math.round(due * 0.25))} min.
              </span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </section>
      ) : (
        <section className="rise pt-4 text-center sm:pt-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What do you want to get good at?</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Pick anything, from chess to free throws. You get a short, focused plan built on how people really improve.
          </p>
        </section>
      )}

      <SkillSearch />

      <section aria-labelledby="ideas">
        <div className="flex items-baseline justify-between">
          <h2 id="ideas" className="text-sm font-medium text-muted">
            {library.length ? "Something new" : "Or start with one of these"}
          </h2>
          <Link href="/discover" className="text-sm text-accent">
            Shuffle more
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-3">
          {ideas.map((e) => (
            <li key={e.slug}>
              <SkillTile entry={e} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
