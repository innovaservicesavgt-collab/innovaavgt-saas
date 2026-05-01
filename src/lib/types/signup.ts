// Tipos y constantes para signup publico

export type SignupVertical = 'dental' | 'legal';

export type PlanCard = {
  id: string;
  code: string;
  vertical: SignupVertical;
  name: string;
  monthly_price: number;
  trial_days: number;
  description: string | null;
  features: Record<string, boolean | string | number | null>;
  max_users: number | null;
  max_branches: number | null;
  storage_mb: number | null;
};

// Dominios de email temporal/desechable bloqueados
export const BLOCKED_EMAIL_DOMAINS = [
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.net',
  'sharklasers.com', 'yopmail.com', 'throwaway.email', 'maildrop.cc',
  'fakeinbox.com', 'trashmail.com', 'getnada.com', 'tempr.email',
  'discard.email', 'mintemail.com', 'spamgourmet.com', 'mohmal.com',
  'tempmailaddress.com', 'tempmailo.com', 'temp-mail.io', 'mytemp.email',
  'mailcatch.com', 'spambox.us', 'dropmail.me',
];

// Validar que el email no sea de dominio temporal
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return true;
  return BLOCKED_EMAIL_DOMAINS.includes(domain);
}

// Validar formato de email estricto
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

// Validar password
export function isValidPassword(pwd: string): { ok: boolean; error?: string } {
  if (pwd.length < 8) return { ok: false, error: 'La contrasena debe tener al menos 8 caracteres' };
  if (!/[a-zA-Z]/.test(pwd)) return { ok: false, error: 'La contrasena debe tener al menos una letra' };
  if (!/[0-9]/.test(pwd)) return { ok: false, error: 'La contrasena debe tener al menos un numero' };
  return { ok: true };
}
