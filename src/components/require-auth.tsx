"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { signOutIntent, useAuth } from "./auth-provider";
import { Spinner } from "./ui";

/** Client-side guard. Real protection is row-level security in the database. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      if (signOutIntent.current) {
        router.replace("/login");
        return;
      }
      const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        <Spinner label="Loading…" />
      </div>
    );
  }
  return <>{children}</>;
}
