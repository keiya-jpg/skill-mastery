import { describe, expect, it } from "vitest";
import { advice, nextLevel, puzzleTarget, staircase, updateRating } from "@/lib/adapt";
import { suggest } from "@/lib/discover";
import { majorDigits, sameWord } from "@/lib/memory";
import { matchSeed, SEEDS, searchLocal } from "@/lib/skill/catalog";
import { IDEAS } from "@/lib/skill/ideas";
import { parseStageOutput } from "@/lib/skill/prompts";
import { cleanStage, skillSpecSchema, slugify } from "@/lib/skill/schema";
import { isDue, newCard, review } from "@/lib/srs";
import { DEFAULT_PREFS } from "@/lib/store";

describe("hand-built modules", () => {
  for (const s of SEEDS) {
    it(`${s.slug} is a valid module`, () => {
      expect(skillSpecSchema.safeParse(s).success).toBe(true);
      for (const st of s.stages) {
        expect(st.activities.length).toBeGreaterThan(0);
        expect(cleanStage(st).activities.length).toBe(st.activities.length);
      }
      const ids = s.stages.flatMap((st) => st.cards.map((c) => c.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
  it("every idea has a unique slug", () => {
    const slugs = IDEAS.map((i) => slugify(i.name));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("search", () => {
  it("maps photographic memory to the memory module", () => {
    expect(matchSeed("photographic memory")?.slug).toBe("memory-training");
    expect(matchSeed("learn chess")?.slug).toBe("chess");
    expect(matchSeed("free throws")?.slug).toBe("basketball");
    expect(matchSeed("knitting")).toBeUndefined();
  });
  it("finds ideas locally", () => {
    expect(searchLocal("juggl")[0]?.name).toMatch(/Juggling/);
  });
});

describe("adaptive difficulty", () => {
  it("steps up above 85% and down below 50%", () => {
    expect(nextLevel(0, 0.9)).toBe(1);
    expect(nextLevel(0, 0.7)).toBe(0);
    expect(nextLevel(0, 0.3)).toBe(-1);
    expect(nextLevel(1, 0.95)).toBe(1);
    expect(advice(0.7)).toBe("stay");
  });
  it("staircase", () => {
    expect(staircase(10, 1, { min: 3, max: 20 })).toBe(11);
    expect(staircase(10, 0.5, { min: 3, max: 20 })).toBe(9);
    expect(staircase(3, 0, { min: 3, max: 20 })).toBe(3);
  });
  it("puzzle target gives about 70% expected success", () => {
    const r = 1200;
    const expected = 1 / (1 + 10 ** ((puzzleTarget(r) - r) / 400));
    expect(expected).toBeGreaterThan(0.65);
    expect(expected).toBeLessThan(0.75);
    expect(updateRating(1200, 1200, true)).toBeGreaterThan(1200);
  });
});

describe("memory helpers", () => {
  it("decodes Major system words", () => {
    expect(majorDigits("tyre")).toBe("14");
    expect(majorDigits("moon")).toBe("32");
    expect(majorDigits("chain")).toBe("62");
    expect(majorDigits("cat")).toBe("71");
    expect(majorDigits("mummy")).toBe("33");
    expect(majorDigits("bell")).toBe("95");
  });
  it("forgives small typos", () => {
    expect(sameWord("Elephnt", "elephant")).toBe(true);
    expect(sameWord("cats", "cat")).toBe(true);
    expect(sameWord("dog", "cat")).toBe(false);
  });
});

describe("spaced repetition", () => {
  it("schedules a remembered card later than a forgotten one", () => {
    const c = newCard(new Date("2026-01-01"));
    expect(isDue(c, new Date("2026-01-01"))).toBe(true);
    const good = review(c, 3, new Date("2026-01-01"));
    const again = review(c, 1, new Date("2026-01-01"));
    expect(new Date(good.due).getTime()).toBeGreaterThan(new Date(again.due).getTime());
  });
});

describe("discovery", () => {
  it("respects preferences and exclusions, mostly", () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const out = suggest({ prefs: { ...DEFAULT_PREFS, kinds: ["physical"] }, exclude: new Set(["basketball"]), count: 20, rand });
    expect(out.find((e) => e.slug === "basketball")).toBeUndefined();
    expect(out.filter((e) => e.kind === "physical").length).toBeGreaterThanOrEqual(12);
  });
});

describe("AI output handling", () => {
  it("keeps valid activities and drops broken or forbidden ones", () => {
    const out = parseStageOutput({
      activities: [
        { type: "quiz", id: "q", question: "?", options: [{ text: "a", why: "b" }, { text: "c", why: "d" }], answer: 1 },
        { type: "quiz", id: "bad" },
        { type: "engine", id: "e", engine: "chess-play", title: "x" },
        { type: "script", id: "s", code: "alert(1)" },
      ],
      cards: [{ id: "c", front: "f", back: "b" }, { nope: 1 }],
    });
    expect(out.activities.map((a) => a.id)).toEqual(["q"]);
    expect(out.cards).toHaveLength(1);
  });
  it("drops quiz answers that point past the options", () => {
    const st = cleanStage({ id: "s", title: "t", goal: "g", why: "w", minutes: 5, cards: [], activities: [{ type: "quiz", id: "q", question: "?", options: [{ text: "a", why: "b" }, { text: "c", why: "d" }], answer: 5 }] });
    expect(st.activities).toHaveLength(0);
  });
});
