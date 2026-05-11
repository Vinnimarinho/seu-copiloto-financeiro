import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PRESETS } from "@/lib/simulations/presets";

const NewBadge = () => (
  <span data-testid="new-badge" className="ml-2">
    Novo
  </span>
);

describe("Tesouro Reserva — badge Novo", () => {
  it("preset 'Reserva de emergência no Tesouro Reserva' está marcado como isNew", () => {
    const preset = PRESETS.find((p) => p.id === "move_to_tesouro_reserva");
    expect(preset).toBeDefined();
    expect(preset?.isNew).toBe(true);
    expect(preset?.label).toMatch(/Tesouro Reserva/i);
  });

  it("nenhum outro preset está marcado como isNew", () => {
    const others = PRESETS.filter((p) => p.id !== "move_to_tesouro_reserva");
    for (const p of others) {
      expect(p.isNew).not.toBe(true);
    }
  });

  it("renderiza o badge 'Novo' ao lado do preset Tesouro Reserva", () => {
    render(
      <ul>
        {PRESETS.map((p) => (
          <li key={p.id}>
            <span>{p.label}</span>
            {p.isNew && <NewBadge />}
          </li>
        ))}
      </ul>
    );
    const badges = screen.getAllByTestId("new-badge");
    expect(badges).toHaveLength(1);
    const li = badges[0].closest("li");
    expect(li?.textContent).toMatch(/Tesouro Reserva/i);
  });

  it("renderiza o badge 'Novo' na opção de destino TESOURO_RESERVA", () => {
    // Espelha DESTINATION_ASSETS de src/pages/Simulations.tsx
    const DESTINATION_ASSETS = [
      { code: "TESOURO_RESERVA", label: "Tesouro Reserva (24h, 100% Selic)", isNew: true },
      { code: "TESOURO_POS", label: "Tesouro Selic (pós)" },
      { code: "TESOURO_PRE", label: "Tesouro Prefixado" },
      { code: "TESOURO_IPCA", label: "Tesouro IPCA+" },
      { code: "CDI", label: "CDB / LCI / LCA" },
      { code: "POUPANCA", label: "Poupança (referência)" },
    ] as const;

    render(
      <ul>
        {DESTINATION_ASSETS.map((d) => (
          <li key={d.code} data-code={d.code}>
            <span>{d.label}</span>
            {"isNew" in d && d.isNew && <NewBadge />}
          </li>
        ))}
      </ul>
    );

    const badges = screen.getAllByTestId("new-badge");
    expect(badges).toHaveLength(1);
    const li = badges[0].closest("li");
    expect(li?.getAttribute("data-code")).toBe("TESOURO_RESERVA");
  });
});
