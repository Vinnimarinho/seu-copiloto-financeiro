/**
 * Classificação única de score 0-100 usada em todo o produto.
 * Faixas:
 *  - 0 a 40   → Ruim       (vermelho / destructive)
 *  - 41 a 60  → Atenção    (amarelo / warning)
 *  - 61 a 80  → Bom        (verde / success)
 *  - 81 a 100 → Excelente  (roxo / accent)
 */

export type ScoreTier = "bad" | "warning" | "good" | "excellent";

export interface ScoreClass {
  tier: ScoreTier;
  label: string;
  /** Tailwind text color class (semantic token) */
  textClass: string;
  /** Tailwind bg color class (semantic token, with /10 opacity) */
  bgClass: string;
  /** Tailwind solid bg color class for progress bars */
  solidBgClass: string;
  /** Border color class */
  borderClass: string;
}

export function getScoreClass(rawScore: number | null | undefined): ScoreClass {
  const score = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)));

  if (score <= 40) {
    return {
      tier: "bad",
      label: "Ruim",
      textClass: "text-destructive",
      bgClass: "bg-destructive/10",
      solidBgClass: "bg-destructive",
      borderClass: "border-destructive/30",
    };
  }
  if (score <= 60) {
    return {
      tier: "warning",
      label: "Atenção",
      textClass: "text-warning",
      bgClass: "bg-warning/10",
      solidBgClass: "bg-warning",
      borderClass: "border-warning/30",
    };
  }
  if (score <= 80) {
    return {
      tier: "good",
      label: "Bom",
      textClass: "text-success",
      bgClass: "bg-success/10",
      solidBgClass: "bg-success",
      borderClass: "border-success/30",
    };
  }
  return {
    tier: "excellent",
    label: "Excelente",
    textClass: "text-accent",
    bgClass: "bg-accent/10",
    solidBgClass: "bg-accent",
    borderClass: "border-accent/30",
  };
}

export function getScoreLabel(score: number | null | undefined): string {
  return getScoreClass(score).label;
}
