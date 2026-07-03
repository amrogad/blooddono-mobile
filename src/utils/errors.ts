const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export const friendlyAuthError = (raw: string): string => {
  const m = raw.toLowerCase();
  if (m.includes('invalid login')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first.';
  if (m.includes('rate limit')) return 'Too many attempts, please wait a moment.';
  if (m.includes('network')) return 'Network problem, check your connection.';
  return raw || 'Something went wrong. Please try again.';
};

export const friendlyRequestError = (raw: string): string => {
  const m = raw.toLowerCase();
  if (m.includes('permission denied') || m.includes('rls'))
    return "You don't have permission to do this.";
  if (m.includes('network')) return 'Network problem, check your connection.';
  if (m.includes('duplicate')) return 'That request already exists.';
  return raw || "Something went wrong. Please try again.";
};
