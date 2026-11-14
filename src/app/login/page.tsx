"use client";
import { friendlyError, safeNextPath, signInInput } from "@/lib/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { signOutIntent, useAuth } from "@/components/auth-provider";
import { GoogleButton } from "@/components/google-button";
import { NotConfigured } from "@/components/not-configured";
import { Alert, Button, TextField } from "@/components/ui";
import { isConfigured } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

function LoginForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(params.get("error"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = signInInput.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) return setError(friendlyError(parsed.error));
    setLoading(true);
    signOutIntent.current = false;
    const { error } = await getSupabase().auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return setError(friendlyError(error));
    router.replace(next);
  }

  return (
    <AuthCard title="Log in" subtitle={<>New here? <Link className="text-accent underline" href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link></>}>
      {!isConfigured && <NotConfigured />}
      {error && <Alert>{error}</Alert>}
      <GoogleButton next={next} onError={setError} />
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" loading={loading}>Log in</Button>
      </form>
      <Link href="/forgot-password" className="text-sm text-accent underline">Forgot your password?</Link>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
