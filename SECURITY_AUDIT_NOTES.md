# Security Audit Notes — Lucius

Data: 2026-04-27

## Resumo

Ajustes focados em **reduzir spam de notificações** do GitHub Actions sem perder
proteção real, e em deixar a política de `npm audit` pragmática para SaaS em
produção.

## Estado das dependências

- `code--dependency_scan` (npm audit interno): **0 vulnerabilidades high/critical**
- `npm ci` em ambiente limpo: ✅ funciona
- `npm run lint`: ✅ 0 errors
- `npm run build`: ✅ build de produção OK (~17s)
- `npx vitest run`: ✅ 20/20 testes verdes

Nenhuma dependência de produção com vulnerabilidade high ou critical foi
identificada — não houve necessidade de upgrade neste ciclo. Lockfile e
`package.json` permanecem sincronizados.

## Vulnerabilidades aceitas temporariamente

- **devDependencies** (vite, esbuild, vitest, etc.): vulnerabilidades eventuais
  que apareçam neste grupo **não vão para o bundle de produção** e portanto não
  têm impacto em runtime do usuário final. O workflow agora reporta esses
  achados em modo informativo (não bloqueia merge). Tratamos via upgrades
  programados, não emergenciais.

## Workflow `.github/workflows/audit.yml` — política nova

Triggers:
- `pull_request` em `main` (proteção real antes de merge)
- `push` apenas em `main` (sem rodar em toda branch de feature)
- `workflow_dispatch` (execução manual sob demanda)
- `schedule` semanal (segunda 09:00 UTC)
- `concurrency` cancela runs antigas da mesma ref

Jobs:
1. **`npm-audit-prod`** — `npm audit --omit=dev --audit-level=critical`
   - **Falha apenas em CRITICAL** em deps de produção
   - Bloqueia merge somente quando há risco real ao usuário final
2. **`npm-audit-dev-informative`** — `npm audit --audit-level=high`
   - `continue-on-error: true` — informativo, não bloqueia
   - Visibilidade sobre o estado de devDeps sem travar releases

Antes a regra era `--audit-level=high` em deps de produção, gerando alertas
ruidosos para vulnerabilidades sem impacto direto. A nova regra mantém o sinal
forte (CRITICAL bloqueia) e reduz falso-positivo operacional.

## Workflow `.github/workflows/ci.yml`

- Adicionado `workflow_dispatch` para re-runs manuais
- Adicionado `concurrency` (cancela run anterior na mesma ref) — corta
  notificações duplicadas quando há vários commits em sequência num PR
- Actions já estavam em v4 (`actions/checkout@v4`, `actions/setup-node@v4`):
  nenhuma obsoleta encontrada

## Arquivos alterados

- `.github/workflows/audit.yml` — política reescrita (2 jobs, triggers e concurrency)
- `.github/workflows/ci.yml` — adicionado `workflow_dispatch` e `concurrency`
- `SECURITY_AUDIT_NOTES.md` — este documento

## Pendências residuais

- Nenhuma vulnerabilidade crítica em aberto
- Recomenda-se revisar o resultado do job informativo `npm-audit-dev-informative`
  trimestralmente para planejar upgrades de devDependencies
