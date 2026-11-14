import { z } from "zod";

export const PASSWORD_MIN = 8;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(72, "Passwords can be at most 72 characters");

export const signUpInput = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().max(80).optional(),
});

export const signInInput = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

/**
 * Only allow redirects back into our own app after sign-in, never to another
 * site (prevents open-redirect phishing via ?next=https://evil.example).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
