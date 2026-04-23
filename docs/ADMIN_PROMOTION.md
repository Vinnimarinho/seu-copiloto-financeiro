# Promoção manual a admin — Lucius

Não há mais seed automático por email. Para promover um usuário a admin:

## Passo 1 — descobrir o `user_id`

```sql
SELECT id, email FROM auth.users WHERE email = 'pessoa@exemplo.com';
```

## Passo 2 — promover

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<uuid_copiado_acima>', 'admin')
ON CONFLICT DO NOTHING;
```

## Passo 3 — revogar (se necessário)

```sql
DELETE FROM public.user_roles
WHERE user_id = '<uuid>' AND role = 'admin';
```

## Auditoria

Toda mudança em `user_roles` deve ser registrada manualmente em ata operacional.
A tabela `audit_logs` recebe entradas das funções `delete_user_account` e `export_user_data`,
mas mudanças de role via SQL direto **não** geram log automático — registre na ata.
