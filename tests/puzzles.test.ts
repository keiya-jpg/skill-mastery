import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { forcesMateInTwo, matingMoves } from "@/lib/chess/engine";
import { PUZZLES } from "@/lib/chess/puzzles";

const move = (g: Chess, uci: string) => g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });

describe("every shipped chess puzzle is correct", () => {
  it("has puzzles for every theme", () => {
    for (const t of ["mate1", "mate2", "material"]) expect(PUZZLES.filter((p) => p.theme === t).length).toBeGreaterThanOrEqual(20);
  });
  it("ids are unique", () => {
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
  });
  for (const p of PUZZLES) {
    it(`${p.id} (${p.theme})`, () => {
      const g = new Chess(p.fen);
      if (p.theme === "mate1") {
        expect(matingMoves(g)).toHaveLength(1);
        move(g, p.line[0]!);
        expect(g.isCheckmate()).toBe(true);
      } else if (p.theme === "mate2") {
        expect(matingMoves(g)).toHaveLength(0);
        const first = g.moves({ verbose: true }).find((m) => `${m.from}${m.to}${m.promotion ?? ""}` === p.line[0]);
        expect(first).toBeTruthy();
        expect(forcesMateInTwo(g, first!)).toBe(true);
        for (const uci of p.line) move(g, uci);
        expect(g.isCheckmate()).toBe(true);
      } else {
        for (const uci of p.line) move(g, uci); // the whole line is legal
        expect(p.line.length).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
