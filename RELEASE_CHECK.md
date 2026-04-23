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

## 5. Observações

- Lockfile: `package-lock.json` é a fonte da verdade para `npm ci`.
- Promoção a admin é **manual via SQL**. Não há seed por email em migrations ativas.
- Stripe roda em modo BRL único. USD/EUR estão ocultos no lançamento.
- Auth emails passam por rota `/auth/callback` — não direto em `/dashboard`.
