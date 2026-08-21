import {
  CAN_RECEIVE_FROM,
  TOOLS,
  compatibilityReference,
  governorateForCity,
  resolveDonorArgs,
  summarizeDonors,
} from '../tools';

describe('CAN_RECEIVE_FROM', () => {
  it('matches the ABO/Rh rules the rest of the app enforces', () => {
    expect(CAN_RECEIVE_FROM).toEqual({
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    });
  });

  it('makes O- donate to everyone and AB+ receive from everyone', () => {
    const universalDonor = Object.values(CAN_RECEIVE_FROM).every((d) => d.includes('O-'));
    expect(universalDonor).toBe(true);
    expect(CAN_RECEIVE_FROM['AB+']).toHaveLength(8);
  });

  it('keeps Rh-negative patients away from Rh-positive donors', () => {
    for (const [recipient, donors] of Object.entries(CAN_RECEIVE_FROM)) {
      if (recipient.endsWith('-')) {
        expect(donors.every((d) => d.endsWith('-'))).toBe(true);
      }
    }
  });

  it('is rendered into the prompt with every group named', () => {
    const reference = compatibilityReference();
    expect(reference).toContain('a A+ patient can receive from O-, O+, A-, A+');
    expect(reference).toContain('a O- patient can receive from O-');
  });
});

describe('find_compatible_donors tool schema', () => {
  const tool = TOOLS[0].function;

  it('is exposed under the name the edge function dispatches on', () => {
    expect(tool.name).toBe('find_compatible_donors');
  });

  it('constrains bloodGroup to the eight real groups', () => {
    expect(tool.parameters.properties.bloodGroup.enum).toEqual([
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
    ]);
  });

  it('requires no arguments, so the model can lean on the profile', () => {
    expect(tool.parameters.required).toEqual([]);
  });
});

describe('resolveDonorArgs', () => {
  const profile = { blood_group: 'A+', governorate: 'Cairo', city: 'Nasr City' };

  it('falls back to the profile when the model supplies nothing', () => {
    expect(resolveDonorArgs({}, profile)).toEqual({
      ok: true,
      bloodGroup: 'A+',
      governorate: 'Cairo',
      city: 'Nasr City',
    });
  });

  it('lets the model override the profile when the user asks about elsewhere', () => {
    expect(resolveDonorArgs({ bloodGroup: 'O-', city: 'Giza' }, profile)).toEqual({
      ok: true,
      bloodGroup: 'O-',
      governorate: 'Cairo',
      city: 'Giza',
    });
  });

  it('reports what is missing instead of querying with blanks', () => {
    const result = resolveDonorArgs({}, { blood_group: 'A+', governorate: null, city: null });
    expect(result).toEqual({ ok: false, missing: ['governorate', 'city'] });
  });

  it('treats whitespace-only model output as absent', () => {
    const result = resolveDonorArgs({ city: '   ' }, profile);
    expect(result).toEqual({ ok: true, bloodGroup: 'A+', governorate: 'Cairo', city: 'Nasr City' });
  });

  it('derives the governorate from the city when only the city is known', () => {
    const result = resolveDonorArgs({ bloodGroup: 'A+', city: 'Nasr City' }, null);
    expect(result).toEqual({ ok: true, bloodGroup: 'A+', governorate: 'Cairo', city: 'Nasr City' });
  });

  it('matches the city case-insensitively', () => {
    expect(governorateForCity('  nasr city ')).toBe('Cairo');
    expect(governorateForCity('6th of October')).toBe('Giza');
  });

  it('still reports the governorate missing for a city it does not know', () => {
    const result = resolveDonorArgs({ bloodGroup: 'A+', city: 'Atlantis' }, null);
    expect(result).toEqual({ ok: false, missing: ['governorate'] });
  });

  it('lets an explicit governorate win over the one derived from the city', () => {
    const result = resolveDonorArgs(
      { bloodGroup: 'O-', city: 'Nasr City', governorate: 'Giza' },
      null,
    );
    expect(result).toMatchObject({ ok: true, governorate: 'Giza' });
  });

  it('handles a null profile without throwing', () => {
    expect(resolveDonorArgs({}, null)).toEqual({
      ok: false,
      missing: ['bloodGroup', 'governorate', 'city'],
    });
  });
});

describe('summarizeDonors', () => {
  const where = { bloodGroup: 'A+', governorate: 'Cairo', city: 'Nasr City' };

  it('counts donors by blood group', () => {
    const rows = [
      { blood_group: 'O-' },
      { blood_group: 'O+' },
      { blood_group: 'O+' },
      { blood_group: 'A+' },
    ];
    expect(summarizeDonors(rows, where)).toMatchObject({
      patientBloodGroup: 'A+',
      governorate: 'Cairo',
      city: 'Nasr City',
      totalDonors: 4,
      byBloodGroup: { 'O-': 1, 'O+': 2, 'A+': 1 },
    });
  });

  it('reports zero rather than failing when nobody matches', () => {
    expect(summarizeDonors([], where)).toMatchObject({ totalDonors: 0, byBloodGroup: {} });
  });

  // Regression: the model was handed byBloodGroup as an object and reported 2 O+
  // donors where the query returned 1. It gets a finished sentence now.
  it('renders a summary line whose counts match the rows exactly', () => {
    const rows = [
      { blood_group: 'O-' },
      { blood_group: 'O-' },
      { blood_group: 'O+' },
      { blood_group: 'A-' },
      { blood_group: 'A-' },
    ];
    const { summary, totalDonors } = summarizeDonors(rows, where);
    expect(totalDonors).toBe(5);
    expect(summary).toBe(
      '5 donors in Nasr City, Cairo can donate to a A+ patient: 2 A-, 2 O-, 1 O+.',
    );
  });

  it('says nobody matches instead of rendering an empty list', () => {
    expect(summarizeDonors([], where).summary).toBe(
      'No registered donors in Nasr City, Cairo can donate to a A+ patient.',
    );
  });

  // The whole point of aggregating before the result reaches Groq.
  it('drops donor identities so no PII reaches the model provider', () => {
    const rows = [
      { blood_group: 'O-', display_name: 'Real Person', photo_url: 'https://x/y.png', id: 'uuid-1' },
    ] as never[];
    const serialized = JSON.stringify(summarizeDonors(rows, where));
    expect(serialized).not.toContain('Real Person');
    expect(serialized).not.toContain('photo_url');
    expect(serialized).not.toContain('uuid-1');
  });
});
