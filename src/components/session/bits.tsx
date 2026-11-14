"use client";
import type { ReactNode } from "react";

/** Big, calm, thumb-friendly primary action at the bottom of an activity. */
export function NextButton({ onClick, children = "Continue", disabled }: { onClick: () => void; children?: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-5 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50 sm:w-auto sm:min-w-48"
    >
      {children}
    </button>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wider text-muted">{children}</p>;
}

export function Feedback({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <div role="status" className={`pop mt-4 rounded-xl px-4 py-3 text-[15px] ${good ? "bg-good-soft" : "bg-warn-soft"}`}>
      {children}
    </div>
  );
}

export function Option({
  children,
  state,
  onClick,
  disabled,
}: {
  children: ReactNode;
  state: "idle" | "right" | "wrong" | "dim";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cls =
    state === "right"
      ? "border-good bg-good-soft"
      : state === "wrong"
        ? "border-warn bg-warn-soft"
        : state === "dim"
          ? "border-border bg-surface opacity-60"
          : "border-border bg-surface hover:border-accent";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${cls}`}>
      <span className="flex-1">{children}</span>
      {state === "right" && <span aria-label="correct">✓</span>}
      {state === "wrong" && <span aria-label="not quite">✗</span>}
    </button>
  );
}
