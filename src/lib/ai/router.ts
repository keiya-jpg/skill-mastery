import type { z } from "zod";
import { AiError } from "./errors";
import { sha256 } from "./hash";
import { parseWith } from "./json";
import { ProviderLimiter } from "./limiter";
import type { ChatMessage, ChatRequest, Provider, ProviderId, TranscribeRequest, TranscribeResult } from "./types";

export interface AiCache {
  get(key: string): Promise<unknown | undefined>;
  set(key: string, value: unknown, meta: { task: string; provider: string; model: string }): Promise<void>;
}

export interface AiUsage {
  record(provider: ProviderId, requests: number, audioSeconds?: number): Promise<void>;
  /** Requests used today across all providers (for the daily budget). */
  usedToday(): Promise<number>;
}

export interface RouterOptions {
  providers: Provider[];
  chains: { text: ProviderId[]; vision: ProviderId[]; audio: ProviderId[] };
  cache?: AiCache;
  usage?: AiUsage;
  dailyRequestLimit?: number;
  /** Longest a single provider call may take before trying the next one. */
  timeoutMs?: number;
  /**
   * Total time one request may spend across every provider and retry. Keep it
   * under the host's function limit (60 s on Vercel Hobby) so a slow provider
   * gives a clear "try again" error instead of the host killing the request.
   */
  deadlineMs?: number;
  limiter?: ProviderLimiter;
  log?: (msg: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface Completion<T> {
  data: T;
  provider: ProviderId | "cache";
  model: string;
  cached: boolean;
}

const sharedLimiter = new ProviderLimiter();

/**
 * Sends each request to the first provider in the chain that is not rate
 * limited, falls back on 429s, outages and bad output, validates JSON against
 * a zod schema, and caches results so identical requests cost nothing.
 */
export function createAiRouter(opts: RouterOptions) {
  const byId = new Map(opts.providers.map((p) => [p.id, p]));
  const limiter = opts.limiter ?? sharedLimiter;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const deadlineMs = opts.deadlineMs ?? 50_000;
  const log = opts.log ?? (() => {});
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  /** Below this, there isn't time for another provider to answer. */
  const MIN_CALL_MS = 4_000;

  function chainFor(cap: "text" | "vision" | "audio"): Provider[] {
    return opts.chains[cap].map((id) => byId.get(id)).filter((p): p is Provider => Boolean(p && p.capabilities.includes(cap)));
  }

  async function checkBudget() {
    if (!opts.usage || !opts.dailyRequestLimit) return;
    if ((await opts.usage.usedToday()) >= opts.dailyRequestLimit) {
      throw new AiError("budget", "Daily AI budget used");
    }
  }

  async function withTimeout<T>(endBy: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const left = endBy - now();
    if (left < MIN_CALL_MS) throw new AiError("timeout", "Ran out of time for this request");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, left));
    try {
      return await fn(ctrl.signal);
    } finally {
      clearTimeout(t);
    }
  }

