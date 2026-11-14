"use client";
import { useEffect, useMemo, useState } from "react";
import { advice, nextLevel, type Level } from "@/lib/adapt";
import type { Activity } from "@/lib/skill/schema";
import { Feedback, Kicker, NextButton } from "./bits";
import { ImageryPlayer } from "./imagery";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "drill" }>;
interface SetLog {
  level: Level;
  attempts: number;
  successes: number | null;
  rating?: number;
}

const LEVEL_NAME: Record<Level, string> = { [-1]: "Easier version", 0: "Standard", 1: "Harder version" };

/**
 * A real-world drill, logged like a coach's notebook. Count makes honestly;
 * the drill moves you to the harder or easier version to keep you around
 * 70-85% success.
 */
export function Drill({ activity: a, ctx, onDone }: ActivityProps<A>) {
  const startLevel = useMemo<Level>(() => {
    const last = ctx.history[0];
    if (!last) return 0;
    const rate = last.attempts ? (last.successes ?? 0) / last.attempts : null;
    return nextLevel((last.level ?? 0) as Level, rate);
  }, [ctx.history]);
  const [level, setLevel] = useState<Level>(startLevel);
  const [sets, setSets] = useState<SetLog[]>([]);
  const [imagery, setImagery] = useState(false);
  const [makes, setMakes] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [callout, setCallout] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<SetLog | null>(null);

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  if (imagery) {
    return (
      <ImageryPlayer
        title={`Rehearse: ${a.title}`}
        script={`Picture the spot. Feel the starting position. ${a.cue ? `Your attention is on one thing: ${a.cue.toLowerCase().replace(/\.$/, "")}. ` : ""}Run the first few ${a.unit === "seconds" ? "seconds" : "reps"} in your mind at real speed, clean and smooth. See it working. Then once more, the same way.`}
        seconds={45}
        doneLabel="Now do it for real"
        onDone={() => setImagery(false)}
      />
    );
  }

  const setNo = sets.length + 1;
  const finished = sets.length >= a.sets;
  const totals = sets.reduce((t, s) => ({ attempts: t.attempts + s.attempts, successes: t.successes + (s.successes ?? 0) }), { attempts: 0, successes: 0 });

  function logSet() {
    const entry: SetLog =
      a.log === "makes"
        ? { level, attempts: a.perSet, successes: makes }
        : a.log === "rating"
          ? { level, attempts: 1, successes: rating !== null && rating >= 4 ? 1 : 0, rating: rating ?? undefined }
          : { level, attempts: 1, successes: 1 };
    setSets([...sets, entry]);
    setJustLogged(entry);
    setMakes(0);
    setRating(null);
    setTimer(null);
  }

  const rate = justLogged && a.log === "makes" ? (justLogged.successes ?? 0) / justLogged.attempts : justLogged?.rating ? justLogged.rating / 5 : null;
  const tip = advice(rate);

  return (
    <div>
      <Kicker>
        Drill · {finished ? "done" : `set ${setNo} of ${a.sets}`}
      </Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{a.title}</h2>
      {a.setup && <p className="mt-1 text-muted">{a.setup}</p>}

      {!finished && (
        <>
          <ul className="mt-4 flex flex-col gap-1.5 text-[16px]">
            {a.instructions.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="text-muted">·</span>
                {s}
              </li>
            ))}
          </ul>
          {level !== 0 && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="font-medium">{LEVEL_NAME[level]}:</span> {level === 1 ? a.harder : a.easier}
            </p>
          )}
          {a.cue && (
            <p className="mt-4 border-l-2 border-accent pl-3 text-[16px]">
              <span className="text-sm text-muted">Focus on </span>
              {a.cue}
            </p>
          )}
          <p className="mt-4 text-sm text-muted">
            {a.perSet} {a.unit} · success: {a.success}
          </p>

          {a.callouts && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm hover:border-accent"
                onClick={() => {
                  const options = a.callouts!.filter((c) => c !== callout);
                  setCallout(options[Math.floor(Math.random() * options.length)]!);
                }}
              >
                {callout ? "Next spot" : "Call a spot"}
              </button>
              {callout && (
                <span key={callout} className="pop text-lg font-semibold" aria-live="polite">
                  {callout}
                </span>
              )}
            </div>
          )}

          {a.unit === "seconds" && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm hover:border-accent"
                onClick={() => setTimer(a.perSet)}
              >
                {timer === null ? `Start ${a.perSet}s timer` : "Restart timer"}
              </button>
              {timer !== null && <span className="text-2xl tabular-nums">{timer > 0 ? `${timer}s` : "Time!"}</span>}
            </div>
          )}

          {a.imagery && sets.length === 0 && (
            <button type="button" onClick={() => setImagery(true)} className="mt-4 block text-sm text-accent">
              Rehearse it in your mind first (45 s)
            </button>
          )}

          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            {a.log === "makes" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium" id={`makes-${a.id}`}>
                  After the set: how many out of {a.perSet}?
                </p>
                <div className="flex items-center gap-4" role="group" aria-labelledby={`makes-${a.id}`}>
                  <button type="button" aria-label="One fewer" className="h-12 w-12 rounded-full border border-border text-xl" onClick={() => setMakes(Math.max(0, makes - 1))}>
                    −
                  </button>
                  <output className="w-20 text-center text-4xl font-semibold tabular-nums" aria-live="polite">
                    {makes}
                  </output>
                  <button type="button" aria-label="One more" className="h-12 w-12 rounded-full border border-border text-xl" onClick={() => setMakes(Math.min(a.perSet, makes + 1))}>
                    +
                  </button>
                </div>
              </div>
            )}
            {a.log === "rating" && (
              <fieldset>
                <legend className="text-sm font-medium">How clean was that set?</legend>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={rating === r}
                      onClick={() => setRating(r)}
                      className={`min-h-12 rounded-lg border ${rating === r ? "border-accent bg-accent-soft" : "border-border"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="mt-2 flex justify-between text-xs text-muted">
                  <span>Messy</span>
                  <span>Clean</span>
                </p>
              </fieldset>
            )}
            {a.log === "done" && <p className="text-center text-sm text-muted">Tap below when the set is done.</p>}
            <NextButton onClick={logSet} disabled={a.log === "rating" && rating === null}>
              Log set {setNo}
            </NextButton>
          </div>
        </>
      )}

      {justLogged && tip && (
        <Feedback good={tip !== "down"}>
          {tip === "up" && (
            <>
              That&apos;s above 85%, so it&apos;s getting easy.{" "}
              {level < 1 && !finished && (
                <button type="button" className="font-medium text-accent underline" onClick={() => setLevel((level + 1) as Level)}>
                  Try the harder version next
                </button>
              )}
            </>
          )}
          {tip === "stay" && "Right in the sweet spot. Keep this level."}
          {tip === "down" && (
            <>
              Under half is too hard to learn much from.{" "}
              {level > -1 && !finished && (
                <button type="button" className="font-medium text-accent underline" onClick={() => setLevel((level - 1) as Level)}>
                  Switch to the easier version
                </button>
              )}
            </>
          )}
        </Feedback>
      )}

      {finished && (
        <div className="rise">
          {a.log === "makes" && (
            <p className="mt-4 text-lg">
              {totals.successes} of {totals.attempts} · {Math.round((totals.successes / Math.max(1, totals.attempts)) * 100)}%
            </p>
          )}
          <NextButton
            onClick={() =>
              onDone({
                attempts: a.log === "makes" ? totals.attempts : undefined,
                successes: a.log === "makes" ? totals.successes : undefined,
                score: a.log === "makes" ? totals.successes / Math.max(1, totals.attempts) : a.log === "rating" ? sets.reduce((n, s) => n + (s.rating ?? 0), 0) / (5 * sets.length) : 1,
                level,
                data: { sets },
              })
            }
          />
        </div>
      )}
    </div>
  );
}
