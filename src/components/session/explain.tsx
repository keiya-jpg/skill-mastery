"use client";
import { useState } from "react";
import type { Activity } from "@/lib/skill/schema";
import { Feedback, Kicker, NextButton, Option } from "./bits";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "explain" }>;

/** Guess first (curiosity gap + pretesting), then a short explanation. */
export function Explain({ activity: a, onDone }: ActivityProps<A>) {
  const [pick, setPick] = useState<number | null>(null);
  const needGuess = Boolean(a.predict) && pick === null;
  return (
    <div>
      <Kicker>{a.predict && needGuess ? "Quick guess" : "Idea"}</Kicker>
      {a.predict && (
        <div className="mt-2">
          <h2 className="text-xl font-semibold tracking-tight">{a.predict.question}</h2>
          {needGuess && <p className="mt-1 text-sm text-muted">Go with your gut. Guessing first helps it stick, even if you&apos;re wrong.</p>}
          <div className="mt-4 flex flex-col gap-2">
            {a.predict.options.map((o, i) => (
              <Option
                key={i}
                disabled={!needGuess}
                onClick={() => setPick(i)}
                state={pick === null ? "idle" : i === a.predict!.answer ? "right" : i === pick ? "wrong" : "dim"}
              >
                {o}
              </Option>
            ))}
          </div>
        </div>
      )}
      {!needGuess && (
        <div className="rise">
          {a.predict && pick !== null && (
            <Feedback good={pick === a.predict.answer}>{pick === a.predict.answer ? "Yes, well spotted." : "Most people guess that. Here's why it's the other one."}</Feedback>
          )}
          <h2 className={`${a.predict ? "mt-6 text-lg" : "mt-2 text-xl"} font-semibold tracking-tight`}>{a.title}</h2>
          <p className="mt-2 text-[17px] leading-relaxed">{a.text}</p>
          <NextButton onClick={() => onDone({ score: a.predict ? (pick === a.predict.answer ? 1 : 0) : undefined })}>Got it</NextButton>
        </div>
      )}
    </div>
  );
}
