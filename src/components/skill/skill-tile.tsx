import Link from "next/link";
import type { CatalogEntry } from "@/lib/skill/catalog";

export function skillHref(e: Pick<CatalogEntry, "slug" | "name" | "built">) {
  return e.built ? `/skill?s=${e.slug}` : `/skill?s=${e.slug}&q=${encodeURIComponent(e.name)}`;
}

const KIND_LABEL = { mental: "Mind", physical: "Body", mixed: "Mind + body" } as const;

export function SkillTile({ entry, compact = false }: { entry: CatalogEntry; compact?: boolean }) {
  return (
    <Link
      href={skillHref(entry)}
      className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-2xl">
        {entry.emoji}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-medium group-hover:text-accent">{entry.name}</span>
          <span className="text-xs text-muted">{KIND_LABEL[entry.kind]}</span>
        </span>
        {!compact && <span className="mt-0.5 block text-sm text-muted">{entry.hook}</span>}
      </span>
    </Link>
  );
}
