import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, FileDown, Trash2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { usePortfolios, usePositions } from "@/hooks/usePortfolio";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import {
  useDeleteSimulation,
  useExportSimulationPdf,
  useMarketRates,
  useSaveSimulation,
  useSimulations,
} from "@/hooks/useSimulations";

import { simulate } from "@/lib/simulations/engine";
import { PRESETS } from "@/lib/simulations/presets";
import type {
  AssetClassKey,
  ConcentrationInputs,
  RebalanceInputs,
  SimulationInputs,
  SwapInputs,
} from "@/lib/simulations/types";

import { ComparisonCard, type ComparisonMetric } from "@/components/simulations/ComparisonCard";
import { AssumptionsPanel } from "@/components/simulations/AssumptionsPanel";
import { SimulationDisclaimer } from "@/components/simulations/SimulationDisclaimer";
import { SimulationsTeaser } from "@/components/simulations/SimulationsTeaser";

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const ASSET_CLASSES: AssetClassKey[] = [
  "Caixa",
  "Renda Fixa",
  "Tesouro",
  "Fundos",
  "ETF",
  "Ações",
  "Cripto",
  "Outros",
];

const DESTINATION_ASSETS: { code: string; label: string; cls: AssetClassKey }[] = [
  { code: "TESOURO_RESERVA", label: "Tesouro Reserva (24h, 100% Selic)", cls: "Caixa" },
  { code: "TESOURO_POS",     label: "Tesouro Selic (pós)",                cls: "Tesouro" },
  { code: "TESOURO_PRE",     label: "Tesouro Prefixado",                  cls: "Tesouro" },
  { code: "TESOURO_IPCA",    label: "Tesouro IPCA+",                      cls: "Tesouro" },
  { code: "CDI",             label: "CDB / LCI / LCA",                    cls: "Renda Fixa" },
  { code: "POUPANCA",        label: "Poupança (referência)",              cls: "Caixa" },
];

