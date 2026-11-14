"use client";
import { useEffect, useState } from "react";
import { Kicker, NextButton } from "./bits";

/**
 * Guided mental rehearsal. Imagery plus real practice beats real practice
 * alone in many studies; it works best vivid, first-person and in real time.
 */
export function ImageryPlayer({ title, script, seconds, onDone, doneLabel = "Done" }: { title: string; script: string; seconds: number; onDone: () => void; doneLabel?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return (
    <div>
      <Kicker>Rehearse in your mind</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 text-[17px] leading-relaxed">{script}</p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <span aria-hidden className={`block h-28 w-28 rounded-full bg-accent-soft ${left !== null && left > 0 ? "breathe" : ""}`} />
        {left === null ? (
          <p className="text-sm text-muted">Read it once, then close your eyes and run it at real speed.</p>
        ) : left > 0 ? (
          <p className="text-2xl tabular-nums" aria-live="off">{left}s</p>
        ) : (
          <p className="text-sm">Nice. Open your eyes.</p>
        )}
      </div>
      {left === null ? (
        <NextButton onClick={() => setLeft(seconds)}>Start {seconds} seconds</NextButton>
      ) : (
        <NextButton onClick={onDone}>{left > 0 ? "Finish early" : doneLabel}</NextButton>
      )}
    </div>
  );
}
