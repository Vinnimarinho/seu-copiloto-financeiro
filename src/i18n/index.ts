// i18n inicializado apenas em PT-BR para o lançamento oficial.
// Os JSONs de en/es são mantidos para evolução futura e cobertos em testes
// (paridade de chaves), mas não são oferecidos ao usuário enquanto a tradução
// real das telas principais não estiver completa.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";

export const SUPPORTED_LANGS = [
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
] as const;

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
  },
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  supportedLngs: ["pt-BR"],
  interpolation: { escapeValue: false },
});

export default i18n;
