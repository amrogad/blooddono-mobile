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
  if (!form.recipientName.trim()) return 'Recipient name is required.';
  if (!form.governorate) return 'Please pick a governorate.';
  if (!form.city) return 'Please pick a city.';
  if (!form.hospitalName.trim()) return 'Hospital name is required.';
  if (!form.fullAddress.trim()) return 'Full address is required.';
  if (!form.bloodGroup) return 'Please pick a blood group.';
  if (!form.message.trim()) return 'Please add a short message.';
  return null;
}
