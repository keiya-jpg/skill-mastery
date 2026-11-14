"use client";
import { useState } from "react";
import type { Activity } from "@/lib/skill/schema";
import { Feedback, Kicker, NextButton, Option } from "./bits";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "quiz" }>;

/** Multiple choice where every option teaches something, right or wrong. */
export function Quiz({ activity: a, onDone }: ActivityProps<A>) {
  const [pick, setPick] = useState<number | null>(null);
  const [first, setFirst] = useState<number | null>(null);
  const right = pick === a.answer;
  return (
    <div>
      <Kicker>Check yourself</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{a.question}</h2>
      <div className="mt-4 flex flex-col gap-2">
        {a.options.map((o, i) => (
          <Option
            key={i}
            disabled={right}
            onClick={() => {
              setPick(i);
              if (first === null) setFirst(i);
            }}
            state={pick === null ? "idle" : i === pick ? (right ? "right" : "wrong") : right ? "dim" : "idle"}
          >
            {o.text}
          </Option>
        ))}
      </div>
      {pick !== null && (
        <Feedback good={right}>
          {a.options[pick]!.why}
          {!right && <span className="mt-1 block text-sm text-muted">Have another go.</span>}
        </Feedback>
      )}
      {right && <NextButton onClick={() => onDone({ attempts: 1, successes: first === a.answer ? 1 : 0, score: first === a.answer ? 1 : 0 })} />}
    </div>
  );
}
