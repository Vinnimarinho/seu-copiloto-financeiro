// Utilitários de CPF — validação de dígito verificador e formatação.
// O hash é gerado no servidor (edge function) para evitar drift entre cliente e BD.

export function onlyDigits(cpf: string): string {
  return (cpf ?? "").replace(/\D/g, "");
}

export function formatCpf(cpf: string): string {
  const d = onlyDigits(cpf).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(d[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(d[10], 10)) return false;

  return true;
}
