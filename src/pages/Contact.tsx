import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { Mail, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(200),
  subject: z.string().trim().max(200, "Assunto muito longo").optional(),
  message: z.string().trim().min(5, "Mensagem muito curta").max(5000, "Mensagem muito longa"),
});

export default function Contact() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: t("contact.checkFields"),
        description: parsed.error.errors[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: parsed.data,
      });
      if (error) throw error;
      toast({
        title: t("contact.sent"),
        description: t("contact.sentDesc"),
      });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast({
        title: t("contact.errorTitle"),
        description: (err as Error).message ?? t("contact.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Contato — Lucius" description="Fale com a equipe Lucius. Tire dúvidas sobre planos, importação de carteira ou suporte técnico." path="/contato" />
      <LandingHeader />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {t("contact.back")}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight mb-3">
            {t("contact.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("contact.intro")}{" "}
            <a href="mailto:sac@luciusinvest.com.br" className="text-primary hover:underline">
              sac@luciusinvest.com.br
            </a>
            .
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("contact.formTitle")}</CardTitle>
            <CardDescription>{t("contact.formDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("contact.name")} *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("contact.namePlaceholder")}
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("contact.email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t("contact.emailPlaceholder")}
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t("contact.subject")}</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={t("contact.subjectPlaceholder")}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("contact.message")} *</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t("contact.messagePlaceholder")}
                  rows={6}
                  maxLength={5000}
                  required
                />
              </div>

              <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full">
                {loading ? t("contact.sending") : t("contact.send")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
