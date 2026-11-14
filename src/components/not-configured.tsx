import { Alert } from "./ui";

export function NotConfigured() {
  return (
    <Alert tone="info">
      <p className="font-medium">Supabase isn&apos;t connected yet.</p>
      <p className="mt-1">
        Copy <code>.env.example</code> to <code>.env.local</code> and fill in{" "}
        <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. The README explains where to find them.
      </p>
    </Alert>
  );
}
