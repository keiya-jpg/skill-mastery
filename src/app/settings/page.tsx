"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutIntent, useAuth } from "@/components/auth-provider";
import { ThemeSwitcher } from "@/components/theme";
import { Button, Card } from "@/components/ui";
import { isConfigured } from "@/lib/env";
import { getSupabase } from "@/lib/supabase";

export default function Settings() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <h2 className="font-medium">Account</h2>
        {user ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-muted">Signed in as {user.email}. Your library and progress sync across devices.</p>
            <Button
              variant="secondary"
              className="self-start"
              onClick={async () => {
                signOutIntent.current = true;
                await getSupabase().auth.signOut();
                router.replace("/");
              }}
            >
              Log out
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-muted">
              You&apos;re using the app as a guest; progress is saved on this device. An account keeps it on every device and lets you build plans for new skills.
            </p>
            {isConfigured ? (
              <div className="flex gap-3">
                <Link href="/signup?next=/" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-medium text-on-accent">
                  Create account
                </Link>
                <Link href="/login?next=/" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm">
                  Log in
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted">Accounts aren&apos;t set up on this server yet.</p>
            )}
          </div>
        )}
      </Card>
      <Card>
        <ThemeSwitcher />
      </Card>
      <Card>
        <h2 className="font-medium">Suggestions</h2>
        <p className="mt-1 text-sm text-muted">Change what Discover suggests.</p>
        <Link href="/discover" className="mt-3 inline-block text-sm text-accent">Tune suggestions on Discover</Link>
      </Card>
      <Link href="/about" className="text-sm text-accent">How this app works, and the research behind it</Link>
    </div>
  );
}
