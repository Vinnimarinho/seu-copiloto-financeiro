// i18n com PT-BR e EN. Idioma inicial é detectado por:
// 1) localStorage 'lucius_lang'
// 2) navigator.language (en* → en, demais → pt-BR)
// O CurrencyProvider chama edge function geo-detect e pode atualizar o idioma se ainda estiver no default.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGS = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
] as const;

function detectInitialLang(): string {
  if (typeof window === "undefined") return "pt-BR";
  const stored = window.localStorage.getItem("lucius_lang");
  if (stored === "pt-BR" || stored === "en") return stored;
  const nav = (navigator.language || "pt-BR").toLowerCase();
  if (nav.startsWith("en")) return "en";
  return "pt-BR";
}

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en: { translation: en },
  },
  lng: detectInitialLang(),
  fallbackLng: "pt-BR",
  supportedLngs: ["pt-BR", "en"],
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
