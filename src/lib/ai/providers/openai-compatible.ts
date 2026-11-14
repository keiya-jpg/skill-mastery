import { AiError, errorFromResponse } from "../errors";
import type { Capability, ChatRequest, ChatResult, Provider, ProviderId, TranscribeRequest, TranscribeResult } from "../types";

export interface OpenAICompatibleOptions {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  /**
   * Model to use. May be a comma-separated list: if the provider says a model
   * doesn't exist (free line-ups change often), the next one is tried and
   * remembered, so a retired model doesn't break the app.
   */
  textModel: string;
  visionModel?: string;
  audioModel?: string;
  rpm: number;
  /** Send response_format json_object (not every provider accepts it). */
  jsonMode?: boolean;
  /**
   * OpenAI-style reasoning_effort. Gemini's Flash models "think" at length by
   * default, which can take longer than a free host allows; "low" keeps
   * replies quick.
   */
  reasoningEffort?: string | ((model: string) => string | undefined);
  /** Upper limit for max_tokens (Groq's free tier counts it against 8,000 tokens a minute). */
  maxTokensCap?: number;
  extraHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

/**
 * Gemini, Groq, OpenRouter and Cloudflare Workers AI all expose an
 * OpenAI-compatible chat endpoint, so one adapter covers them.
 */
export function openAICompatible(o: OpenAICompatibleOptions): Provider {
  const f = o.fetchImpl ?? fetch;
  const caps: Capability[] = ["text"];
  if (o.visionModel) caps.push("vision");
  if (o.audioModel) caps.push("audio");

  const candidates = (list: string) => list.split(",").map((m) => m.trim()).filter(Boolean);
  const textModels = candidates(o.textModel);
  const visionModels = o.visionModel ? candidates(o.visionModel) : textModels;
  /** Models this provider told us don't exist, so we stop asking for them. */
  const gone = new Set<string>();
  /**
   * Free limits are per model on Groq (each has its own tokens-a-minute allowance),
   * so when one model is busy the next one in the list usually answers straight away.
   */
  const busyUntil = new Map<string, number>();
  const isMissingModel = (e: unknown) =>
    e instanceof AiError && e.kind === "bad_request" && /model_not_found|does not exist|decommissioned|not found|is not supported|no longer/i.test(e.message);

  async function call(path: string, init: RequestInit, signal: AbortSignal) {
    let res: Response;
    try {
      res = await f(`${o.baseUrl}${path}`, {
        ...init,
        signal,
        headers: { Authorization: `Bearer ${o.apiKey}`, ...o.extraHeaders, ...(init.headers as Record<string, string>) },
      });
    } catch (e) {
      if ((e as Error).name === "AbortError") throw new AiError("timeout", `${o.id} timed out`, undefined, o.id);
      throw new AiError("unavailable", `${o.id} network error`, 5_000, o.id);
    }
    if (!res.ok) throw await errorFromResponse(res, o.id);
    return res;
  }

  const provider: Provider = {
    id: o.id,
    capabilities: caps,
    rpm: o.rpm,
    async chat(req: ChatRequest, signal: AbortSignal): Promise<ChatResult> {
      const list = req.capability === "vision" ? visionModels : textModels;
      const existing = list.filter((m) => !gone.has(m));
      if (existing.length === 0) throw new AiError("bad_request", `${o.id}: none of the configured models (${list.join(", ")}) exist any more`, undefined, o.id);
      const t0 = Date.now();
      const usable = existing.filter((m) => (busyUntil.get(m) ?? 0) <= t0);
      if (usable.length === 0) {
        const wait = Math.min(...existing.map((m) => busyUntil.get(m)! - t0));
        throw new AiError("rate_limit", `${o.id}: every model is busy`, wait, o.id);
      }
      let res: Response | undefined;
      let model = usable[0]!;
      for (const m of usable) {
        model = m;
        const body: Record<string, unknown> = {
          model,
          messages: req.messages,
          temperature: req.temperature ?? 0.3,
          max_tokens: Math.min(req.maxTokens ?? 4096, o.maxTokensCap ?? Infinity),
        };
        if (req.json && o.jsonMode) body.response_format = { type: "json_object" };
        const effort = typeof o.reasoningEffort === "function" ? o.reasoningEffort(model) : o.reasoningEffort;
        if (effort) body.reasoning_effort = effort;
        if (req.onDelta) body.stream = true;
        try {
          res = await call("/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, signal);
          break;
        } catch (e) {
          const last = m === usable[usable.length - 1];
          if (isMissingModel(e)) gone.add(m);
          else if (e instanceof AiError && e.kind === "rate_limit") busyUntil.set(m, Date.now() + (e.retryAfterMs ?? 30_000));
          else throw e;
          if (last) throw e;
        }
      }
      if (!res) throw new AiError("unavailable", `${o.id} gave no reply`, undefined, o.id);
      if (req.onDelta) return { text: await readStream(res, req.onDelta), provider: o.id, model };
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; model?: string };
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new AiError("invalid_output", `${o.id} returned an empty reply`, undefined, o.id);
      return { text, provider: o.id, model: json.model ?? model };
    },
  };

  /** Server-sent events from /chat/completions with stream: true. */
  async function readStream(res: Response, onDelta: (soFar: string) => void): Promise<string> {
    if (!res.body) throw new AiError("unavailable", `${o.id} sent no stream`, undefined, o.id);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          let j: { choices?: { delta?: { content?: string | null } }[]; error?: { message?: string } };
          try {
            j = JSON.parse(data);
          } catch {
            continue;
          }
          if (j.error) throw new AiError("unavailable", `${o.id}: ${j.error.message ?? "stream error"}`, 5_000, o.id);
          const d = j.choices?.[0]?.delta?.content;
          if (d) {
            text += d;
            onDelta(text);
          }
        }
      }
    } catch (e) {
      if (e instanceof AiError) throw e;
      if ((e as Error).name === "AbortError") throw new AiError("timeout", `${o.id} timed out`, undefined, o.id);
      throw new AiError("unavailable", `${o.id} stream broke off`, 5_000, o.id);
    }
    if (!text) throw new AiError("invalid_output", `${o.id} returned an empty reply`, undefined, o.id);
    return text;
  }

  if (o.audioModel) {
    provider.transcribe = async (req: TranscribeRequest, signal: AbortSignal): Promise<TranscribeResult> => {
      const form = new FormData();
      form.append("file", req.audio, req.filename);
      form.append("model", o.audioModel!);
      form.append("response_format", "verbose_json");
      form.append("temperature", "0");
      if (req.language) form.append("language", req.language);
      if (req.prompt) form.append("prompt", req.prompt.slice(0, 800));
      const res = await call("/audio/transcriptions", { method: "POST", body: form }, signal);
      const json = (await res.json()) as { text?: string; segments?: { start: number; end: number; text: string }[] };
      return {
        text: (json.text ?? "").trim(),
        segments: (json.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() })),
        provider: o.id,
        model: o.audioModel!,
      };
    };
  }
  return provider;
}
