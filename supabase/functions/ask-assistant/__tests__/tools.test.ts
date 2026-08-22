import {
  CAN_RECEIVE_FROM,
  DRAFT_REQUEST_TOOL,
  TOOLS,
  compatibilityReference,
  governorateForCity,
  resolveDonorArgs,
  resolveDraftArgs,
  summarizeDonors,
  toolsFor,
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

describe('draft_donation_request tool schema', () => {
  const tool = DRAFT_REQUEST_TOOL.function;

  it('is named for drafting, not creating, so the model does not claim it posted', () => {
    expect(tool.name).toBe('draft_donation_request');
    expect(tool.description).toMatch(/draft/i);
    expect(tool.description).toMatch(/confirm/i);
  });

  it('constrains bloodGroup to the eight real groups', () => {
    expect(tool.parameters.properties.bloodGroup.enum).toEqual([
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
    ]);
  });

  it('requires no arguments, so a partial call comes back as a question', () => {
    expect(tool.parameters.required).toEqual([]);
  });

  it('is withheld from anyone who cannot post a request', () => {
    expect(toolsFor(false)).toEqual(TOOLS);
    expect(toolsFor(false).map((t) => t.function.name)).not.toContain('draft_donation_request');
  });

  it('is offered alongside the donor lookup to a donor or admin', () => {
    expect(toolsFor(true).map((t) => t.function.name)).toEqual([
      'find_compatible_donors',
      'draft_donation_request',
    ]);
  });
});

describe('resolveDraftArgs', () => {
  const profile = {
    blood_group: 'A+',
    governorate: 'Cairo',
    city: 'Nasr City',
  };
  const today = '2026-08-22';
  const complete = {
    recipientName: 'Mona Fahmy',
    bloodGroup: 'O-',
    hospitalName: 'Wadi El Nil Hospital',
    city: 'Nasr City',
    address: '12 Abbas El Akkad St',
    date: '2026-08-24',
    time: '14:30',
    message: 'Two units needed before surgery on Monday.',
  };

  it('maps a complete call onto the request columns', () => {
    const result = resolveDraftArgs(complete, profile, today);
    expect(result).toEqual({
      ok: true,
      draft: {
        recipient_name: 'Mona Fahmy',
        blood_group: 'O-',
        hospital_name: 'Wadi El Nil Hospital',
        recipient_governorate: 'Cairo',
        recipient_city: 'Nasr City',
        full_address: '12 Abbas El Akkad St',
        donation_date: '2026-08-24',
        donation_time: '14:30',
        request_message: 'Two units needed before surgery on Monday.',
      },
      summary: expect.any(String),
    });
  });

  // The requester is not the patient. Defaulting the patient's group to the
  // account holder's would put a wrong blood type on a real request.
  it('never falls back to the requester own blood group', () => {
    const { bloodGroup, ...noGroup } = complete;
    expect(resolveDraftArgs(noGroup, profile, today)).toEqual({
      ok: false,
      missing: ['bloodGroup'],
    });
  });

  it('rejects a blood group outside the eight, rather than passing it through', () => {
    const result = resolveDraftArgs({ ...complete, bloodGroup: 'C+' }, profile, today);
    expect(result).toEqual({ ok: false, missing: ['bloodGroup'] });
  });

  it('falls back to the profile city, since that is a location and not a diagnosis', () => {
    const { city, ...noCity } = complete;
    expect(resolveDraftArgs(noCity, profile, today)).toMatchObject({
      ok: true,
      draft: { recipient_city: 'Nasr City', recipient_governorate: 'Cairo' },
    });
  });

  // resolveDonorArgs inherits the profile governorate even when the model names
  // a city in a different one. Here an explicit city wins outright.
  it('derives the governorate from an explicit city instead of inheriting the profile', () => {
    const result = resolveDraftArgs({ ...complete, city: 'Tanta' }, profile, today);
    expect(result).toMatchObject({
      ok: true,
      draft: { recipient_city: 'Tanta', recipient_governorate: 'Gharbia' },
    });
  });

  it('reports the governorate missing for a city it cannot place', () => {
    const result = resolveDraftArgs({ ...complete, city: 'Atlantis' }, null, today);
    expect(result).toEqual({ ok: false, missing: ['governorate'] });
  });

  it('lists everything missing at once so the model asks a single question', () => {
    expect(resolveDraftArgs({}, null, today)).toEqual({
      ok: false,
      missing: [
        'recipientName',
        'bloodGroup',
        'hospitalName',
        'governorate',
        'city',
        'address',
        'date',
        'time',
        'message',
      ],
    });
  });

  it('accepts a donation dated today', () => {
    expect(resolveDraftArgs({ ...complete, date: today }, profile, today)).toMatchObject({
      ok: true,
      draft: { donation_date: today },
    });
  });

  // The model has no clock. Told the wrong date it will happily draft one, and a
  // request in the past is invisible in a list sorted by urgency.
  it('refuses a date in the past', () => {
    const result = resolveDraftArgs({ ...complete, date: '2026-08-21' }, profile, today);
    expect(result).toEqual({ ok: false, missing: ['date'] });
  });

  it('refuses a date that is not an ISO calendar day', () => {
    for (const date of ['24/08/2026', 'tomorrow', '2026-8-24', '2026-02-31', '']) {
      expect(resolveDraftArgs({ ...complete, date }, profile, today)).toEqual({
        ok: false,
        missing: ['date'],
      });
    }
  });

  it('accepts HH:MM and trims the seconds Postgres would drop anyway', () => {
    expect(resolveDraftArgs({ ...complete, time: '09:05:00' }, profile, today)).toMatchObject({
      draft: { donation_time: '09:05' },
    });
  });

  it('refuses a time that is not a real 24-hour clock reading', () => {
    for (const time of ['2:30 PM', '25:00', '14:60', 'afternoon', '9:5']) {
      expect(resolveDraftArgs({ ...complete, time }, profile, today)).toEqual({
        ok: false,
        missing: ['time'],
      });
    }
  });

  it('caps free text so a runaway generation cannot be posted', () => {
    const result = resolveDraftArgs(
      { ...complete, recipientName: 'x'.repeat(400), message: 'y'.repeat(2000) },
      profile,
      today,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.draft.recipient_name).toHaveLength(120);
    expect(result.draft.request_message).toHaveLength(600);
  });

  it('treats whitespace-only model output as absent', () => {
    expect(resolveDraftArgs({ ...complete, hospitalName: '   ' }, profile, today)).toEqual({
      ok: false,
      missing: ['hospitalName'],
    });
  });

  it('ignores a requester_id the model tried to smuggle in', () => {
    const result = resolveDraftArgs(
      { ...complete, requester_id: 'someone-else', donation_status: 'confirmed' } as never,
      profile,
      today,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.draft)).toEqual([
      'recipient_name',
      'blood_group',
      'hospital_name',
      'recipient_governorate',
      'recipient_city',
      'full_address',
      'donation_date',
      'donation_time',
      'request_message',
    ]);
  });

  // Same fix as the donor counts: the model gets a finished sentence to repeat,
  // not fields to transcribe. The card already shows the detail.
  it('hands back a summary that names the card rather than restating every field', () => {
    const result = resolveDraftArgs(complete, profile, today);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summary).toContain('O-');
    expect(result.summary).toContain('Wadi El Nil Hospital');
    expect(result.summary).toMatch(/confirm/i);
    expect(result.summary).not.toMatch(/posted|created|submitted/i);
  });

  it('handles a missing profile without throwing', () => {
    const result = resolveDraftArgs(complete, null, today);
    expect(result).toMatchObject({ ok: true, draft: { recipient_governorate: 'Cairo' } });
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
