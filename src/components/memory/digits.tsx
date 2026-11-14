"use client";
import { useMemo, useState } from "react";
import { randomDigits } from "@/lib/memory";
import { Feedback, Kicker, NextButton } from "../session/bits";

const TRIALS = 3;

/**
 * Digit span with a staircase: get a number fully right and the next is
 * longer; miss and it gets shorter. Your best span is the record to beat.
 */
export function MemoryDigits({ start, method, onDone }: { start: number; method: "none" | "major"; onDone: (r: { best: number; span: number; trials: { n: number; ok: boolean }[] }) => void }) {
  const [span, setSpan] = useState(start);
  const [trial, setTrial] = useState(0);
  const [trials, setTrials] = useState<{ n: number; ok: boolean }[]>([]);
  const [phase, setPhase] = useState<"ready" | "study" | "recall" | "check">("ready");
  const [answer, setAnswer] = useState("");
  const [seed, setSeed] = useState(0);
  const digits = useMemo(() => randomDigits(span), [span, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = method === "major" ? 2 : 1;
  const groups = method === "major" ? digits.match(/.{1,2}/g)! : digits.match(/.{1,3}/g)!;

  const lastOk = trials[trials.length - 1]?.ok;
  const best = Math.max(0, ...trials.filter((t) => t.ok).map((t) => t.n));

  if (phase === "ready") {
    return (
      <div>
        <Kicker>Digits · round {trial + 1} of {TRIALS}</Kicker>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{span} digits</h2>
        <p className="mt-2 text-[17px] leading-relaxed">
          {method === "major"
            ? "Turn each pair into its Major word, picture it at the next spot in your palace, then tap Done. Take your time."
            : "Study the number as long as you like, then type it back."}
        </p>
        <NextButton onClick={() => setPhase("study")}>Show me</NextButton>
      </div>
    );
  }

  if (phase === "study") {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Kicker>Study</Kicker>
        <p className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-4xl font-semibold tracking-wider">
          {groups.map((g, i) => (
            <span key={i}>{g}</span>
          ))}
        </p>
        <NextButton onClick={() => setPhase("recall")}>Done, hide it</NextButton>
      </div>
    );
  }

  if (phase === "recall") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const ok = answer.replace(/\D/g, "") === digits;
          setTrials([...trials, { n: span, ok }]);
          setPhase("check");
        }}
      >
        <Kicker>Recall</Kicker>
        <label htmlFor="digits-in" className="mt-2 block text-xl font-semibold tracking-tight">
          Type the {span} digits
        </label>
        <input
          id="digits-in"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="mt-4 min-h-12 w-full rounded-xl border border-border bg-surface px-4 font-mono text-2xl tracking-wider"
        />
        <button type="submit" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-medium text-on-accent">
          Check
        </button>
      </form>
    );
  }

  const typed = answer.replace(/\D/g, "");
  const done = trial + 1 >= TRIALS;
  return (
    <div>
      <Kicker>Round {trial + 1} of {TRIALS}</Kicker>
      <p className="mt-4 font-mono text-2xl tracking-wider" aria-label={`The number was ${digits}`}>
        {digits.split("").map((d, i) => (
          <span key={i} className={typed[i] === d ? "text-good" : "text-warn underline"}>
            {d}
          </span>
        ))}
      </p>
      <Feedback good={Boolean(lastOk)}>{lastOk ? `All ${span} right. ${done ? "" : `Next one is ${span + step}.`}` : `Not quite. ${done ? "" : `Next one is ${Math.max(3, span - step)}.`}`}</Feedback>
      {done && <p className="mt-4 text-lg">Best this session: {best > 0 ? `${best} digits` : "keep going, it comes quickly"}</p>}
      <NextButton
        onClick={() => {
          const nextSpan = lastOk ? span + step : Math.max(3, span - step);
          if (done) {
            onDone({ best, span: nextSpan, trials });
            return;
          }
          setTrial(trial + 1);
          setSpan(nextSpan);
          setSeed((s) => s + 1);
          setAnswer("");
          setPhase("ready");
        }}
      >
        {done ? "Continue" : "Next round"}
      </NextButton>
    </div>
  );
}
