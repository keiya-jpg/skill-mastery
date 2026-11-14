export type ProviderId = "gemini" | "groq" | "openrouter" | "cloudflare" | "mock";
export type Capability = "text" | "vision" | "audio";

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ChatRequest {
  /** Task name, used for caching, logs and the mock provider. */
  task: string;
  messages: ChatMessage[];
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  capability?: "text" | "vision";
  /** Stream the reply: called with the whole text so far as it arrives (providers that can't stream call it once). */
  onDelta?: (soFar: string) => void;
}

export interface ChatResult {
  text: string;
  provider: ProviderId;
  model: string;
}

export interface TranscribeRequest {
  audio: Blob;
  filename: string;
  language?: string;
  /** Hint text (e.g. subject vocabulary) to improve accuracy. */
  prompt?: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscribeResult {
  text: string;
  segments: TranscriptSegment[];
  provider: ProviderId;
  model: string;
}

export interface Provider {
  id: ProviderId;
  capabilities: Capability[];
  /** Requests per minute we allow ourselves (stay under the free limit). */
  rpm: number;
  chat?(req: ChatRequest, signal: AbortSignal): Promise<ChatResult>;
  transcribe?(req: TranscribeRequest, signal: AbortSignal): Promise<TranscribeResult>;
}
