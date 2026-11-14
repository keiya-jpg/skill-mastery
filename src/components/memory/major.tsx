"use client";
import { useMemo, useState } from "react";
import { MAJOR_EXAMPLES, majorDigits, randomPairs } from "@/lib/memory";
import { Feedback, Kicker, NextButton } from "../session/bits";

const KEY = [
  ["0", "s z"],
  ["1", "t d"],
  ["2", "n"],
  ["3", "m"],
  ["4", "r"],
  ["5", "l"],
  ["6", "j sh ch"],
  ["7", "k g"],
  ["8", "f v"],
  ["9", "p b"],
];

/**
 * Number to word. The key is visible at first and can be hidden once you
 * know it (fading support). Words are checked by spelling, which is close
 * to sound but not perfect, so "It sounds right" lets you overrule it.
 */
export function MemoryMajor({ rounds, onDone }: { rounds: number; onDone: (r: { attempts: number; correct: number }) => void }) {
  const numbers = useMemo(() => randomPairs(rounds), [rounds]);
  const [i, setI] = useState(0);
  const [word, setWord] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [correct, setCorrect] = useState(0);
  const [showKey, setShowKey] = useState(true);
  const n = numbers[i]!;

  function next(ok: boolean) {
    const c = correct + (ok ? 1 : 0);
    setCorrect(c);
    if (i + 1 >= rounds) onDone({ attempts: rounds, correct: c });
    else {
      setI(i + 1);
      setWord("");
      setChecked(null);
    }
  }

  return (
    <div>
      <Kicker>
        Number to word · {i + 1} of {rounds}
      </Kicker>
      {showKey ? (
        <div className="mt-3 grid grid-cols-5 gap-1 rounded-xl bg-surface-2 p-2 text-center text-sm">
          {KEY.map(([d, s]) => (
            <div key={d} className="rounded-md bg-surface px-1 py-1">
              <span className="block font-semibold">{d}</span>
              <span className="text-muted">{s}</span>
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => setShowKey(!showKey)} className="mt-2 text-sm text-accent">
        {showKey ? "Hide the key (test yourself)" : "Show the key"}
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (checked === null && word.trim()) setChecked(majorDigits(word) === n);
        }}
      >
        <label htmlFor="major-word" className="mt-4 block text-4xl font-semibold tabular-nums">
          {n}
        </label>
        <input
          id="major-word"
          value={word}
          autoComplete="off"
          autoCapitalize="none"
          autoFocus
          disabled={checked !== null}
          placeholder="A word you can picture"
          onChange={(e) => setWord(e.target.value)}
          className="mt-3 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-lg"
        />
        {checked === null && (
          <div className="mt-4 flex gap-3">
            <button type="submit" className="inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-medium text-on-accent">
              Check
            </button>
            <button type="button" className="text-sm text-muted" onClick={() => setChecked(false)}>
              I&apos;m stuck
            </button>
          </div>
        )}
      </form>
      {checked !== null && (
        <>
          <Feedback good={checked}>
            {checked ? (
              <>Yes: {word.trim()} = {n}.</>
            ) : (
              <>
                {word.trim() ? <>By spelling, &ldquo;{word.trim()}&rdquo; reads as {majorDigits(word) || "no digits"}. </> : null}
                {MAJOR_EXAMPLES[n] ? <>For {n}, try &ldquo;{MAJOR_EXAMPLES[n]!.join("” or “")}&rdquo;.</> : <>For {n}: {n.split("").map((d) => KEY[Number(d)]![1]!.split(" ")[0]).join(" + ")} plus any vowels.</>}
              </>
            )}
          </Feedback>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <NextButton onClick={() => next(checked)}>{i + 1 >= rounds ? "Finish" : "Next number"}</NextButton>
            {!checked && word.trim() && (
              <button type="button" className="mt-6 text-sm text-accent" onClick={() => next(true)}>
                It sounds right, count it
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
