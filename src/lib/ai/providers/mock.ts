import type { ChatRequest, Provider } from "../types";

/**
 * Offline stand-in for local development and tests (AI_MOCK=1). Produces a
 * small but valid module for any skill so the whole flow runs without keys.
 * Never enable in production.
 */
function lastText(req: ChatRequest): string {
  const last = req.messages[req.messages.length - 1];
  return typeof last?.content === "string" ? last.content : (last?.content.map((p) => ("text" in p ? p.text : "")).join("\n") ?? "");
}

export function mockProvider(): Provider {
  return {
    id: "mock",
    capabilities: ["text", "vision"],
    rpm: 10_000,
    async chat(req) {
      const text = lastText(req);
      let out: unknown;
      if (req.task === "skill-outline") {
        const raw = text.match(/<skill>([\s\S]*?)<\/skill>/)?.[1]?.trim() ?? "Something";
        if (/bomb|hack into|steal/i.test(raw)) {
          out = { ok: false, reason: "That isn't something this app can help with." };
        } else {
          const name = raw.charAt(0).toUpperCase() + raw.slice(1);
          out = {
            ok: true,
            name,
            kind: /ball|run|jump|swim|throw|dance/i.test(raw) ? "physical" : "mental",
            emoji: "✨",
            hook: `Most people plateau at ${raw} because they practise what they're already good at.`,
            summary: `Learn ${raw} step by step, with one clear goal per session and practice that adapts to you.`,
            equipment: [],
            tags: ["practice"],
            aliases: [raw.toLowerCase()],
            stages: [
              { title: "First steps", goal: "Get 4 of 5 basics questions right.", why: "Foundations free your attention for the hard parts.", minutes: 8 },
              { title: "Core technique", goal: "Do the core move 8 of 10 times.", why: "One solid technique beats five shaky ones.", minutes: 12 },
              { title: "Under pressure", goal: "Keep 7 of 10 with a time limit.", why: "Pressure shows what's automatic.", minutes: 12 },
              { title: "Mix it up", goal: "Mixed practice, 7 of 10.", why: "Variety transfers to real use.", minutes: 15 },
            ],
          };
        }
      } else if (req.task === "skill-stage") {
        const physical = /\(physical\)|\(mixed\)/.test(text);
        out = {
          activities: [
            {
              type: "explain",
              id: "intro",
              title: "The one idea for today",
              text: "Focus on a single thing this session. Do it slowly and correctly first, then speed up. Notice what happens right before a mistake.",
              predict: { question: "What usually improves skill fastest?", options: ["Doing lots, quickly", "Focused practice on one weakness with feedback"], answer: 1 },
            },
            {
              type: "quiz",
              id: "check",
              question: "You're getting 10 out of 10. What should you do?",
              options: [
                { text: "Keep going, it feels great", why: "Easy success teaches little. It's a sign to step up." },
                { text: "Make it a bit harder", why: "Right. Aim for roughly 7 or 8 out of 10." },
              ],
              answer: 1,
            },
            physical
              ? {
                  type: "drill",
                  id: "core-drill",
                  title: "Core drill",
                  instructions: ["Do the move slowly", "Count clean attempts"],
                  cue: "Aim at the target, not your hands.",
                  sets: 2,
                  perSet: 10,
                  unit: "attempts",
                  log: "makes",
                  success: "8 of 10",
                  easier: "Halve the distance.",
                  harder: "Add a time limit.",
                }
              : { type: "recall", id: "core-recall", prompt: "In your own words: what is today's one idea?", answer: "Focus on one thing, slowly and correctly, then speed up." },
            { type: "order", id: "loop", prompt: "Put the practice loop in order.", steps: ["Try", "Get feedback", "Adjust", "Try again"] },
            { type: "reflect", id: "reflect", prompt: "What will you change next time?" },
          ],
          cards: [{ id: "sweet-spot", front: "What success rate should practice aim for?", back: "Roughly 70 to 85%." }],
        };
      } else {
        out = {};
      }
      const json = JSON.stringify(out);
      req.onDelta?.(json);
      return { text: json, provider: "mock", model: "mock" };
    },
  };
}
