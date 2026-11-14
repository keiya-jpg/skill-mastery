"use client";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/components/store-provider";
import { Spinner } from "@/components/ui";
import { getSkill } from "@/lib/skills-client";
import { useLoad } from "@/lib/use-load";

function ago(iso: string | null): string {
  if (!iso) return "Not started";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "Practised today" : days === 1 ? "Practised yesterday" : `Practised ${days} days ago`;
}

export default function Library() {
  const { store, ready } = useStore();
  const { user } = useAuth();
  const { data, loading } = useLoad(async () => {
    if (!ready) return null;
    const [items, sessions] = await Promise.all([store.library(), store.sessions(60)]);
    const specs = await Promise.all(items.map((i) => getSkill(i.slug).catch(() => null)));
    const weekAgo = Date.now() - 7 * 86_400_000;
    const days = new Set(sessions.filter((s) => new Date(s.startedAt).getTime() > weekAgo).map((s) => s.startedAt.slice(0, 10))).size;
    return { rows: items.map((it, i) => ({ it, spec: specs[i] })), days };
  }, [store, ready]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner label="Loading…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your library</h1>
        {data.rows.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            {data.days === 0 ? "No sessions in the last 7 days yet." : `You practised on ${data.days} of the last 7 days.`}
          </p>
        )}
      </div>

      {!user && (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
          Your library is saved on this device. <Link href="/signup?next=/library" className="text-accent underline">Create a free account</Link> to keep it on every device.
        </p>
      )}

      {data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted">Skills you start will live here.</p>
          <Link href="/discover" className="mt-3 inline-block text-accent">
            Find one to start
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.rows.map(({ it, spec }) => {
            const total = spec?.stages.length ?? 1;
            const pct = Math.min(100, Math.round((it.stage / total) * 100));
            return (
              <li key={it.slug}>
                <Link href={`/skill?s=${it.slug}`} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:border-accent/50">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-2xl">
                    {spec?.emoji ?? "✨"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{spec?.name ?? it.slug}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {it.stage >= total ? "Plan complete" : `Stage ${it.stage + 1} of ${total}`} · {ago(it.lastPracticedAt)}
                    </span>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${spec?.name ?? it.slug} progress`}>
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
