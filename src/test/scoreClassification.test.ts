import { describe, it, expect } from "vitest";
import { getScoreClass, getScoreLabel } from "@/lib/scoreClassification";

describe("scoreClassification — motor único de score 0-100", () => {
  it("classifica 0-40 como Ruim (destructive)", () => {
    expect(getScoreClass(0).tier).toBe("bad");
    expect(getScoreClass(20).tier).toBe("bad");
    expect(getScoreClass(40).tier).toBe("bad");
    expect(getScoreClass(40).textClass).toBe("text-destructive");
  });

  it("classifica 41-60 como Atenção (warning)", () => {
    expect(getScoreClass(41).tier).toBe("warning");
    expect(getScoreClass(60).tier).toBe("warning");
    expect(getScoreLabel(50)).toBe("Atenção");
  });

  it("classifica 61-80 como Bom (success)", () => {
    expect(getScoreClass(61).tier).toBe("good");
    expect(getScoreClass(80).tier).toBe("good");
    expect(getScoreClass(75).textClass).toBe("text-success");
  });

  it("classifica 81-100 como Excelente (accent)", () => {
    expect(getScoreClass(81).tier).toBe("excellent");
    expect(getScoreClass(100).tier).toBe("excellent");
    expect(getScoreLabel(95)).toBe("Excelente");
  });

  it("trata valores fora do range com clamp", () => {
    expect(getScoreClass(-50).tier).toBe("bad");
    expect(getScoreClass(150).tier).toBe("excellent");
    expect(getScoreClass(null).tier).toBe("bad");
    expect(getScoreClass(undefined).tier).toBe("bad");
  });

  it("arredonda valores fracionários", () => {
    expect(getScoreClass(40.4).tier).toBe("bad");
    expect(getScoreClass(40.6).tier).toBe("warning");
  });
});
