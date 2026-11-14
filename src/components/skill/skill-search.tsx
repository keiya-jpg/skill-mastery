"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { searchLocal, type CatalogEntry } from "@/lib/skill/catalog";
import { slugify } from "@/lib/skill/schema";
import { searchStored } from "@/lib/skills-client";
import { skillHref } from "./skill-tile";

/**
 * One box: type anything. Matches from skills that already exist come first
 * (instant, no AI); if nothing fits, the last option builds a new plan.
 */
export function SkillSearch({ autoFocus = false, placeholder = "What do you want to get good at?" }: { autoFocus?: boolean; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [stored, setStored] = useState<CatalogEntry[]>([]);
  const router = useRouter();
  const listId = useId();
  const local = q.trim().length >= 2 ? searchLocal(q, 5) : [];

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      searchStored(query)
        .then((rows) => live && setStored(rows.map((r) => ({ ...r, built: true }))))
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const seen = new Set<string>();
  const results = [...local, ...(q.trim().length >= 2 ? stored : [])].filter((e) => (seen.has(e.slug) ? false : (seen.add(e.slug), true))).slice(0, 6);
  const exact = results.some((r) => r.name.toLowerCase() === q.trim().toLowerCase());

  function submit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    const top = results[0];
    if (top && top.name.toLowerCase() === query.toLowerCase()) router.push(skillHref(top));
    else router.push(`/skill?s=${slugify(query)}&q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={submit} role="search" className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search for a skill
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={`${listId}-input`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="go"
          maxLength={120}
          className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-muted"
          aria-controls={q.trim().length >= 2 ? listId : undefined}
        />
      </div>
      {q.trim().length >= 2 && (
        <ul id={listId} className="rise mt-2 overflow-hidden rounded-xl border border-border bg-surface">
          {results.map((r) => (
            <li key={r.slug}>
              <Link href={skillHref(r)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                <span aria-hidden className="text-xl">{r.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                {r.built && <span className="text-xs text-muted">ready</span>}
              </Link>
            </li>
          ))}
          {!exact && (
            <li>
              <button type="submit" className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-accent hover:bg-surface-2">
                <span aria-hidden className="text-xl">✨</span>
                <span className="min-w-0 flex-1">
                  Build a practice plan for <strong>&ldquo;{q.trim()}&rdquo;</strong>
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </form>
  );
}
