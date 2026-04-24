# Stripe LIVE — Go Checklist (Lucius)

Checklist objetivo para virar a chave de teste para produção real, BRL only.

---

## 1. Onde inserir as chaves LIVE

Todas as chaves vão em **Lovable Cloud → Backend → Secrets** (nunca no código, nunca no `.env` do front). Os secrets ficam disponíveis para todas as Edge Functions.

| Secret name                  | De onde vem                                                                 | Obrigatório |
|------------------------------|------------------------------------------------------------------------------|-------------|
| `STRIPE_SECRET_KEY`          | Stripe Dashboard (LIVE) → Developers → API keys → **Secret key live** (`sk_live_...`) | ✅ |
| `STRIPE_WEBHOOK_SECRET`      | Stripe Dashboard (LIVE) → Developers → Webhooks → endpoint → **Signing secret** (`whsec_...`) | ✅ |
| `STRIPE_PRODUCT_ESSENCIAL`   | Stripe Dashboard (LIVE) → Products → Essencial → Product ID (`prod_...`)     | ✅ |
| `STRIPE_PRODUCT_PRO`         | Stripe Dashboard (LIVE) → Products → Pro → Product ID (`prod_...`)           | ✅ |

> **Importante:** os product IDs de teste e LIVE são DIFERENTES. Recriar Essencial e Pro no modo Live e copiar os novos `prod_...` para os secrets acima.

---

## 2. Onde inserir os price IDs LIVE

Os price IDs são consumidos pelo **frontend** ao iniciar o checkout (`startCheckout`). Vão em variáveis Vite:

| Env var (frontend)                  | De onde vem                                                                  | Obrigatório |
|-------------------------------------|------------------------------------------------------------------------------|-------------|
| `VITE_STRIPE_PRICE_ESSENCIAL_BRL`   | Stripe LIVE → Essencial → Price BRL (`price_...`)                            | ✅ |
| `VITE_STRIPE_PRICE_PRO_BRL`         | Stripe LIVE → Pro → Price BRL (`price_...`)                                  | ✅ |
| `VITE_STRIPE_PRODUCT_ESSENCIAL`     | Mesmo `prod_...` da tabela acima (espelho no front)                          | ✅ |
| `VITE_STRIPE_PRODUCT_PRO`           | Mesmo `prod_...` da tabela acima (espelho no front)                          | ✅ |

Esses `VITE_*` são consumidos em `src/hooks/useSubscription.ts` (objeto `PLANS`) e expostos como bundle público — **só price IDs e product IDs**, nada secreto.

> Sem esses envs, o app cai nos defaults legacy (test/historic). Em LIVE eles **precisam** estar definidos.

---

## 3. Configurar o webhook LIVE no Stripe

1. Stripe Dashboard (LIVE) → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL:
   ```
   https://oindqzfotybzlmcwcfcp.supabase.co/functions/v1/stripe-webhook
   ```
3. Eventos a assinar (todos obrigatórios):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copiar o **Signing secret** gerado (`whsec_...`) e gravar em `STRIPE_WEBHOOK_SECRET`.

A Edge Function já está com `verify_jwt = false` (validação real é via HMAC do Stripe).

---

## 4. Customer Portal LIVE

1. Stripe Dashboard (LIVE) → **Settings → Billing → Customer portal** → **Activate**.
2. Marcar:
   - Permitir cancelar assinatura
   - Permitir trocar payment method
   - Política de cancelamento: **End of billing period** (recomendado)
3. Salvar. O portal já é consumido por `supabase/functions/customer-portal/index.ts`.

---

## 5. Como testar um pagamento real pequeno

Não há mais cartões de teste em LIVE. Use um cartão real próprio com valor mínimo:

