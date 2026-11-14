import type { z } from "zod";
import { AiError } from "./errors";

/** Pull the first JSON object out of a model reply (tolerates ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) throw new AiError("invalid_output", "No JSON object in reply");
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch (e) {
    throw new AiError("invalid_output", `Bad JSON: ${(e as Error).message}`);
  }
}

export function parseWith<T>(schema: z.ZodType<T>, text: string): T {
  const parsed = schema.safeParse(extractJson(text));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AiError("invalid_output", `Schema mismatch at ${issue?.path.join(".")}: ${issue?.message}`);
  }
  return parsed.data;
}

/**
 * The value of a string field from JSON that is still arriving, e.g. the
 * "reply" of a tutor answer while it streams in. Returns what has arrived so far.
 */
export function partialJsonString(raw: string, key: string): string {
  const m = new RegExp(`"${key}"\\s*:\\s*"`).exec(raw);
  if (!m) return "";
  let out = "";
  for (let i = m.index + m[0].length; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === '"') break;
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const nx = raw[i + 1];
    if (nx === undefined) break;
    if (nx === "u") {
      const hex = raw.slice(i + 2, i + 6);
      if (hex.length < 4) break;
      out += String.fromCharCode(parseInt(hex, 16));
      i += 5;
      continue;
    }
    out += ({ n: "\n", t: "\t", r: "", b: "", f: "", '"': '"', "\\": "\\", "/": "/" } as Record<string, string>)[nx] ?? nx;
    i++;
  }
  return out;
}
