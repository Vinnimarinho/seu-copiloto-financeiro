import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingDown, Zap, Shield, CircleDollarSign, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

export interface AlertItem {
  id: string;
  type: "concentration" | "risk" | "cost" | "idle" | "redundant" | "misalignment";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

const typeConfig: Record<string, { icon: ReactNode; color: string }> = {
  concentration: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-warning" },
  risk: { icon: <Shield className="w-4 h-4" />, color: "text-destructive" },
  cost: { icon: <CircleDollarSign className="w-4 h-4" />, color: "text-warning" },
  idle: { icon: <TrendingDown className="w-4 h-4" />, color: "text-muted-foreground" },
  redundant: { icon: <Zap className="w-4 h-4" />, color: "text-info" },
  misalignment: { icon: <AlertCircle className="w-4 h-4" />, color: "text-destructive" },
};

const severityDot: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

export function AlertCard({ alert }: { alert: AlertItem }) {
  const config = typeConfig[alert.type];

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className={cn("mt-0.5", config.color)}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{alert.title}</span>
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", severityDot[alert.severity])} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
      </div>
    </div>
  );
}
