import { describe, it, expect } from "vitest";

/**
 * Testa a lógica de idempotência usada pelo stripe-webhook.
 * Espelha o comportamento server-side: mesmo evento processado 2x → no-op.
 */
function makeIdempotencyTracker() {
  const processed = new Set<string>();
  return {
    isProcessed: (eventId: string) => processed.has(eventId),
    markProcessed: (eventId: string) => processed.add(eventId),
    process: (eventId: string, handler: () => void) => {
      if (processed.has(eventId)) return { skipped: true };
      handler();
      processed.add(eventId);
      return { skipped: false };
    },
  };
}

describe("Stripe webhook — idempotência", () => {
  it("processa novo evento apenas uma vez", () => {
    const tracker = makeIdempotencyTracker();
    let calls = 0;
    const r1 = tracker.process("evt_1", () => calls++);
    const r2 = tracker.process("evt_1", () => calls++);

    expect(r1.skipped).toBe(false);
    expect(r2.skipped).toBe(true);
    expect(calls).toBe(1);
  });

  it("processa eventos diferentes independentemente", () => {
    const tracker = makeIdempotencyTracker();
    let calls = 0;
    tracker.process("evt_1", () => calls++);
    tracker.process("evt_2", () => calls++);
    tracker.process("evt_3", () => calls++);
    expect(calls).toBe(3);
  });

  it("é seguro contra replays maliciosos do mesmo event_id", () => {
    const tracker = makeIdempotencyTracker();
    let calls = 0;
    for (let i = 0; i < 100; i++) {
      tracker.process("evt_replay", () => calls++);
    }
    expect(calls).toBe(1);
  });
});
