/** Validate before sending a one-time owner activation code. Never stores inputs. */
export type SetupError = 'email' | 'code' | 'password' | 'confirmation';
export function validateOwnerSetup(email: string, code: string, password: string, confirmation: string): SetupError | null {
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'email';
  if (!/^[0-9]{6}$/.test(code)) return 'code';
  if (password.length < 12) return 'password';
  if (password !== confirmation) return 'confirmation';
  return null;
}
