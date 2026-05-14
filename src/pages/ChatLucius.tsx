import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { usePortfolios, usePositions, useLatestAnalysis } from "@/hooks/usePortfolio";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

type Msg = { role: "user" | "assistant"; content: string };

function buildDynamicSuggestions(
  positions: any[] | undefined,
  analysis: any | undefined,
  t: TFunction
): string[] {
  const suggestions: string[] = [];

  if (positions && positions.length > 0) {
    const withPerf = positions
      .filter(p => p.avg_price > 0 && p.current_value && p.quantity > 0)
      .map(p => ({
        ticker: p.ticker,
        perf: ((Number(p.current_value) / (Number(p.avg_price) * Number(p.quantity))) - 1) * 100,
      }));

    const worst = withPerf.sort((a, b) => a.perf - b.perf)[0];
    if (worst && worst.perf < 0) {
      suggestions.push(t("chatLucius.suggestions.worst", { ticker: worst.ticker, perf: worst.perf.toFixed(0) }));
    }

    const best = withPerf.sort((a, b) => b.perf - a.perf)[0];
    if (best && best.perf > 0) {
      suggestions.push(t("chatLucius.suggestions.best", { ticker: best.ticker, perf: best.perf.toFixed(0) }));
    }

    const classMap: Record<string, number> = {};
    const total = positions.reduce((s, p) => s + (Number(p.current_value) || 0), 0);
    positions.forEach(p => {
      const cls = p.asset_class || "Outros";
      classMap[cls] = (classMap[cls] || 0) + (Number(p.current_value) || 0);
    });
    const topClass = Object.entries(classMap).sort((a, b) => b[1] - a[1])[0];
    if (topClass && total > 0) {
      const pct = Math.round((topClass[1] / total) * 100);
      if (pct > 40) {
        suggestions.push(t("chatLucius.suggestions.concentration", { pct, cls: topClass[0] }));
      }
    }
  }

  if (analysis) {
    const risk = Number(analysis.risk_score) || 0;
    if (risk < 50) suggestions.push(t("chatLucius.suggestions.lowRisk"));
    const div = Number(analysis.diversification_score) || 0;
    if (div < 60) suggestions.push(t("chatLucius.suggestions.lowDiv"));
  }

  const generic = [
    t("chatLucius.suggestions.generic1"),
    t("chatLucius.suggestions.generic2"),
    t("chatLucius.suggestions.generic3"),
  ];

  for (const g of generic) {
    if (suggestions.length >= 6) break;
    if (!suggestions.includes(g)) suggestions.push(g);
  }

  return suggestions.slice(0, 6);
}

export default function ChatLucius() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: portfolios } = usePortfolios();
  const portfolioId = portfolios?.[0]?.id;
  const { data: positions } = usePositions(portfolioId);
  const { data: analysis } = useLatestAnalysis();

  const suggestions = useMemo(
    () => buildDynamicSuggestions(positions, analysis, t),
    [positions, analysis, t]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-lucius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: t("chatLucius.errorUnknown") }));
        throw new Error(err.error || t("chatLucius.errorStatus", { status: resp.status }));
      }

      if (!resp.body) throw new Error(t("chatLucius.errorNoBody"));

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
      if (!assistantSoFar) {
        setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, session?.access_token]);

  return (
    <AppSidebar>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-theme(spacing.12))] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-foreground">{t("chatLucius.headerTitle")}</h1>
            <p className="text-xs text-muted-foreground">{t("chatLucius.headerSubtitle")}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-1">{t("chatLucius.emptyTitle")}</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("chatLucius.emptyDesc")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs bg-card border border-border rounded-lg px-3 py-2.5 text-foreground hover:bg-secondary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h3]:mt-3 [&>h3]:mb-1 [&>h3]:text-sm [&>h3]:font-heading">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-xl px-3.5 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-border mt-2">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2 items-end"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={t("chatLucius.placeholder")}
              className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[42px] max-h-[120px]"
              rows={1}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[42px] w-[42px]">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t("chatLucius.footer")}
          </p>
        </div>
      </div>
    </AppSidebar>
  );
}
