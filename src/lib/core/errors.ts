/**
 * Turns errors from Supabase, fetch or zod into one short, human sentence.
 * Never leaks stack traces or internal codes to the UI.
 */
export function friendlyError(err: unknown): string {
  if (!err) return "Something went wrong. Please try again.";
  const anyErr = err as { message?: string; code?: string; status?: number; issues?: { message: string }[] };
  if (Array.isArray(anyErr.issues) && anyErr.issues[0]) return anyErr.issues[0].message;
  const msg = (anyErr.message ?? String(err)).toLowerCase();
  const code = anyErr.code ?? "";

  if (code === "23505" || msg.includes("duplicate key")) return "You already have one with that name.";
  if (msg.includes("invalid login credentials")) return "That email and password don't match.";
  if (msg.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (msg.includes("user already registered")) return "An account with that email already exists. Try logging in.";
  if (msg.includes("rate limit") || anyErr.status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (msg.includes("password should be") || msg.includes("weak password")) return "That password is too weak. Try a longer one.";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "Can't reach the server. Check your connection.";
  if (msg.includes("provider is not enabled") || msg.includes("unsupported provider"))
    return "Google sign-in isn't set up yet on this server.";
  if (msg.includes("jwt") || msg.includes("not authenticated")) return "Your session has expired. Please log in again.";
  return anyErr.message && anyErr.message.length < 160 ? anyErr.message : "Something went wrong. Please try again.";
}
