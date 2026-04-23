# Stripe Release Check — Lucius

Checklist de homologação ponta a ponta do fluxo de billing antes do GO-LIVE.

## Pré-requisitos

- [ ] Stripe Dashboard verificado e em **modo Live**
- [ ] Produtos `essencial` (`prod_UKvbpwN51mHV2B`) e `pro` (`prod_UL9kxDPtv9xpCp`) recriados em Live
- [ ] `STRIPE_SECRET_KEY` Live configurado nos Secrets do projeto
- [ ] `STRIPE_WEBHOOK_SECRET` Live configurado (novo endpoint Live)
- [ ] Endpoint webhook apontando para `https://oindqzfotybzlmcwcfcp.supabase.co/functions/v1/stripe-webhook`
- [ ] Eventos assinados: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`
- [ ] Customer Portal ativado em https://dashboard.stripe.com/settings/billing/portal

## Fluxo a homologar

| # | Passo                                              | Validação                                                    |
|---|----------------------------------------------------|--------------------------------------------------------------|
| 1 | Usuário clica "Assinar" em `/pricing`              | Redirecionado para Checkout Stripe em BRL                    |
| 2 | Pagamento confirmado                               | Recebe `checkout.session.completed` no webhook               |
| 3 | Webhook processado                                 | `billing_subscriptions` atualizado com `status=active`       |
| 4 | Usuário volta em `/payment/success`                | UI mostra plano correto (essencial/pro)                      |
| 5 | Usuário acessa "Gerenciar assinatura"              | Customer Portal abre sem fallback por email                  |
| 6 | Usuário cancela no portal                          | `customer.subscription.updated` chega → `cancel_at_period_end=true` |
| 7 | Falha de pagamento (cartão de teste)               | `invoice.payment_failed` → `status=past_due`                 |

## Moeda

- **Lançamento: BRL único.** USD/EUR ficam ocultos no front até nova rodada de homologação.

## Fonte da verdade

- `public.billing_subscriptions` é a **fonte primária** consultada pelo app.
- Edge functions (`check-subscription`, `verify-plan-access`, `customer-portal`) leem **apenas** dessa tabela.
- Não há mais fallback por email no Stripe — `stripe_customer_id` precisa estar persistido após o primeiro checkout (gravado pelo webhook).

## Pendências para abrir USD/EUR no futuro

- Reativar seletor de moeda em `src/pages/Pricing.tsx`
- Adicionar prices Live em USD/EUR no Stripe Dashboard
- Mapear novos `price_id` em `create-checkout`
- Repetir esta homologação ponta a ponta para cada moeda