export default function Simulations() {
  const navigate = useNavigate();
  const { isPaid, isLoading: planLoading } = usePlanAccess();
  const { data: portfolios } = usePortfolios();
  const portfolioId = portfolios?.[0]?.id;
  const { data: positions, isLoading: posLoading } = usePositions(portfolioId);
  const { data: rates, isLoading: ratesLoading } = useMarketRates();
  const { data: history } = useSimulations();
  const saveMut = useSaveSimulation();
  const deleteMut = useDeleteSimulation();
  const exportMut = useExportSimulationPdf();

  const [tab, setTab] = useState<"swap" | "rebalance" | "concentration">("swap");

  // Swap state
  const [swapFrom, setSwapFrom] = useState<string>("");
  const [swapAmount, setSwapAmount] = useState<string>("1000");
  const [swapIsPercent, setSwapIsPercent] = useState(false);
  const [swapTo, setSwapTo] = useState<string>("TESOURO_POS");

  // Rebalance state
  const [allocation, setAllocation] = useState<Partial<Record<AssetClassKey, number>>>({
    "Caixa": 10,
    "Renda Fixa": 30,
    "Tesouro": 25,
    "Fundos": 10,
    "ETF": 10,
    "Ações": 15,
  });

  // Concentration state
  const [concPct, setConcPct] = useState<number>(60);
  const [concAsset, setConcAsset] = useState<string>("TESOURO_POS");

  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);

  const inputs = useMemo<SimulationInputs | null>(() => {
    if (tab === "swap") {
      if (!swapFrom) return null;
      const dest = DESTINATION_ASSETS.find((d) => d.code === swapTo);
      const r: SwapInputs = {
        mode: "swap",
        fromPositionId: swapFrom,
        amount: Number(swapAmount) || 0,
        amountIsPercent: swapIsPercent,
        toAssetClass: dest?.cls ?? "Renda Fixa",
        toAssetCode: swapTo,
      };
      return r;
    }
    if (tab === "rebalance") {
      const r: RebalanceInputs = { mode: "rebalance", targetAllocation: allocation };
      return r;
    }
    const dest = DESTINATION_ASSETS.find((d) => d.code === concAsset);
    const r: ConcentrationInputs = {
      mode: "concentration",
      targetAssetCode: concAsset,
      targetAssetClass: dest?.cls ?? "Tesouro",
      pctOfPortfolio: concPct,
    };
    return r;
  }, [tab, swapFrom, swapAmount, swapIsPercent, swapTo, allocation, concAsset, concPct]);

  const computed = useMemo(() => {
    if (!positions || positions.length === 0 || !rates || rates.length === 0 || !inputs) return null;
    return simulate(positions, rates, inputs);
  }, [positions, rates, inputs]);

  const metrics: ComparisonMetric[] = useMemo(() => {
    if (!computed) return [];
    const { baseline, scenario, delta } = computed.result;
    const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
    const fmtPP = (n: number) =>
      `${n > 0 ? "+" : ""}${n.toFixed(2)} pp`;
    return [
      {
        label: "Valor investido",
        baseline: BRL(baseline.totalValue),
        scenario: BRL(scenario.totalValue),
        tone: "neutral",
      },
      {
        label: "Rentabilidade estimada (a.a.)",
        baseline: fmtPct(baseline.weightedYieldAnnual),
        scenario: fmtPct(scenario.weightedYieldAnnual),
        delta: fmtPP(delta.yieldAnnualPct),
        tone: delta.yieldAnnualPct >= 0 ? "good" : "bad",
      },
      {
        label: "Resultado estimado em 12 meses",
        baseline: BRL(baseline.totalValue * baseline.weightedYieldAnnual),
        scenario: BRL(scenario.totalValue * scenario.weightedYieldAnnual),
        delta: `${delta.estimatedReturn12m >= 0 ? "+" : ""}${BRL(delta.estimatedReturn12m)}`,
        tone: delta.estimatedReturn12m >= 0 ? "good" : "bad",
      },
      {
        label: "Concentração no maior peso",
        baseline: fmtPct(baseline.topConcentrationPct),
        scenario: fmtPct(scenario.topConcentrationPct),
        delta: fmtPP(delta.concentrationPct),
        tone: delta.concentrationPct <= 0 ? "good" : "bad",
      },
      {
        label: "Risco médio (0–100)",
        baseline: baseline.weightedRiskScore.toFixed(0),
        scenario: scenario.weightedRiskScore.toFixed(0),
        delta: `${delta.riskScore >= 0 ? "+" : ""}${delta.riskScore.toFixed(0)}`,
        tone: delta.riskScore <= 0 ? "good" : "bad",
      },
      {
        label: "Liquidez (0–100)",
        baseline: "—",
        scenario: "—",
        delta: `${delta.liquidityScore >= 0 ? "+" : ""}${delta.liquidityScore} pts`,
        tone: delta.liquidityScore >= 0 ? "good" : "bad",
      },
    ];
  }, [computed]);

  const handlePreset = (presetId: string) => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    const built = p.build();
    setAppliedPreset(p.id);
    if (built.mode === "rebalance") {
      setTab("rebalance");
      setAllocation(built.targetAllocation);
    } else if (built.mode === "concentration") {
      setTab("concentration");
      setConcAsset(built.targetAssetCode);
      setConcPct(built.pctOfPortfolio);
    }
    toast.success(`Cenário aplicado: ${p.label}`);
  };

  const handleSave = async () => {
    if (!computed || !inputs) {
      toast.error("Configure o cenário antes de salvar");
      return;
    }
    const id = await saveMut.mutateAsync({
      name: `Simulação ${new Date().toLocaleString("pt-BR")}`,
      mode: inputs.mode,
      preset: appliedPreset,
      portfolio_id: portfolioId ?? null,
      user_inputs: inputs,
      assumptions: { horizonMonths: 12, ratesUsed: rates ?? [], notes: [] },
      baseline_snapshot: computed.result.baseline,
      scenario_snapshot: computed.result.scenario,
      results: computed.result,
    });
    return id;
  };

  // ----------- RENDER -------------
  if (planLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppSidebar>
    );
  }

  if (!isPaid) {
    return (
      <AppSidebar>
        <div className="space-y-6">
          <header>
            <h1 className="font-heading text-3xl text-foreground">Simulações de Cenários</h1>
            <p className="text-muted-foreground mt-1">
              Premium — explore o impacto potencial de mudanças na sua carteira.
            </p>
          </header>
          <SimulationsTeaser />
        </div>
      </AppSidebar>
    );
  }

  const noPositions = !posLoading && (!positions || positions.length === 0);

  return (
    <AppSidebar>
      <div className="space-y-6 max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Simulações de Cenários</h1>
            <p className="text-muted-foreground mt-1">
              Compare cenário atual vs. simulado. Decisão final sempre é sua.
            </p>
          </div>
          <Badge variant="secondary" className="self-start sm:self-auto gap-1">
            <Sparkles className="w-3 h-3" /> Premium
          </Badge>
        </header>

        <SimulationDisclaimer />

        {/* Cenários prontos */}
        <Card className="p-5">
          <h3 className="font-heading text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Cenários prontos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/5 transition-colors"
              >
                <div className="text-sm font-semibold text-foreground">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {noPositions ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Você ainda não tem posições importadas para simular.
            </p>
            <Button onClick={() => navigate("/portfolio/import")}>Importar carteira</Button>
          </Card>
        ) : (
          <>
            {/* Modos */}
            <Card className="p-5">
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="swap">Troca de posição</TabsTrigger>
                  <TabsTrigger value="rebalance">Rebalanceamento</TabsTrigger>
                  <TabsTrigger value="concentration">Concentração</TabsTrigger>
                </TabsList>

                <TabsContent value="swap" className="pt-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Posição de origem</Label>
                      <Select value={swapFrom} onValueChange={setSwapFrom}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma posição" />
                        </SelectTrigger>
                        <SelectContent>
                          {(positions ?? []).map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.ticker} — {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Destino</Label>
                      <Select value={swapTo} onValueChange={setSwapTo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATION_ASSETS.map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Label className="text-xs">Valor a movimentar</Label>
                      <Input
                        type="number"
                        min="0"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                        placeholder={swapIsPercent ? "% da posição" : "R$"}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={swapIsPercent ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSwapIsPercent(true)}
                      >
                        %
                      </Button>
                      <Button
                        type="button"
                        variant={!swapIsPercent ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSwapIsPercent(false)}
                      >
                        R$
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rebalance" className="pt-5 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Defina o peso-alvo de cada classe (em %). A soma será normalizada.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ASSET_CLASSES.map((cls) => (
                      <div key={cls}>
                        <div className="flex justify-between text-xs mb-1">
                          <Label>{cls}</Label>
                          <span className="text-muted-foreground">
                            {(allocation[cls] ?? 0).toFixed(0)}%
                          </span>
                        </div>
                        <Slider
                          value={[allocation[cls] ?? 0]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(v) =>
                            setAllocation((a) => ({ ...a, [cls]: v[0] }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="concentration" className="pt-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Ativo / classe alvo</Label>
                      <Select value={concAsset} onValueChange={setConcAsset}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATION_ASSETS.map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <Label>% da carteira no alvo</Label>
                        <span className="text-muted-foreground">{concPct}%</span>
                      </div>
                      <Slider
                        value={[concPct]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={(v) => setConcPct(v[0])}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Resultado */}
            {ratesLoading || posLoading ? (
              <Card className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </Card>
            ) : computed ? (
              <>
                <ComparisonCard metrics={metrics} />
                <AssumptionsPanel
                  assumptions={{
                    horizonMonths: 12,
                    ratesUsed: rates ?? [],
                    notes: computed.assumptions.notes,
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={saveMut.isPending} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saveMut.isPending ? "Salvando..." : "Salvar simulação"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/diagnosis")}
                    className="gap-2"
                  >
                    Levar esta leitura para o diagnóstico
                  </Button>
                </div>
              </>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                Configure o cenário para ver o impacto potencial.
              </Card>
            )}
          </>
        )}

        {/* Histórico */}
        {history && history.length > 0 && (
          <Card className="p-5">
            <h3 className="font-heading text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Histórico de simulações
            </h3>
            <div className="divide-y divide-border">
              {history.map((h) => {
                const r = h.results as { delta?: { yieldAnnualPct?: number } };
                const delta = r?.delta?.yieldAnnualPct ?? 0;
                return (
                  <div
                    key={h.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{h.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Modo: {h.mode} · {new Date(h.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${
                          delta >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(2)} pp a.a.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportMut.mutate(h.id)}
                        disabled={exportMut.isPending}
                        className="gap-1"
                      >
                        <FileDown className="w-3 h-3" /> PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMut.mutate(h.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppSidebar>
  );
}
