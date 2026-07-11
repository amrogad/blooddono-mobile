import i18n from '@/i18n';

export type RequestForm = {
  recipientName: string;
  governorate: string;
  city: string;
  hospitalName: string;
  fullAddress: string;
  bloodGroup: string;
  message: string;
};

export function validateNewRequest(form: RequestForm): string | null {
  if (!form.recipientName.trim()) return i18n.t('validation.recipientName');
  if (!form.governorate) return i18n.t('validation.governorate');
  if (!form.city) return i18n.t('validation.city');
  if (!form.hospitalName.trim()) return i18n.t('validation.hospitalName');
  if (!form.fullAddress.trim()) return i18n.t('validation.fullAddress');
  if (!form.bloodGroup) return i18n.t('validation.bloodGroup');
  if (!form.message.trim()) return i18n.t('validation.message');
  return null;
}
