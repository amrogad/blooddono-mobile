import i18n from '@/i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export const friendlyAuthError = (raw: string): string => {
  const m = raw.toLowerCase();
  if (m.includes('invalid login')) return i18n.t('errors.invalidLogin');
  if (m.includes('email not confirmed')) return i18n.t('errors.emailNotConfirmed');
  if (m.includes('rate limit')) return i18n.t('errors.rateLimit');
  if (m.includes('network')) return i18n.t('errors.network');
  return raw || i18n.t('errors.generic');
};

export const friendlyRequestError = (raw: string): string => {
  const m = raw.toLowerCase();
  if (m.includes('permission denied') || m.includes('rls')) return i18n.t('errors.permission');
  if (m.includes('network')) return i18n.t('errors.network');
  if (m.includes('duplicate')) return i18n.t('errors.duplicate');
  return raw || i18n.t('errors.generic');
};
