import { ReactNode } from "react";
import { Target, ShieldCheck, Upload, FileText, History, Settings, CreditCard, LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Logo } from "@/components/Logo";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Importar Carteira", href: "/portfolio/import", icon: <Upload className="w-5 h-5" /> },
  { label: "Diagnóstico", href: "/diagnosis", icon: <Target className="w-5 h-5" /> },
  { label: "Recomendações", href: "/recommendations", icon: <ShieldCheck className="w-5 h-5" />, badge: "3" },
  { label: "Relatórios", href: "/reports", icon: <FileText className="w-5 h-5" /> },
  { label: "Histórico", href: "/history", icon: <History className="w-5 h-5" /> },
];

const bottomNav: NavItem[] = [
  { label: "Assinatura", href: "/pricing", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Configurações", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export function AppSidebar({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — dark Slytherin theme */}
      <aside className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-5 h-16 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
          {collapsed ? (
            <Logo size="sm" showText={false} />
          ) : (
            <Logo size="md" variant="light" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                location.pathname === item.href
                  ? "bg-sidebar-primary/20 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-4 px-3 space-y-1 border-t border-sidebar-border">
          {bottomNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                location.pathname === item.href
                  ? "bg-sidebar-primary/20 text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">5 créditos restantes</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
