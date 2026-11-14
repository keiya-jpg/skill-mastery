"use client";
import { emailSchema, friendlyError } from "@/lib/core";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { Alert, Button, TextField } from "@/components/ui";
import { appOrigin } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(friendlyError(parsed.error));
    setLoading(true);
    const { error } = await getSupabase().auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${appOrigin()}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(friendlyError(error));
    setSent(true);
  }

  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <Alert tone="success">If an account exists for that email, a reset link is on its way. Open it in this browser.</Alert>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <TextField label="Email" name="email" type="email" autoComplete="email" required />
            <Button type="submit" loading={loading}>Send reset link</Button>
          </form>
        </>
      )}
      <Link href="/login" className="text-sm text-accent underline">Back to log in</Link>
    </AuthCard>
  );
}
