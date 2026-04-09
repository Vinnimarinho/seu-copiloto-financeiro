import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

/** Serpent-inspired logo mark for Lucius */
export function Logo({ size = "md", showText = true, className, variant = "dark" }: LogoProps) {
  const sizes = {
    sm: { box: "w-7 h-7", icon: "w-4 h-4", text: "text-base" },
    md: { box: "w-9 h-9", icon: "w-5 h-5", text: "text-lg" },
    lg: { box: "w-12 h-12", icon: "w-7 h-7", text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn(s.box, "rounded-lg bg-primary flex items-center justify-center relative overflow-hidden")}>
        {/* Serpent S mark */}
        <svg viewBox="0 0 24 24" fill="none" className={s.icon}>
          <path
            d="M12 3C8.5 3 6 5 6 7.5C6 10 8 11 10 11.5C12 12 14 12.5 14 14.5C14 16.5 12 18 9 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-primary-foreground"
          />
          <circle cx="9" cy="18" r="1.5" fill="currentColor" className="text-primary-foreground opacity-60" />
          <circle cx="12" cy="3" r="1" fill="currentColor" className="text-primary-foreground opacity-40" />
        </svg>
      </div>
      {showText && (
        <span className={cn(
          "font-heading font-bold tracking-tight",
          s.text,
          variant === "light" ? "text-primary-foreground" : "text-foreground"
        )}>
          Lucius
        </span>
      )}
    </div>
  );
}
