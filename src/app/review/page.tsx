"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NextButton } from "@/components/session/bits";
import { Warmup, type DueCard } from "@/components/session/warmup";
import { useStore } from "@/components/store-provider";
import { Spinner } from "@/components/ui";
import { getSkill } from "@/lib/skills-client";
import { isDue } from "@/lib/srs";
import { useLoad } from "@/lib/use-load";

/** All due recalls across skills, mixed together (interleaving), 20 at most. */
export default function Review() {
  const { store, ready } = useStore();
  const router = useRouter();
  const [result, setResult] = useState<{ reviewed: number; remembered: number } | null>(null);
  const { data, loading } = useLoad(async () => {
    if (!ready) return null;
    const rows = (await store.cards()).filter((c) => isDue(c.state));
    const slugs = [...new Set(rows.map((r) => r.slug))];
    const specs = new Map((await Promise.all(slugs.map(async (s) => [s, await getSkill(s).catch(() => null)] as const))).filter(([, v]) => v));
    const cards: DueCard[] = [];
    for (const row of rows) {
      const spec = specs.get(row.slug);
      const card = spec?.stages.flatMap((s) => s.cards).find((c) => c.id === row.cardId);
      if (spec && card) cards.push({ row, card, skillName: spec.name });
    }
    return cards.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [store, ready]);

  return (
    <div className="pt-3">
      <Link href="/" aria-label="Leave review" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </Link>
      <div className="pt-6">
        {loading || !data ? (
          <Spinner label="Loading…" />
        ) : result ? (
          <div className="rise">
            <h1 className="text-2xl font-semibold tracking-tight">
              {result.remembered} of {result.reviewed} remembered
            </h1>
            <p className="mt-2 text-muted">Each one is scheduled to come back just before you&apos;d forget it.</p>
            <NextButton onClick={() => router.push("/")}>Done</NextButton>
          </div>
        ) : data.length === 0 ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nothing due</h1>
            <p className="mt-2 text-muted">You&apos;re up to date. Recalls appear here after your sessions.</p>
            <NextButton onClick={() => router.push("/")}>Back</NextButton>
          </div>
        ) : (
          <Warmup title="Recall" cards={data} onSave={(rows) => store.saveCards(rows)} onDone={setResult} />
        )}
      </div>
    </div>
  );
}
