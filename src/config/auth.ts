// These are deliberately public client values. Administrative configuration is never imported.
const origin = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const publicAuthConfig = origin && publishableKey ? { origin, publishableKey } : null;
export const recoveryEnabled = process.env.EXPO_PUBLIC_AUTH_RECOVERY_ENABLED === 'true';
