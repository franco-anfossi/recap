export function friendlyAuthError(message?: string) {
  if (!message) return 'Something went wrong. Please try again.';
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match.';
  if (m.includes('email not confirmed')) return 'Confirm your email first, then sign in.';
  if (m.includes('already registered')) return 'An account with that email already exists.';
  if (m.includes('network')) return 'No connection. Check your internet and try again.';
  return message;
}
