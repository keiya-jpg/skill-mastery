"use client";
import { safeNextPath } from "@/lib/core";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Spinner } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";

/**
 * Landing page after Google sign-in or email confirmation. supabase-js swaps
 * the one-time ?code for a session automatically (PKCE), then we move on.
 */
function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const next = safeNextPath(params.get("next"));
    const err = params.get("error_description") ?? params.get("error");
    if (err) {
      router.replace(`/login?error=${encodeURIComponent(err)}`);
      return;
    }
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        router.replace(data.session ? next : `/login?error=${encodeURIComponent("That sign-in link didn't work. Please try again.")}`);
      });
  }, [params, router]);
  return (
    <div className="flex justify-center py-16 text-muted">
      <Spinner label="Signing you in…" />
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}
