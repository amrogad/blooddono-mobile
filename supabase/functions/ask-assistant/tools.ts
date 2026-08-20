// Kept free of imports on purpose: index.ts runs on Deno, but the tests run on
// Jest in this repo. No dependencies means both can load this file as-is.

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Recipient group -> donor groups that can safely give to them. Mirrors the
// backend compatible_donor_types RPC and the web app's CAN_RECEIVE_FROM map.
//
// This is handed to the model in the system prompt rather than left to its
// training data. The eval set caught gpt-oss-20b answering that only A+ and O+
// can donate to A+, silently dropping A- and O- — under-reporting compatible
// donors in an app whose whole job is finding them. The app already knows this
// table authoritatively, so there is no reason to make the model recall it.
export const CAN_RECEIVE_FROM: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function compatibilityReference(): string {
  return Object.entries(CAN_RECEIVE_FROM)
    .map(([recipient, donors]) => `a ${recipient} patient can receive from ${donors.join(', ')}`)
    .join('; ');
}

export type Profile = {
  blood_group: string | null;
  governorate: string | null;
  city: string | null;
};

export type DonorRow = { blood_group: string };

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'find_compatible_donors',
      description:
        'Counts registered donors who can safely donate to a patient of a given blood group ' +
        'in a given Egyptian city. Call this whenever the user asks who can donate to them, ' +
        'how many donors are near them, or whether anyone is available to help. ' +
        'Returns counts grouped by donor blood group. It never returns names or contact details, ' +
        'so do not promise the user any specific person.',
      parameters: {
        type: 'object',
        properties: {
          bloodGroup: {
            type: 'string',
            enum: BLOOD_GROUPS,
            description: "The patient's blood group. Omit to use the signed-in user's own group.",
          },
          governorate: {
            type: 'string',
            description: "Governorate to search. Omit to use the signed-in user's governorate.",
          },
          city: {
            type: 'string',
            description: "City to search. Omit to use the signed-in user's city.",
          },
        },
        required: [],
      },
    },
  },
];

export type ResolvedArgs =
  | { ok: true; bloodGroup: string; governorate: string; city: string }
  | { ok: false; missing: string[] };

// The model may supply any subset of these, so anything it leaves out falls back
// to the caller's own profile. The profile is read server-side from the session,
// never taken from the request body.
export function resolveDonorArgs(
  args: Partial<Record<'bloodGroup' | 'governorate' | 'city', unknown>>,
  profile: Profile | null,
): ResolvedArgs {
  const pick = (fromModel: unknown, fromProfile: string | null | undefined) => {
    const v = typeof fromModel === 'string' && fromModel.trim() ? fromModel.trim() : fromProfile;
    return typeof v === 'string' && v.trim() ? v.trim() : '';
  };

  const bloodGroup = pick(args.bloodGroup, profile?.blood_group);
  const governorate = pick(args.governorate, profile?.governorate);
  const city = pick(args.city, profile?.city);

  const missing: string[] = [];
  if (!bloodGroup) missing.push('bloodGroup');
  if (!governorate) missing.push('governorate');
  if (!city) missing.push('city');
  if (missing.length) return { ok: false, missing };

  return { ok: true, bloodGroup, governorate, city };
}

// Aggregates before the result ever reaches Groq. search_donors returns
// display_name and photo_url, and none of that should leave our infrastructure
// for a third-party model just to answer "how many donors are near me".
export function summarizeDonors(rows: DonorRow[], where: { bloodGroup: string; governorate: string; city: string }) {
  const byBloodGroup: Record<string, number> = {};
  for (const row of rows) {
    if (!row?.blood_group) continue;
    byBloodGroup[row.blood_group] = (byBloodGroup[row.blood_group] ?? 0) + 1;
  }

  return {
    patientBloodGroup: where.bloodGroup,
    governorate: where.governorate,
    city: where.city,
    totalDonors: rows.length,
    byBloodGroup,
  };
}

export function isValidBloodGroup(value: string): boolean {
  return BLOOD_GROUPS.includes(value);
}
