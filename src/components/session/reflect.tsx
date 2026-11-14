"use client";
import { useState } from "react";
import type { Activity } from "@/lib/skill/schema";
import { Kicker, NextButton } from "./bits";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "reflect" }>;

/** One line of reflection. Optional: noticing is the point, not writing. */
export function Reflect({ activity: a, onDone }: ActivityProps<A>) {
  const [text, setText] = useState("");
  return (
    <div>
      <Kicker>Notice</Kicker>
      <label htmlFor={`reflect-${a.id}`} className="mt-2 block text-xl font-semibold tracking-tight">
        {a.prompt}
      </label>
      <textarea
        id={`reflect-${a.id}`}
        value={text}
        maxLength={500}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="A few words is plenty"
        className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
      />
      <NextButton onClick={() => onDone({ data: text.trim() ? { note: text.trim() } : {} })}>{text.trim() ? "Save" : "Skip"}</NextButton>
    </div>
  );
}
