import { validateNewRequest, RequestForm } from '@/utils/validation';

const valid: RequestForm = {
  recipientName: 'Mona Salah',
  governorate: 'Cairo',
  city: 'Nasr City',
  hospitalName: 'Kasr Al Ainy',
  fullAddress: '10 El Saray St',
  bloodGroup: 'O+',
  message: 'Two bags needed by Friday',
};

const withField = (field: keyof RequestForm, value: string): RequestForm => {
  const form = { ...valid };
  form[field] = value;
  return form;
};

describe('validateNewRequest', () => {
  test('returns null when every field is filled', () => {
    expect(validateNewRequest(valid)).toBeNull();
  });

  test.each<[keyof RequestForm, string]>([
    ['recipientName', 'Recipient name is required.'],
    ['hospitalName', 'Hospital name is required.'],
    ['fullAddress', 'Full address is required.'],
    ['message', 'Please add a short message.'],
  ])('rejects a blank %s (whitespace only)', (field, expected) => {
    expect(validateNewRequest(withField(field, '   '))).toBe(expected);
  });

  test.each<[keyof RequestForm, string]>([
    ['governorate', 'Please pick a governorate.'],
    ['city', 'Please pick a city.'],
    ['bloodGroup', 'Please pick a blood group.'],
  ])('rejects an unselected %s', (field, expected) => {
    expect(validateNewRequest(withField(field, ''))).toBe(expected);
  });

  test('reports the first missing field in form order', () => {
    const form = { ...valid, recipientName: '', governorate: '' };
    expect(validateNewRequest(form)).toBe('Recipient name is required.');
  });
});