1. (Opcional) Crie um **Promotion code** no Stripe LIVE com 99% off para reduzir custo do teste. Ele já é aceito pelo checkout (`allow_promotion_codes: true`).
2. Faça login no app com uma conta sua.
3. `/pricing` → **Assinar Essencial**.
4. Conclua o pagamento real no Checkout Stripe.
5. Stripe redireciona para `/payment/success`.
6. Após validar, **cancele a assinatura no portal** para evitar próxima cobrança.

---

## 6. Como validar se o webhook chegou

- Stripe Dashboard (LIVE) → **Developers → Webhooks → endpoint → Recent events**.
- Cada evento (`checkout.session.completed`, `customer.subscription.created`, `invoice.paid`) deve mostrar **HTTP 200**.
- Em caso de 4xx/5xx, abrir os logs da Edge Function `stripe-webhook` no Lovable Cloud e investigar.

---

## 7. Como validar se `billing_subscriptions` foi atualizado

```sql
SELECT user_id, plan_code, status, stripe_customer_id, stripe_subscription_id,
       price_id, currency, current_period_end, cancel_at_period_end, updated_at
FROM public.billing_subscriptions
ORDER BY updated_at DESC
LIMIT 5;
```

Resultado esperado após pagamento:
- `status = 'active'`
- `plan_code = 'essencial'` ou `'pro'`
- `stripe_customer_id` e `stripe_subscription_id` preenchidos
- `currency = 'brl'`
- `current_period_end` no futuro

E também:

```sql
SELECT stripe_event_id, type, status, processed_at
FROM public.stripe_events_processed
ORDER BY processed_at DESC LIMIT 10;
```

Os eventos processados devem aparecer com `status = 'ok'`.

---

## 8. Como validar se o plano premium foi liberado

1. No app, ir em `/pricing`. O badge **"Seu plano"** deve aparecer no card correto (Essencial/Pro).
2. Acessar uma feature paga (ex.: relatório PDF, oportunidades). Não deve aparecer paywall.
3. Conferir resposta em DevTools → Network → `verify-plan-access`:
   ```json
   { "allowed": true, "plan": "essencial", "product_id": "prod_..." }
   ```
4. Conferir resposta de `check-subscription`:
   ```json
   { "subscribed": true, "product_id": "prod_...", "subscription_end": "..." , "source": "local" }
   ```
   `source: "local"` confirma que o webhook propagou e a tabela local é a fonte de verdade.

---

## 9. Como validar o portal do cliente

1. No `/pricing`, no card do plano ativo, clicar em **Gerenciar assinatura**.
2. Deve abrir o Customer Portal Stripe (mesma aba).
3. Cancelar a assinatura → escolher "ao final do ciclo".
4. Voltar ao app. Em poucos segundos, conferir:
   ```sql
   SELECT cancel_at_period_end, status FROM public.billing_subscriptions
   WHERE user_id = '<seu-user-id>';
   ```
   `cancel_at_period_end = true`, `status` ainda `active` até o fim do período. O webhook `customer.subscription.updated` cuida disso.

---

## 10. O que NÃO está no escopo deste go-live

- USD/EUR (fica oculto até nova rodada de homologação multi-currency).
- One-time payments (apenas assinatura recorrente).
- Tax automation (Stripe Tax desativado — `automatic_tax: false`).
- Trials (não configurados; podem ser ativados depois sem mudança de código, basta criar `trial_period_days` no price).

---

## Fluxo de dados (resumo)

```
Checkout (frontend)
   └─> create-checkout (Edge) ──> Stripe Checkout Session
                                       │
                                       ▼ (pagamento confirmado)
                                  stripe-webhook (Edge, HMAC verified)
                                       │
                                       ▼
                          public.billing_subscriptions  ← FONTE DE VERDADE
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
       check-subscription     verify-plan-access       customer-portal
       (status do plano)      (gating de features)     (gestão da assinatura)
```

Sem lookup por email em nenhum ponto. `user_id ↔ stripe_customer_id ↔ stripe_subscription_id` são o vínculo.
