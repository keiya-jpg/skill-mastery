"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Loads something async; re-runs when `deps` change. While a reload runs,
 * the previous data stays on screen (no flashing spinners).
 */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): { data: T | undefined; error: string | null; loading: boolean; reload: () => void } {
  const [state, setState] = useState<{ data: T | undefined; error: string | null; done: boolean }>({ data: undefined, error: null, done: false });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    let live = true;
    fnRef.current().then(
      (data) => live && setState({ data, error: null, done: true }),
      (e: unknown) => live && setState({ data: undefined, error: e instanceof Error ? e.message : String(e), done: true }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data: state.data, error: state.error, loading: !state.done, reload: () => setTick((t) => t + 1) };
}
