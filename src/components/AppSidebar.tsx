import { ReactNode } from "react";
import { Target, ShieldCheck, Upload, FileText, History, Settings, CreditCard, LayoutDashboard, ChevronLeft, ChevronRight, LogOut, Shield, MessageCircle, HelpCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCredits } from "@/hooks/usePortfolio";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";

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
  { label: "Oportunidades", href: "/recommendations", icon: <ShieldCheck className="w-5 h-5" /> },
  { label: "Falar com Lucius", href: "/chat", icon: <MessageCircle className="w-5 h-5" /> },
  { label: "Relatórios", href: "/reports", icon: <FileText className="w-5 h-5" /> },
  { label: "Histórico", href: "/history", icon: <History className="w-5 h-5" /> },
];

const bottomNav: NavItem[] = [
  { label: "Assinatura", href: "/pricing", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Configurações", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export function AppSidebar({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: credits } = useUserCredits();
  const { data: isAdmin } = useIsAdmin();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}>
        <div className={cn("flex items-center gap-3 px-5 h-16 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
          {collapsed ? <Logo size="sm" showText={false} /> : <Logo size="md" variant="light" />}
        </div>

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

        <div className="py-4 px-3 space-y-1 border-t border-sidebar-border">
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                location.pathname === "/admin"
                  ? "bg-accent/20 text-accent"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Shield className="w-5 h-5" />
              {!collapsed && <span>Admin</span>}
            </Link>
          )}
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

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden"><Logo size="sm" /></div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span>{credits ?? "–"} créditos</span>
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" align="end">
                <h4 className="font-heading font-semibold text-foreground mb-2">O que são créditos?</h4>
                <p className="text-muted-foreground text-xs mb-3">
                  Créditos são usados para gerar análises e diagnósticos da sua carteira com IA.
                </p>
                <div className="space-y-1.5 text-xs mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diagnóstico completo</span>
                    <span className="font-medium text-foreground">1 crédito</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relatório PDF</span>
                    <span className="font-medium text-foreground">1 crédito</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chat com Lucius</span>
                    <span className="font-medium text-foreground">Gratuito</span>
                  </div>
                </div>
                <Link to="/pricing" className="text-xs text-primary hover:underline font-medium">
                  Obter mais créditos →
                </Link>
              </PopoverContent>
            </Popover>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <button onClick={async () => { await signOut(); navigate("/login"); }} className="text-muted-foreground hover:text-foreground transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 p-6">{children}</div>
        <footer className="border-t border-border px-6 py-3">
          <RegulatoryDisclaimer compact />
        </footer>
      </main>
    </div>
  );
}
