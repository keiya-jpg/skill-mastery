"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { sameWord, sample, WORDS } from "@/lib/memory";
import { Feedback, Kicker, NextButton } from "../session/bits";

/**
 * Word lists. Baseline: each word shows for 3 seconds, no technique.
 * Palace: self-paced, each word shown with the spot to place it at, and the
 * spots are the cues at recall, exactly as the method is used.
 */
export function MemoryWords({ count, method, loci, onDone }: { count: number; method: "none" | "palace"; loci: string[]; onDone: (r: { count: number; correct: number }) => void }) {
  const usePalace = method === "palace" && loci.length > 0;
  const n = usePalace ? Math.min(count, loci.length * 2) : count;
  const words = useMemo(() => sample(WORDS, n), [n]);
  const [phase, setPhase] = useState<"ready" | "study" | "recall" | "result">("ready");
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => Array(n).fill(""));
  const locus = (k: number) => (usePalace ? loci[k % loci.length]! : null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Baseline: timed, one word every 3 s.
  useEffect(() => {
    if (phase !== "study" || usePalace) return;
    const t = setTimeout(() => {
      if (i + 1 >= n) {
        setPhase("recall");
        setI(0);
      } else setI(i + 1);
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, i, n, usePalace]);

  useEffect(() => {
    if (phase === "recall") inputRef.current?.focus();
  }, [phase, i]);

  if (phase === "ready") {
    return (
      <div>
        <Kicker>{n} words</Kicker>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{usePalace ? "Place each word in your palace" : "Remember these words, in order"}</h2>
        <p className="mt-2 text-[17px] leading-relaxed">
          {usePalace
            ? `You'll see one word at a time with the spot it goes at. Picture it there, doing something odd. Take about 5 seconds each, then tap Next.`
            : `Each word shows for 3 seconds. Just try to hold them, no tricks. This is your starting line.`}
        </p>
        {method === "palace" && !usePalace && <p className="mt-2 text-sm text-warn">Build your palace in the previous stage first to use it here.</p>}
        <NextButton onClick={() => setPhase("study")}>Start</NextButton>
      </div>
    );
  }

  if (phase === "study") {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <Kicker>
          Word {i + 1} of {n}
        </Kicker>
        {usePalace && <p className="mt-6 text-muted">At your {locus(i)!.toLowerCase()}…</p>}
        <p key={i} className="rise mt-4 text-5xl font-semibold tracking-tight">
          {words[i]}
        </p>
        {usePalace && (
          <NextButton
            onClick={() => {
              if (i + 1 >= n) {
                setPhase("recall");
                setI(0);
              } else setI(i + 1);
            }}
          >
            {i + 1 >= n ? "Done, test me" : "Next"}
          </NextButton>
        )}
      </div>
    );
  }

  if (phase === "recall") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (i + 1 >= n) setPhase("result");
          else setI(i + 1);
        }}
      >
        <Kicker>
          Recall {i + 1} of {n}
        </Kicker>
        <label htmlFor="word-recall" className="mt-2 block text-xl font-semibold tracking-tight">
          {usePalace ? `What's at your ${locus(i)!.toLowerCase()}?` : `Word number ${i + 1}?`}
        </label>
        <input
          id="word-recall"
          ref={inputRef}
          value={answers[i]}
          onChange={(e) => setAnswers(answers.map((a, k) => (k === i ? e.target.value : a)))}
          autoComplete="off"
          autoCapitalize="none"
          enterKeyHint="next"
          className="mt-4 min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-lg"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-medium text-on-accent">
            {i + 1 >= n ? "Finish" : "Next"}
          </button>
          <button
            type="button"
            className="text-sm text-muted"
            onClick={() => {
              if (i + 1 >= n) setPhase("result");
              else setI(i + 1);
            }}
          >
            Blank, skip it
          </button>
        </div>
      </form>
    );
  }

  const correct = words.filter((w, k) => sameWord(answers[k] ?? "", w)).length;
  return (
    <div>
      <Kicker>Result</Kicker>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">
        {correct} of {n}
      </h2>
      <Feedback good={correct / n >= 0.7}>
        {usePalace
          ? correct / n >= 0.9
            ? "Excellent. Next time the list grows by two."
            : "Look at the misses: usually the image was too plain or didn't touch the spot."
          : "That's your baseline. Most people land around 5 to 7. Technique comes next."}
      </Feedback>
      <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {words.map((w, k) => (
          <li key={k} className={sameWord(answers[k] ?? "", w) ? "" : "text-muted line-through decoration-warn"}>
            {k + 1}. {w}
          </li>
        ))}
      </ol>
      <NextButton onClick={() => onDone({ count: n, correct })} />
    </div>
  );
}
