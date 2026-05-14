import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export type Currency = "BRL" | "USD";

interface CurrencyContextValue {
  currency: Currency;
  country: string;
  setCurrency: (c: Currency) => void;
  formatPrice: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = "lucius_currency";
const COUNTRY_KEY = "lucius_country";
const LANG_AUTO_KEY = "lucius_lang_auto_applied";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === "undefined") return "BRL";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "USD" || stored === "BRL" ? stored : "BRL";
  });
  const [country, setCountry] = useState<string>(() => {
    if (typeof window === "undefined") return "BR";
    return window.localStorage.getItem(COUNTRY_KEY) || "BR";
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const userPicked = window.localStorage.getItem(STORAGE_KEY);
    const langAutoApplied = window.localStorage.getItem(LANG_AUTO_KEY);
    const langStored = window.localStorage.getItem("lucius_lang");

    (async () => {
      try {
        const { data } = await supabase.functions.invoke("geo-detect");
        if (cancelled || !data) return;
        if (data.country) {
          setCountry(data.country);
          window.localStorage.setItem(COUNTRY_KEY, data.country);
        }
        // Só auto-aplica moeda se usuário ainda não escolheu manualmente
        if (!userPicked && data.currency) {
          setCurrencyState(data.currency);
        }
        // Só auto-aplica idioma uma vez e se usuário não definiu manualmente
        if (!langStored && !langAutoApplied && data.language) {
          await i18n.changeLanguage(data.language);
          window.localStorage.setItem(LANG_AUTO_KEY, "1");
        }
      } catch {
        // silencioso — defaults BRL/pt-BR continuam
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    window.localStorage.setItem(STORAGE_KEY, c);
  };

  const formatPrice = (amount: number) => {
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, country, setCurrency, formatPrice, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