  /** Try providers in order; returns the first success. */
  async function attempt<T>(chain: Provider[], endBy: number, run: (p: Provider) => Promise<T>): Promise<T> {
    if (chain.length === 0) throw new AiError("bad_request", "AI isn't set up on the server yet: add GROQ_API_KEY or GEMINI_API_KEY in Vercel, then redeploy.");
    let last: AiError | undefined;
    let soonest = Infinity;
    const failures: AiError[] = [];
    for (const p of chain) {
      if (endBy - now() < MIN_CALL_MS) {
        log(`[ai] out of time before trying ${p.id}`);
        break;
      }
      if (!limiter.tryAcquire(p.id, p.rpm)) {
        soonest = Math.min(soonest, limiter.waitTime(p.id) || 10_000);
        log(`[ai] skip ${p.id}: local rate limit`);
        continue;
      }
      for (let tryNo = 0; tryNo < 2; tryNo++) {
        if (tryNo > 0 && endBy - now() < MIN_CALL_MS + 800) break;
        try {
          return await run(p);
        } catch (e) {
          const err = e instanceof AiError ? e : new AiError("unavailable", String((e as Error)?.message ?? e), undefined, p.id);
          last = err;
          if (tryNo === 1 || err.kind !== "unavailable") failures.push(err);
          log(`[ai] ${p.id} failed (${err.kind}): ${err.message}`);
          if (err.kind === "rate_limit") {
            limiter.coolDown(p.id, err.retryAfterMs ?? 30_000);
            soonest = Math.min(soonest, err.retryAfterMs ?? 30_000);
            break; // go to the next provider straight away
          }
          if (err.kind === "unavailable" && tryNo === 0) {
            await sleep(800);
            continue; // one quick retry on a blip
          }
          if (err.kind === "unavailable" || err.kind === "timeout") limiter.coolDown(p.id, 15_000);
          break;
        }
      }
    }
    // If every provider failed the same way (all keys rejected, say), report that,
    // so a setup mistake doesn't look like the services being busy.
    const kinds = new Set(failures.map((f) => f.kind));
    const summary = failures.map((f) => f.message).join("; ").slice(0, 400) || last?.message || "All providers failed";
    if (failures.length > 0 && kinds.size === 1 && (kinds.has("auth") || kinds.has("bad_request"))) {
      throw new AiError([...kinds][0]!, summary, undefined, failures[0]!.provider);
    }
    throw new AiError("all_failed", summary, Number.isFinite(soonest) ? soonest : undefined);
  }

  return {
    /** Structured completion: JSON validated by `schema`, cached by input. */
    async completeJson<T>(
      req: Omit<ChatRequest, "json">,
      schema: z.ZodType<T>,
      cacheVersion: string,
    ): Promise<Completion<T>> {
      const cap = req.capability ?? "text";
      const key = await sha256(JSON.stringify([cacheVersion, req.task, cap, req.messages]));
      if (opts.cache) {
        const hit = await opts.cache.get(key).catch(() => undefined);
        if (hit !== undefined) {
          const ok = schema.safeParse(hit);
          if (ok.success) return { data: ok.data, provider: "cache", model: "cache", cached: true };
        }
      }
      await checkBudget();

      const endBy = now() + deadlineMs;
      const result = await attempt(chainFor(cap), endBy, async (p) => {
        const send = (messages: ChatMessage[], stream: boolean) =>
          withTimeout(endBy, (signal) => p.chat!({ ...req, messages, json: true, onDelta: stream ? req.onDelta : undefined }, signal));
        req.onDelta?.("");
        const first = await send(req.messages, true);
        await opts.usage?.record(p.id, 1).catch(() => {});
        try {
          return { data: parseWith(schema, first.text), provider: p.id, model: first.model };
        } catch (e) {
          // One repair attempt on the same provider before falling back.
          const repair = await send([
            ...req.messages,
            { role: "assistant", content: first.text.slice(0, 8000) },
            {
              role: "user",
              content: `That reply could not be used (${(e as Error).message}). Reply again with ONLY a valid JSON object in the exact shape requested.`,
            },
          ], false);
          await opts.usage?.record(p.id, 1).catch(() => {});
          return { data: parseWith(schema, repair.text), provider: p.id, model: repair.model };
        }
      });

      await opts.cache?.set(key, result.data, { task: req.task, provider: result.provider, model: result.model }).catch(() => {});
      return { ...result, cached: false };
    },

    /** Audio to text, with fallback across transcription providers. */
    async transcribe(req: TranscribeRequest, durationSeconds: number): Promise<TranscribeResult> {
      await checkBudget();
      const endBy = now() + deadlineMs;
      const out = await attempt(chainFor("audio"), endBy, (p) => withTimeout(endBy, (signal) => p.transcribe!(req, signal)));
      await opts.usage?.record(out.provider, 1, Math.round(durationSeconds)).catch(() => {});
      return out;
    },

    configured(): Record<"text" | "vision" | "audio", ProviderId[]> {
      return {
        text: chainFor("text").map((p) => p.id),
        vision: chainFor("vision").map((p) => p.id),
        audio: chainFor("audio").map((p) => p.id),
      };
    },
  };
}

export type AiRouter = ReturnType<typeof createAiRouter>;
