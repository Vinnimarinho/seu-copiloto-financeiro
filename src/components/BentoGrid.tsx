import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  span?: "1" | "2" | "3" | "full";
  badge?: string;
  badgeVariant?: "default" | "warning" | "success" | "destructive";
}

const badgeStyles = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
};

export function BentoCard({ title, subtitle, children, className, span = "1", badge, badgeVariant = "default" }: BentoCardProps) {
  const spanClasses = {
    "1": "",
    "2": "md:col-span-2",
    "3": "md:col-span-3",
    "full": "md:col-span-full",
  };

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow duration-300",
      spanClasses[span],
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-heading font-semibold text-sm text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badgeStyles[badgeVariant])}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function BentoGrid({ children, className, columns = 3 }: BentoGridProps) {
  const colClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div className={cn("grid grid-cols-1 gap-3", colClasses[columns], className)}>
      {children}
    </div>
  );
}
