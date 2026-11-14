import { mockProvider } from "./providers/mock";
import { openAICompatible } from "./providers/openai-compatible";
import type { Provider, ProviderId } from "./types";

/**
 * Builds providers from server environment variables. Only providers with a
 * key are enabled. Model names are configurable because free model line-ups
 * change often; defaults were current in late 2026.
 */
export function providersFromEnv(env: Record<string, string | undefined>): {
  providers: Provider[];
  chains: { text: ProviderId[]; vision: ProviderId[]; audio: ProviderId[] };
} {
  const providers: Provider[] = [];
  if (env.AI_MOCK === "1") {
    providers.push(mockProvider());
    return { providers, chains: { text: ["mock"], vision: ["mock"], audio: ["mock"] } };
  }
  if (env.GEMINI_API_KEY) {
    providers.push(
      openAICompatible({
        id: "gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: env.GEMINI_API_KEY,
        textModel: env.GEMINI_MODEL ?? "gemini-flash-latest,gemini-flash-lite-latest",
        visionModel: env.GEMINI_VISION_MODEL ?? env.GEMINI_MODEL ?? "gemini-flash-latest,gemini-flash-lite-latest",
        rpm: Number(env.GEMINI_RPM ?? 8),
        // GEMINI_REASONING=off stops sending it, for models that reject it.
        reasoningEffort: env.GEMINI_REASONING === "off" ? undefined : (env.GEMINI_REASONING ?? "low"),
      }),
    );
  }
  if (env.GROQ_API_KEY) {
    providers.push(
      openAICompatible({
        id: "groq",
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: env.GROQ_API_KEY,
        // Groq retired its Llama models from the free tier in mid-2026.
        textModel: env.GROQ_MODEL ?? "openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b",
        visionModel: env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b",
        // gpt-oss thinks before answering; keep it short. Other models don't take the setting.
        reasoningEffort: (m) => (m.startsWith("openai/gpt-oss") ? "low" : undefined),
        maxTokensCap: Number(env.GROQ_MAX_TOKENS ?? 3500),
        audioModel: env.GROQ_AUDIO_MODEL ?? "whisper-large-v3-turbo",
        rpm: Number(env.GROQ_RPM ?? 25),
        jsonMode: true,
      }),
    );
  }
  if (env.OPENROUTER_API_KEY) {
    providers.push(
      openAICompatible({
        id: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: env.OPENROUTER_API_KEY,
        textModel: env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free",
        rpm: Number(env.OPENROUTER_RPM ?? 15),
        extraHeaders: { "X-Title": "Adept" },
      }),
    );
  }
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN) {
    const cf = openAICompatible({
      id: "cloudflare",
      baseUrl: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
      apiKey: env.CLOUDFLARE_API_TOKEN,
      textModel: env.CLOUDFLARE_MODEL ?? "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      rpm: Number(env.CLOUDFLARE_RPM ?? 20),
    });
    providers.push(cf);
  }
  const list = (v: string | undefined, d: ProviderId[]) =>
    (v ? (v.split(",").map((s) => s.trim()) as ProviderId[]) : d).filter((id) => providers.some((p) => p.id === id));
  return {
    providers,
    chains: {
      // Groq first: it answers in a second or two, Gemini Flash takes longer.
      // If Groq is busy (its free tier allows 8,000 tokens a minute), Gemini takes over.
      text: list(env.AI_TEXT_CHAIN, ["groq", "gemini", "openrouter", "cloudflare"]),
      vision: list(env.AI_VISION_CHAIN, ["gemini", "groq"]),
      audio: list(env.AI_AUDIO_CHAIN, ["groq", "cloudflare"]),
    },
  };
}
