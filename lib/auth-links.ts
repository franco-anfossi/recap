import { supabase } from './supabase';

/** Parses query and hash params from an incoming deep link. */
export function parseLinkParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const collect = (part: string | undefined) => {
    if (!part) return;
    part.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    });
  };
  const [beforeHash, hash] = url.split('#');
  const query = beforeHash.split('?')[1];
  collect(query);
  collect(hash);
  return params;
}

/**
 * Turns a Supabase auth link (password recovery, magic link, email confirmation) into a session.
 * Returns the auth event type when a session was established, otherwise null.
 */
export async function handleAuthLink(url: string): Promise<'recovery' | 'signup' | 'magiclink' | null> {
  const params = parseLinkParams(url);

  if (params.error_description) {
    throw new Error(params.error_description);
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return (params.type as 'recovery' | 'signup' | 'magiclink') || 'magiclink';
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return (params.type as 'recovery' | 'signup' | 'magiclink') || 'magiclink';
  }

  return null;
}
