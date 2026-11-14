"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/components/store-provider";
import { Alert, Button, Spinner } from "@/components/ui";
import { isConfigured } from "@/lib/env";
import { stageReady, type SkillSpec } from "@/lib/skill/schema";
import { ensureStage, getSkill, resolveSkill } from "@/lib/skills-client";
import type { LibraryItem } from "@/lib/store";

const KIND_LABEL = { mental: "Mind", physical: "Body", mixed: "Mind + body" } as const;

function SkillPage() {
  const params = useSearchParams();
  const slug = params.get("s") ?? "";
  const query = params.get("q");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { store, ready } = useStore();
  const [spec, setSpec] = useState<SkillSpec | null | undefined>(undefined);
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || authLoading || !ready) return;
    let live = true;
    (async () => {
      setError(null);
      const found = await getSkill(slug).catch(() => null);
      if (!live) return;
      if (found) {
        setSpec(found);
        setItem(await store.item(found.slug));
        return;
      }
      if (!query) return setSpec(null);
      if (!user) return setSpec(null);
      setBuilding(true);
      try {
        const res = await resolveSkill(query);
        // Start building stage 1 now, so it's ready (or nearly) by the time they press Start.
        if (res.created) ensureStage(res.slug, 0).catch(() => {});
        if (!live) return;
        if (res.slug !== slug) {
          router.replace(`/skill?s=${res.slug}`);
          return;
        }
        const built = await getSkill(res.slug, true);
        if (!live) return;
        setSpec(built);
        setItem(built ? await store.item(built.slug) : null);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (live) setBuilding(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug, query, user, authLoading, ready, store, router]);

  if (building) {
    return (
      <div className="rise mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <span className="breathe block h-16 w-16 rounded-full bg-accent-soft" aria-hidden />
        <h1 className="text-xl font-semibold">Designing a plan for {query}</h1>
        <p className="text-muted">
          Breaking it into stages, each with one clear goal you can check. This takes about 10 seconds, and it&apos;s saved so nobody waits for it again.
        </p>
        <Spinner label="Working…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-10">
        <Alert>{error}</Alert>
        <Link href="/discover" className="text-accent">Back to discover</Link>
      </div>
    );
  }

  if (spec === undefined) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (spec === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 py-10">
        {query && !user ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Build a plan for &ldquo;{query}&rdquo;</h1>
            <p className="text-muted">
              Nobody has asked for this one yet. Building a new plan uses AI, so it needs a free account. Your progress will follow you to every device.
            </p>
            {!isConfigured && <Alert tone="info">Accounts aren&apos;t set up on this server yet.</Alert>}
            <Link
              href={`/signup?next=${encodeURIComponent(`/skill?s=${slug}&q=${encodeURIComponent(query)}`)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 font-medium text-on-accent"
            >
              Create a free account
            </Link>
            <Link href={`/login?next=${encodeURIComponent(`/skill?s=${slug}&q=${encodeURIComponent(query)}`)}`} className="text-center text-sm text-accent">
              I already have one
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">That skill isn&apos;t here</h1>
            <Link href="/discover" className="text-accent">Find another</Link>
          </>
        )}
      </div>
    );
  }

  const current = item ? Math.min(item.stage, spec.stages.length - 1) : 0;
  const done = item ? item.stage : 0;

  async function start() {
    if (!spec) return;
    if (!item) await store.add(spec.slug);
    router.push(`/practice?s=${spec.slug}&stage=${current}`);
  }

  return (
    <div className="rise flex flex-col gap-8">
      <header>
        <div aria-hidden className="text-5xl">{spec.emoji}</div>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted">{KIND_LABEL[spec.kind]}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{spec.name}</h1>
        <p className="mt-3 text-lg leading-relaxed">{spec.hook}</p>
        <p className="mt-3 text-muted">{spec.summary}</p>
        {spec.equipment.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-text">You need: </span>
            {spec.equipment.join(", ")}
          </p>
        )}
      </header>

      {spec.honesty && (
        <aside className="rounded-xl border border-warn/30 bg-warn-soft p-4 text-[15px]">
          <p className="font-medium">The straight answer</p>
          <p className="mt-1 leading-relaxed">{spec.honesty}</p>
        </aside>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button className="min-h-12 px-6 text-base" onClick={start}>
          {item ? (done >= spec.stages.length ? "Practise again" : `Continue · stage ${current + 1}`) : "Start stage 1"}
        </Button>
        {!item && <span className="text-sm text-muted">Saved to your library when you start.</span>}
      </div>

      <section aria-labelledby="plan">
        <h2 id="plan" className="text-sm font-medium text-muted">
          The plan · {spec.stages.length} stages
        </h2>
        <ol className="mt-3 flex flex-col">
          {spec.stages.map((s, i) => {
            const state = i < done ? "done" : i === current ? "current" : "later";
            return (
              <li key={s.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < spec.stages.length - 1 && <span aria-hidden className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" />}
                <span
                  aria-hidden
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    state === "done" ? "bg-good text-surface" : state === "current" ? "bg-accent text-on-accent" : "border border-border bg-surface text-muted"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <div className="min-w-0 pt-1">
                  <p className={state === "later" ? "text-muted" : "font-medium"}>
                    {s.title}
                    <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current)" : ""}</span>
                  </p>
                  {state === "current" && <p className="mt-1 text-sm text-muted">Goal: {s.goal}</p>}
                  {state !== "current" && item && (stageReady(s) || i <= done) && (
                    <Link href={`/practice?s=${spec.slug}&stage=${i}`} className="mt-1 inline-block text-sm text-accent">
                      {state === "done" ? "Practise again" : "Peek ahead"}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {item && (
        <button
          type="button"
          className="self-start text-sm text-muted hover:text-text"
          onClick={async () => {
            await store.remove(spec.slug);
            router.push("/library");
          }}
        >
          Remove from my library
        </button>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SkillPage />
    </Suspense>
  );
}
