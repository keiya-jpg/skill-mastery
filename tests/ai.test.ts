import { describe, expect, it } from "vitest";
import { createAiRouter, providersFromEnv } from "@/lib/ai/router-exports";
import { outlinePrompt, outlineSchema, parseStageOutput, PROMPT_VERSION, stageOutputSchema, stagePrompt } from "@/lib/skill/prompts";
import { cleanStage, skillSpecSchema, type SkillSpec } from "@/lib/skill/schema";

describe("AI module pipeline (offline mock provider)", () => {
  const ai = createAiRouter(providersFromEnv({ AI_MOCK: "1" }));

  it("turns a request into a valid outline and a valid stage", async () => {
    const { data: o } = await ai.completeJson({ task: "skill-outline", messages: outlinePrompt("juggling three balls") }, outlineSchema, PROMPT_VERSION);
    expect(o.ok).toBe(true);
    const spec: SkillSpec = {
      version: 1,
      slug: "juggling-three-balls",
      name: o.name!,
      kind: o.kind!,
      emoji: o.emoji!,
      hook: o.hook!,
      summary: o.summary!,
      equipment: [],
      tags: [],
      stages: o.stages!.map((s, i) => ({ id: `s${i + 1}`, ...s, activities: [], cards: [] })),
    };
    expect(skillSpecSchema.safeParse(spec).success).toBe(true);
    const { data } = await ai.completeJson({ task: "skill-stage", messages: stagePrompt(spec, 0) }, stageOutputSchema, PROMPT_VERSION);
    const parsed = parseStageOutput(data);
    const stage = cleanStage({ ...spec.stages[0]!, ...parsed });
    expect(stage.activities.length).toBeGreaterThanOrEqual(3);
    expect(skillSpecSchema.safeParse({ ...spec, stages: [stage, ...spec.stages.slice(1)] }).success).toBe(true);
  });

  it("refuses harmful requests", async () => {
    const { data } = await ai.completeJson({ task: "skill-outline", messages: outlinePrompt("how to make a bomb") }, outlineSchema, PROMPT_VERSION);
    expect(data.ok).toBe(false);
  });
});
