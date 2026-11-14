import { z } from "zod";
import { activitySchema, cardSchema, KINDS, type SkillSpec } from "./schema";

/** Bump when prompts change in a way that should produce new modules. */
export const PROMPT_VERSION = "skill-v1";

const PRINCIPLES = `You design practice plans that take a beginner toward real mastery of a skill. Ground every choice in learning science:
- Deliberate practice: each stage has ONE observable, checkable goal ("make 7 of 10 free throws", "recall 10 words in order"), focused practice on it, and immediate feedback.
- Keep difficulty near 70-85% success. Give every drill an easier and a harder variation.
- Retrieval over re-reading: test, don't tell. Use "predict first" questions before explanations to spark curiosity.
- Short explanations (about 60 words). One idea at a time.
- Physical skills: countable drills (log makes out of attempts), one cue about the target or effect of the movement rather than body parts, optional mental rehearsal, varied/random practice once basics are in place.
- Be honest: if a popular claim about the skill is myth or hype, say so plainly and teach what actually works. Mention safety for risky physical skills.
- British English. Warm, plain, specific. No hype, no emojis except the one "emoji" field.`;

export const outlineSchema = z.object({
  ok: z.boolean(),
  reason: z.string().max(300).optional(),
  name: z.string().trim().min(1).max(60).optional(),
  kind: z.enum(KINDS).optional(),
  emoji: z.string().min(1).max(8).optional(),
  hook: z.string().trim().max(160).optional(),
  summary: z.string().trim().max(400).optional(),
  equipment: z.array(z.string().trim().max(60)).max(8).optional(),
  tags: z.array(z.string().trim().max(30)).max(8).optional(),
  honesty: z.string().max(500).optional(),
  aliases: z.array(z.string().trim().max(60)).max(8).optional(),
  stages: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(80),
        goal: z.string().trim().min(1).max(200),
        why: z.string().trim().min(1).max(300),
        minutes: z.number().int().min(3).max(60),
      }),
    )
    .min(3)
    .max(7)
    .optional(),
});
export type Outline = z.infer<typeof outlineSchema>;

export function outlinePrompt(query: string) {
  return [
    { role: "system" as const, content: PRINCIPLES },
    {
      role: "user" as const,
      content: `Someone wants to master this skill: <skill>${query.slice(0, 120)}</skill>

First decide if it's OK to teach. Set "ok": false with a short, kind "reason" if it is not a learnable skill (gibberish, a question, a person's name), or if it would help someone harm people, break the law, cheat, hack others, make weapons or drugs, or self-harm. Otherwise "ok": true.

If ok, reply with JSON:
{
  "ok": true,
  "name": "short canonical name, Title case first word only (e.g. 'Juggling three balls')",
  "kind": "mental" | "physical" | "mixed",
  "emoji": "one emoji",
  "hook": "one surprising, true sentence that makes a curious person want to start (max 160 chars)",
  "summary": "two sentences: what they'll be able to do and how the plan gets them there",
  "equipment": ["what they need, if anything"],
  "tags": ["2-5 lowercase tags"],
  "honesty": "optional: a myth to bust or a safety note, only if genuinely useful",
  "aliases": ["other ways people search for this"],
  "stages": [ 4 to 6 stages from first steps to a solid level, each {"title", "goal" (observable and checkable), "why" (one sentence), "minutes" (one session, 8-25)} ]
}`,
    },
  ];
}

export const stageOutputSchema = z.object({
  activities: z.array(z.unknown()).min(1).max(10),
  cards: z.array(z.unknown()).max(12).optional(),
});

/** Keeps the activities and cards that validate, drops the rest. */
export function parseStageOutput(raw: z.infer<typeof stageOutputSchema>) {
  const activities = raw.activities.flatMap((a) => {
    const r = activitySchema.safeParse(a);
    return r.success && r.data.type !== "engine" ? [r.data] : [];
  });
  const cards = (raw.cards ?? []).flatMap((c) => {
    const r = cardSchema.safeParse(c);
    return r.success ? [r.data] : [];
  });
  return { activities, cards };
}

const ACTIVITY_GUIDE = `Activity types (use only these, exact field names):
- {"type":"explain","id":"kebab-id","title":"...","text":"about 60 words","predict":{"question":"...","options":["...","..."],"answer":0}}  (predict is optional; answer is the index of the right option)
- {"type":"quiz","id":"...","question":"...","options":[{"text":"...","why":"why it's right or wrong, teaching"}],"answer":0}
- {"type":"recall","id":"...","prompt":"question to answer from memory","answer":"short model answer","tip":"optional memory tip"}
- {"type":"order","id":"...","prompt":"Put these in order","steps":["first","second","third"]}  (3-7 steps, listed in the CORRECT order)
- {"type":"drill","id":"...","title":"...","setup":"optional","instructions":["1-5 short steps"],"cue":"one external cue","sets":3,"perSet":10,"unit":"attempts"|"reps"|"seconds","log":"makes"|"done"|"rating","success":"what success looks like, e.g. 7 of 10","easier":"easier variation","harder":"harder variation","imagery":true,"callouts":["optional random call-outs for varied practice, e.g. spots or targets"]}
  (use "makes" when successes can be counted out of attempts; "done" for timed holds or reps; "rating" for quality you judge 1-5)
- {"type":"imagery","id":"...","title":"...","script":"second-person guided rehearsal, present tense","seconds":60}
- {"type":"reflect","id":"...","prompt":"one short question"}
Cards are for spaced review of the key facts or cues: {"id":"...","front":"question","back":"short answer","tip":"optional"}`;

export function stagePrompt(spec: Pick<SkillSpec, "name" | "kind" | "summary" | "stages" | "honesty">, index: number) {
  const plan = spec.stages.map((s, i) => `${i + 1}. ${s.title}: ${s.goal}`).join("\n");
  const stage = spec.stages[index]!;
  return [
    { role: "system" as const, content: PRINCIPLES },
    {
      role: "user" as const,
      content: `Skill: ${spec.name} (${spec.kind}). ${spec.summary}
${spec.honesty ? `Note: ${spec.honesty}\n` : ""}
Full plan:
${plan}

Write the practice session for stage ${index + 1}: "${stage.title}". Goal: ${stage.goal}. About ${stage.minutes} minutes.

${ACTIVITY_GUIDE}

Rules:
- 3 to 6 activities. Start with an "explain" (add "predict" when there's a good surprising question). Then mostly practice: ${
        spec.kind === "mental" ? "quizzes, recall and order activities, with every quiz option explained" : spec.kind === "physical" ? "drills the person does for real and logs (at least one with log \"makes\" if anything can be counted), plus an imagery rehearsal if it helps" : "a mix of drills and quizzes"
      }. The final practice activity should test the stage goal directly. Optionally end with one "reflect".
- 2 to 5 cards.
- Use unique kebab-case ids.
- Everything must be correct. Prefer leaving something out to guessing.

Reply with JSON only: {"activities":[...],"cards":[...]}`,
    },
  ];
}
