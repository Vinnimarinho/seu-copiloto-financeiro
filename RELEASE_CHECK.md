# Release Check — Lucius

Checklist objetivo de homologação técnica para GO-LIVE.
Reproduzível em qualquer ambiente limpo (Node 20+).

## 1. Setup limpo

```bash
# Clonar repo limpo, sem node_modules nem .env
git clone <repo>
cd <repo>
cp .env.example .env   # preencher VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
```

## 2. Comandos obrigatórios

| Comando             | Resultado esperado                          |
|---------------------|----------------------------------------------|
| `npm ci`            | instala lockfile sem erros                   |
| `npm run lint`      | 0 errors (warnings tolerados)                |
| `npm run build`     | build de produção concluído sem erros        |
| `npm test`          | suíte de testes 100% verde                   |

> Se `npm test` não estiver mapeado em `package.json`, usar `npx vitest run`.

## 3. Verificações manuais pós-build

- [ ] `dist/` gerado com `index.html` e bundles `assets/*`
- [ ] Nenhum `.env` versionado (apenas `.env.example`)
- [ ] `.gitignore` cobre `.env*` exceto `.env.example`
- [ ] Nenhuma migration ativa contém email hardcoded como admin

## 4. Auditoria de segurança

```bash
npm audit --omit=dev --audit-level=high
```
Resultado esperado: 0 vulnerabilidades **high** ou **critical** em deps de produção.

## 5. CI automatizado

- Workflow `.github/workflows/ci.yml` roda em todo push/PR para `main`:
  `npm ci` → `npm run lint` → `npm run build` → `npx vitest run`.
- Workflow `.github/workflows/audit.yml` roda `npm audit --omit=dev --audit-level=high`.

## 6. Última verificação local (2026-04-24)

- ✅ `npm run lint` — 0 errors
- ✅ `npm run build` — bundles emitidos em `dist/assets/*` (build em ~15s)
- ✅ `npx vitest run` — **20/20 testes verdes** (4 arquivos)

## 7. Observações

- Lockfile: `package-lock.json` é a fonte da verdade para `npm ci`.
- Promoção a admin é **manual via SQL** (`docs/ADMIN_PROMOTION.md`).
  O seed por email da migration histórica `20260413115641` foi neutralizado em runtime
  por `20260423142020`, `20260423151041` e `20260423235850` (revogação idempotente).
  Migrations já aplicadas em produção são imutáveis — a estratégia correta é revogar
  via nova migration, não reescrever o histórico.
- Stripe roda em modo BRL único. USD/EUR estão ocultos no lançamento.
- Auth emails passam por rota `/auth/callback` — não direto em `/dashboard`.

## 8. Pendência manual fora do controle do código

- `.gitignore` é gerenciado pelo Lovable e não pode ser editado via patch.
  Em fork/clone do repo, adicionar manualmente:
  ```
  .env
  .env.*
  !.env.example
  ```
