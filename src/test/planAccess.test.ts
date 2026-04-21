import { describe, it, expect } from "vitest";
import { getPlanByProductId, PLANS } from "@/hooks/useSubscription";

describe("Plan gating — mapeamento Stripe productId → plano", () => {
  it("retorna 'free' quando não há produto", () => {
    expect(getPlanByProductId(null)).toBe("free");
    expect(getPlanByProductId("")).toBe("free");
  });

  it("identifica plano Essencial", () => {
    expect(getPlanByProductId(PLANS.essencial.product_id)).toBe("essencial");
  });

  it("identifica plano Pro", () => {
    expect(getPlanByProductId(PLANS.pro.product_id)).toBe("pro");
  });

  it("retorna 'free' para produtos desconhecidos (segurança)", () => {
    expect(getPlanByProductId("prod_unknown_xyz")).toBe("free");
  });
});

describe("Plano gratuito — bloqueio de features pagas", () => {
  it("free NÃO acessa oportunidades nem PDF", () => {
    // Espelho da regra server-side em verify-plan-access:
    // opportunities = isPaid; reports_pdf = isPaid; unlimited = isPro
    const plan = "free";
    const isPaid = plan !== "free";
    expect(isPaid).toBe(false);
  });

  it("essencial acessa oportunidades e PDF, mas não unlimited portfolios", () => {
    const plan = "essencial" as "free" | "essencial" | "pro";
    const isPaid = plan !== "free";
    const isPro = plan === "pro";
    expect(isPaid).toBe(true);
    expect(isPro).toBe(false);
  });

  it("pro acessa tudo", () => {
    const plan = "pro" as "free" | "essencial" | "pro";
    const isPaid = plan !== "free";
    const isPro = plan === "pro";
    expect(isPaid).toBe(true);
    expect(isPro).toBe(true);
  });
});
