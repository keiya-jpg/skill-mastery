export type AiErrorKind =
  | "rate_limit" // 429 or quota exhausted: try another provider
  | "auth" // bad or missing key
  | "bad_request" // provider rejected the request (model name, size...)
  | "unavailable" // 5xx or network
  | "timeout"
  | "invalid_output" // reply was not valid JSON / did not match schema
  | "budget" // our own per-user daily budget
  | "all_failed";

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public retryAfterMs?: number,
    public provider?: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** Map an HTTP response from any provider to an AiError. */
export async function errorFromResponse(res: Response, provider: string): Promise<AiError> {
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 300);
  } catch {
    /* ignore */
  }
  const retryAfter = Number(res.headers.get("retry-after"));
  const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined;
  if (res.status === 429) return new AiError("rate_limit", `${provider} rate limit`, retryAfterMs ?? 30_000, provider);
  if (res.status === 401 || res.status === 403) return new AiError("auth", `${provider} rejected the API key`, undefined, provider);
  if (res.status === 413) return new AiError("bad_request", `${provider}: input too large`, undefined, provider);
  if (res.status >= 500) return new AiError("unavailable", `${provider} unavailable (${res.status})`, 5_000, provider);
  // Some providers report exhausted quota as 400 with a message.
  if (/quota|rate.?limit|exhaust/i.test(detail)) return new AiError("rate_limit", `${provider} quota`, 60_000, provider);
  return new AiError("bad_request", `${provider} ${res.status}: ${detail}`, undefined, provider);
}

/**
 * The provider's own reason, for troubleshooting. Contains status codes and
 * the provider's error text, never keys.
 */
export function aiErrorDetail(err: unknown): string | undefined {
  if (!(err instanceof AiError) || err.kind === "budget") return undefined;
  if (!err.provider && err.kind !== "all_failed") return undefined;
  return err.message.replace(/(sk|gsk|AIza)[-_A-Za-z0-9]{8,}/g, "[key]").slice(0, 400);
}

/** A short sentence safe to show to users. */
export function aiErrorMessage(err: unknown): string {
  if (err instanceof AiError) {
    switch (err.kind) {
      case "budget":
        return "You've used today's free AI allowance. It resets at midnight (UTC).";
      case "all_failed":
      case "rate_limit":
        return "The free AI services are busy right now. Please try again in a minute.";
      case "invalid_output":
        return "The AI gave an unusable answer. Please try again.";
      case "timeout":
        return "The AI took too long to answer. Please try again.";
      case "auth":
        return "The AI provider rejected the API key. Check GROQ_API_KEY and GEMINI_API_KEY in Vercel, then redeploy.";
      case "bad_request":
        return "The AI provider rejected the request. The model name may have changed.";
      default:
        return "AI processing failed. Please try again.";
    }
  }
  return "AI processing failed. Please try again.";
}
