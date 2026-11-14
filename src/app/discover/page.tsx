"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { skillHref } from "@/components/skill/skill-tile";
import { Button, Spinner } from "@/components/ui";
import { INTERESTS, suggest } from "@/lib/discover";
import type { CatalogEntry } from "@/lib/skill/catalog";
import type { SkillKind } from "@/lib/skill/schema";
import { storedSkills } from "@/lib/skills-client";
import { DEFAULT_PREFS, type Prefs } from "@/lib/store";
import { useLoad } from "@/lib/use-load";

const KIND_LABEL = { mental: "Mind", physical: "Body", mixed: "Mind + body" } as const;

/**
 * One skill at a time. A single card is easy to judge; a wall of options
 * is where choice overload bites, especially when you're bored and have no
 * strong preference yet.
 */
export default function Discover() {
  const { store, ready } = useStore();
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const { data, loading, reload } = useLoad(async () => {
    if (!ready) return null;
    const [prefs, skipped, library, stored] = await Promise.all([store.prefs(), store.skipped(), store.library(), storedSkills().catch(() => [])]);
    const exclude = new Set([...skipped, ...library.map((l) => l.slug)]);
    const deck = suggest({ prefs, exclude, stored: stored.map((s) => ({ ...s, built: true })), count: 30 });
    return { prefs, deck };
  }, [store, ready]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!data.prefs.onboarded || editing) {
    return (
      <PrefsForm
        initial={data.prefs}
        onDone={async (p) => {
          await store.savePrefs({ ...p, onboarded: true });
          setEditing(false);
          setIndex(0);
          reload();
        }}
      />
    );
  }

  const deck = data.deck;
  const card: CatalogEntry | undefined = deck[index % Math.max(deck.length, 1)];
  const next = () => setIndex((i) => i + 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <button type="button" onClick={() => setEditing(true)} className="text-sm text-accent">
          Tune suggestions
        </button>
      </div>

      {card ? (
        <article key={`${card.slug}-${index}`} className="rise rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-live="polite">
          <div aria-hidden className="text-5xl">{card.emoji}</div>
          <p className="mt-4 text-xs uppercase tracking-wider text-muted">{KIND_LABEL[card.kind]}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{card.name}</h2>
          <p className="mt-3 text-lg leading-relaxed">{card.hook}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={skillHref(card)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent px-5 font-medium text-on-accent hover:bg-accent-hover">
              Try it
            </Link>
            <Button variant="secondary" className="min-h-12 flex-1" onClick={next}>
              Show another
            </Button>
          </div>
          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted hover:text-text"
            onClick={async () => {
              await store.feedback(card.slug, "skip");
              next();
            }}
          >
            Not for me, don&apos;t suggest it again
          </button>
        </article>
      ) : (
        <p className="text-muted">You&apos;ve seen everything that matches. Try widening your preferences, or search for anything.</p>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-sm transition-colors ${on ? "border-accent bg-accent-soft text-text" : "border-border bg-surface text-muted hover:text-text"}`}
    >
      {children}
    </button>
  );
}

/** Three quick questions. Everything is optional; "Skip" uses sensible defaults. */
function PrefsForm({ initial, onDone }: { initial: Prefs; onDone: (p: Prefs) => void }) {
  const [p, setP] = useState<Prefs>(initial.onboarded ? initial : { ...DEFAULT_PREFS });
  const kindsChoice = p.kinds.length === 3 ? "both" : p.kinds.includes("physical") ? "physical" : "mental";
  const setKinds = (k: "mental" | "physical" | "both") =>
    setP({ ...p, kinds: (k === "both" ? ["mental", "physical", "mixed"] : [k, "mixed"]) as SkillKind[] });
  const toggleInterest = (t: string) =>
    setP({ ...p, interests: p.interests.includes(t) ? p.interests.filter((x) => x !== t) : [...p.interests, t].slice(-6) });

  return (
    <div className="rise mx-auto flex max-w-lg flex-col gap-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What sounds fun?</h1>
        <p className="mt-1 text-muted">Three quick taps so suggestions fit you. You can change this any time.</p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Mind, body, or both?</legend>
        <div className="flex flex-wrap gap-2">
          <Chip on={kindsChoice === "mental"} onClick={() => setKinds("mental")}>Mind</Chip>
          <Chip on={kindsChoice === "physical"} onClick={() => setKinds("physical")}>Body</Chip>
          <Chip on={kindsChoice === "both"} onClick={() => setKinds("both")}>Both</Chip>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Where are you usually?</legend>
        <div className="flex flex-wrap gap-2">
          <Chip on={!p.indoorOnly && !p.noGearOnly} onClick={() => setP({ ...p, indoorOnly: false, noGearOnly: false })}>Anywhere</Chip>
          <Chip on={p.indoorOnly && !p.noGearOnly} onClick={() => setP({ ...p, indoorOnly: true, noGearOnly: false })}>Indoors</Chip>
          <Chip on={p.noGearOnly} onClick={() => setP({ ...p, indoorOnly: true, noGearOnly: true })}>Just me and my phone</Chip>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Anything that pulls you in? <span className="font-normal text-muted">(optional)</span></legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((t) => (
            <Chip key={t} on={p.interests.includes(t)} onClick={() => toggleInterest(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => onDone(p)}>
          Show me skills
        </Button>
        <Button variant="ghost" onClick={() => onDone({ ...DEFAULT_PREFS })}>
          Skip
        </Button>
      </div>
    </div>
  );
}
