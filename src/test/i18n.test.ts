import { describe, it, expect } from "vitest";
import ptBR from "@/i18n/locales/pt-BR.json";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "object" && v !== null
      ? flatten(v as Record<string, unknown>, key)
      : [key];
  });
}

describe("i18n — paridade de chaves entre idiomas", () => {
  const ptKeys = flatten(ptBR).sort();
  const enKeys = flatten(en).sort();
  const esKeys = flatten(es).sort();

  it("EN tem todas as chaves de PT-BR", () => {
    const missing = ptKeys.filter((k) => !enKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("ES tem todas as chaves de PT-BR", () => {
    const missing = ptKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("não há chaves órfãs em EN ou ES", () => {
    const enExtra = enKeys.filter((k) => !ptKeys.includes(k));
    const esExtra = esKeys.filter((k) => !ptKeys.includes(k));
    expect(enExtra).toEqual([]);
    expect(esExtra).toEqual([]);
  });
});

describe("Compliance regulatório — termos proibidos na UI", () => {
  const FORBIDDEN = ["recomendação", "consultoria", "assessor", "gestor da sua carteira"];

  it("PT-BR não usa termos sensíveis da CVM", () => {
    const json = JSON.stringify(ptBR).toLowerCase();
    FORBIDDEN.forEach((term) => {
      expect(json).not.toContain(term.toLowerCase());
    });
  });
});
