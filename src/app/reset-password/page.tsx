"use client";
import { friendlyError, PASSWORD_MIN, passwordSchema } from "@/lib/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { useAuth } from "@/components/auth-provider";
import { Alert, Button, Spinner, TextField } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waited, setWaited] = useState(false);

  // The reset link signs the user in via a one-time code; give it a moment.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirm") ?? "")) return setError("The two passwords don't match.");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(friendlyError(parsed.error));
    setLoading(true);
    const { error } = await getSupabase().auth.updateUser({ password: parsed.data });
    setLoading(false);
    if (error) return setError(friendlyError(error));
    router.replace("/library?passwordUpdated=1");
  }

  if (!user) {
    if (authLoading || !waited) {
      return (
        <div className="flex justify-center py-16 text-muted">
          <Spinner label="Checking your reset link…" />
        </div>
      );
    }
    return (
      <AuthCard title="This link has expired">
        <Alert>
          Reset links work once, for a limited time, and only in the browser you requested them from.
        </Alert>
        <Link href="/forgot-password" className="text-sm text-accent underline">Send a new link</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle={user.email}>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField label="New password" name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} required hint={`At least ${PASSWORD_MIN} characters.`} />
        <TextField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" required />
        <Button type="submit" loading={loading}>Save password</Button>
      </form>
    </AuthCard>
  );
}
