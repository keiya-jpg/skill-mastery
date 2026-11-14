"use client";
import { friendlyError, PASSWORD_MIN, safeNextPath, signUpInput } from "@/lib/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { GoogleButton } from "@/components/google-button";
import { NotConfigured } from "@/components/not-configured";
import { Alert, Button, TextField } from "@/components/ui";
import { appOrigin, isConfigured } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

function SignupForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = signUpInput.safeParse({
      email: form.get("email"),
      password: form.get("password"),
      displayName: form.get("displayName") || undefined,
    });
    if (!parsed.success) return setError(friendlyError(parsed.error));
    setLoading(true);
    const { data, error } = await getSupabase().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { display_name: parsed.data.displayName },
        emailRedirectTo: `${appOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) return setError(friendlyError(error));
    // With email confirmation on (the default on hosted Supabase) there is no session yet.
    if (data.session) router.replace(next);
    else setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <Alert tone="success">
          We sent a confirmation link to <strong>{sentTo}</strong>. Open it on this device to finish signing up.
        </Alert>
        <p className="text-sm text-muted">Nothing there after a few minutes? Check spam, or try signing up again.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" subtitle={<>Already have one? <Link className="text-accent underline" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link></>}>
      {!isConfigured && <NotConfigured />}
      {error && <Alert>{error}</Alert>}
      <GoogleButton next={next} onError={setError} />
      <div className="flex items-center gap-3 text-xs text-muted" aria-hidden>
        <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="Name (optional)" name="displayName" autoComplete="name" maxLength={80} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Password" name="password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN} hint={`At least ${PASSWORD_MIN} characters. A short phrase works well.`} />
        <Button type="submit" loading={loading}>Create account</Button>
      </form>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
