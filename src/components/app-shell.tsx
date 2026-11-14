"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/core";
import { useAuth } from "./auth-provider";

const NAV = [
  { href: "/", label: "Today", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/discover", label: "Discover", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3.5 5.5-2 5-5 2 2-5z" },
  { href: "/library", label: "Library", icon: "M5 4h3v16H5zM10.5 4h3v16h-3zM16 5l3-.8 3.8 15.5-3 .8z" },
];

/**
 * Three destinations, nothing more. Sessions (/practice) hide the chrome
 * entirely: one thing on screen at a time.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const focus = pathname.startsWith("/practice") || pathname.startsWith("/review");
  if (focus) return <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-10">{children}</main>;

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden>
              <rect width="64" height="64" rx="14" fill="var(--accent)" />
              <path d="M18 46 L32 16 L46 46" fill="none" stroke="var(--on-accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="32" cy="38" r="4" fill="var(--on-accent)" />
            </svg>
            {APP_NAME}
          </Link>
          <nav aria-label="Main" className="ml-4 hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm ${active(n.href) ? "bg-surface-2 font-medium text-text" : "text-muted hover:text-text"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            {user ? (
              <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-sm font-medium" aria-label="Settings and account">
                {(user.user_metadata?.display_name as string | undefined)?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? "·"}
              </Link>
            ) : (
              <Link href="/settings" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-text">
                Settings
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:pb-12">
        {children}
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${active(n.href) ? "text-accent" : "text-muted"}`}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d={n.icon} />
                </svg>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
