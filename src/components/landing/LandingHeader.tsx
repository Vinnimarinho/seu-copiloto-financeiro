import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "glass-dark border-b border-emerald-subtle"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="light" />
        <nav className="hidden md:flex items-center gap-8 text-sm text-sidebar-foreground/70">
          <a href="#why" className="hover:text-sidebar-foreground transition-colors">Por que</a>
          <a href="#how" className="hover:text-sidebar-foreground transition-colors">Como funciona</a>
          <a href="#pricing" className="hover:text-sidebar-foreground transition-colors">Planos</a>
          <a href="#faq" className="hover:text-sidebar-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              Entrar
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="hero" size="sm" className="shadow-glow-emerald">
              Começar grátis
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
