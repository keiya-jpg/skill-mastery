"use client";
import { useState } from "react";
import type { SkillCard } from "@/lib/skill/schema";
import { review, whenLabel, type Recall } from "@/lib/srs";
import type { CardRow } from "@/lib/store";
import { Kicker, NextButton } from "./bits";

export interface DueCard {
  row: CardRow;
  card: SkillCard;
  skillName?: string;
}

/**
 * Quick spaced recall of things learned in earlier sessions. Answer in your
 * head first, then flip and judge. Each card's next appearance depends on
 * how easily you remembered it (FSRS).
 */
export function Warmup({ cards, onSave, onDone, title = "Warm-up" }: { cards: DueCard[]; onSave: (rows: CardRow[]) => Promise<void>; onDone: (r: { reviewed: number; remembered: number }) => void; title?: string }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [remembered, setRemembered] = useState(0);
  const c = cards[i];
  if (!c) return null;

  async function grade(g: Recall) {
    const next = review(c!.row.state, g);
    await onSave([{ ...c!.row, state: next }]).catch(() => {});
    const r = remembered + (g >= 3 ? 1 : 0);
    setRemembered(r);
    if (i + 1 >= cards.length) onDone({ reviewed: cards.length, remembered: r });
    else {
      setI(i + 1);
      setShown(false);
    }
  }

  const preview = (g: Recall) => whenLabel(review(c.row.state, g).due);

  return (
    <div>
      <Kicker>
        {title} · {i + 1} of {cards.length}
        {c.skillName ? ` · ${c.skillName}` : ""}
      </Kicker>
      <h2 key={c.card.id} className="rise mt-2 text-xl font-semibold tracking-tight">
        {c.card.front}
      </h2>
      {!shown ? (
        <>
          <p className="mt-2 text-sm text-muted">Answer in your head first. Pulling it out is what makes it stick.</p>
          <NextButton onClick={() => setShown(true)}>Show answer</NextButton>
        </>
      ) : (
        <div className="rise">
          <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
            <p className="text-[17px]">{c.card.back}</p>
            {c.card.tip && <p className="mt-2 text-sm text-muted">💡 {c.card.tip}</p>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                [1, "Forgot"],
                [2, "Hard"],
                [3, "Got it"],
                [4, "Easy"],
              ] as [Recall, string][]
            ).map(([g, label]) => (
              <button key={g} type="button" onClick={() => grade(g)} className="flex min-h-14 flex-col items-center justify-center rounded-xl border border-border bg-surface hover:border-accent">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted">{preview(g)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
