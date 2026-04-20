import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SUPPORTED_LANGS } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const current =
    SUPPORTED_LANGS.find((l) => i18n.language?.startsWith(l.code.split("-")[0])) ??
    SUPPORTED_LANGS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("common.language")}
          title={t("common.language")}
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline text-xs uppercase">{current.code.split("-")[0]}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        {SUPPORTED_LANGS.map((lang) => {
          const active = current.code === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-md transition-colors text-left",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
