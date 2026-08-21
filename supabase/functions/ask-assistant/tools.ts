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

// Generated from the same governorates/cities data both apps ship. The donor
// search needs all three of blood group, governorate and city, but a person
// says "I'm in Nasr City", not "Nasr City, Cairo". Without this the model kept
// calling the tool with the governorate missing and having to ask a follow-up
// question it already had the answer to. Every city name here is unique across
// the 27 governorates, so the lookup is unambiguous.
export const CITY_TO_GOVERNORATE: Record<string, string> = {
  '10th of Ramadan': 'Sharqia',
  '6th of October': 'Giza',
  'Abnub': 'Asyut',
  'Abu Hammad': 'Sharqia',
  'Abu Hummus': 'Beheira',
  'Abu Simbel': 'Aswan',
  'Abu Sultan': 'Ismailia',
  'Abu Tig': 'Asyut',
  'Aga': 'Dakahlia',
  'Agami': 'Alexandria',
  'Akhmim': 'Sohag',
  'Arbaeen': 'Suez',
  'Arish': 'North Sinai',
  'Ashmoun': 'Monufia',
  'Aswan City': 'Aswan',
  'Asyut City': 'Asyut',
  'Ataqa': 'Suez',
  'Bahariya': 'New Valley',
  'Balat': 'New Valley',
  'Baltim': 'Kafr El Sheikh',
  'Banha': 'Qalyubia',
  'Belbeis': 'Sharqia',
  'Beni Hassan': 'Minya',
  'Beni Suef City': 'Beni Suef',
  'Biba': 'Beni Suef',
  'Bir al-Abd': 'North Sinai',
  'Borg El Arab': 'Alexandria',
  'Dabaa': 'Matrouh',
  'Dahab': 'South Sinai',
  'Dakhla': 'New Valley',
  'Damanhour': 'Beheira',
  'Damietta City': 'Damietta',
  'Dendera': 'Qena',
  'Desouk': 'Kafr El Sheikh',
  'Edfu': 'Aswan',
  'Edku': 'Beheira',
  'El Alamein': 'Matrouh',
  'El Dawahy': 'Port Said',
  'El Mahalla El Kubra': 'Gharbia',
  'El Manakh': 'Port Said',
  'El Qurna': 'Luxor',
  'El Quseir': 'Red Sea',
  'El Zohour': 'Port Said',
  'Esna': 'Luxor',
  'Faisal': 'Suez',
  'Faiyum City': 'Faiyum',
  'Farafra': 'New Valley',
  'Faraskour': 'Damietta',
  'Fashn': 'Beni Suef',
  'Fayed': 'Ismailia',
  'Fuwwah': 'Kafr El Sheikh',
  'Ganayen': 'Suez',
  'Girga': 'Sohag',
  'Giza City': 'Giza',
  'Haram': 'Giza',
  'Heliopolis': 'Cairo',
  'Hurghada': 'Red Sea',
  'Ibsheway': 'Faiyum',
  'Imbaba': 'Giza',
  'Ismailia City': 'Ismailia',
  'Kafr El Dawwar': 'Beheira',
  'Kafr El Sheikh City': 'Kafr El Sheikh',
  'Kafr El Zayat': 'Gharbia',
  'Kafr Saad': 'Damietta',
  'Karnak': 'Luxor',
  'Khanka': 'Qalyubia',
  'Kharga': 'New Valley',
  'Kom Ombo': 'Aswan',
  'Luxor City': 'Luxor',
  'Maadi': 'Cairo',
  'Maidum': 'Beni Suef',
  'Mallawi': 'Minya',
  'Manfalut': 'Asyut',
  'Mansoura': 'Dakahlia',
  'Marsa Alam': 'Red Sea',
  'Marsa Matrouh': 'Matrouh',
  'Menouf': 'Monufia',
  'Miami': 'Alexandria',
  'Minya City': 'Minya',
  'Minya El Qamh': 'Sharqia',
  'Mit Ghamr': 'Dakahlia',
  'Montaza': 'Alexandria',
  'Nag Hammadi': 'Qena',
  'Nakhl': 'North Sinai',
  'Naqada': 'Qena',
  'Nasr City': 'Cairo',
  'Nasr El Nuba': 'Aswan',
  'New Cairo': 'Cairo',
  'New Damietta': 'Damietta',
  'Nuweiba': 'South Sinai',
  'Obour': 'Qalyubia',
  'Port Fouad': 'Port Said',
  'Port Said City': 'Port Said',
  'Qalyub': 'Qalyubia',
  'Qantara': 'Ismailia',
  'Qena City': 'Qena',
  'Quesna': 'Monufia',
  'Qus': 'Qena',
  'Rafah': 'North Sinai',
  'Ras El Bar': 'Damietta',
  'Ras Gharib': 'Red Sea',
  'Rashid': 'Beheira',
  'Sadat City': 'Monufia',
  'Safaga': 'Red Sea',
  'Saint Catherine': 'South Sinai',
  'Sallum': 'Matrouh',
  'Samalut': 'Minya',
  'Samannoud': 'Gharbia',
  'Sharm El Sheikh': 'South Sinai',
  'Sheikh Zayed': 'Giza',
  'Sheikh Zuweid': 'North Sinai',
  'Sherbin': 'Dakahlia',
  'Shibin El Kom': 'Monufia',
  'Shubra': 'Cairo',
  'Shubra El Kheima': 'Qalyubia',
  'Sidfa': 'Asyut',
  'Sidi Gaber': 'Alexandria',
  'Sidi Salem': 'Kafr El Sheikh',
  'Sinnuris': 'Faiyum',
  'Siwa': 'Matrouh',
  'Sohag City': 'Sohag',
  'Suez City': 'Suez',
  'Taba': 'South Sinai',
  'Tahta': 'Sohag',
  'Talkha': 'Dakahlia',
  'Tamiya': 'Faiyum',
  'Tanta': 'Gharbia',
  'Tell El Kebir': 'Ismailia',
  'Tima': 'Sohag',
  'Tod': 'Luxor',
  'Tuna El Gebel': 'Minya',
  'Tunis Village': 'Faiyum',
  'Wasta': 'Beni Suef',
  'Zagazig': 'Sharqia',
  'Zefta': 'Gharbia',
};

export function governorateForCity(city: string): string {
  const needle = city.trim().toLowerCase();
  for (const [name, governorate] of Object.entries(CITY_TO_GOVERNORATE)) {
    if (name.toLowerCase() === needle) return governorate;
  }
  return '';
}

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
  const city = pick(args.city, profile?.city);
  // Falls back to deriving it from the city so a caller who named only their
  // city does not get asked for something we can already work out.
  const governorate =
    pick(args.governorate, profile?.governorate) || (city ? governorateForCity(city) : '');

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

  // The counts are also rendered here as one ready-to-quote line. Asked to read
  // them out of the JSON object instead, gpt-oss-20b transcribed the breakdown
  // wrong: for a real A+ lookup in Nasr City it reported 2 O+ donors where the
  // table held 1, while getting the total right. Over-reporting one group is the
  // same class of error as the A+ compatibility bug the evals caught, so the
  // model is given a string to repeat rather than numbers to copy.
  const breakdown = Object.entries(byBloodGroup)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([group, count]) => `${count} ${group}`)
    .join(', ');

  return {
    patientBloodGroup: where.bloodGroup,
    governorate: where.governorate,
    city: where.city,
    totalDonors: rows.length,
    byBloodGroup,
    summary: rows.length
      ? `${rows.length} donors in ${where.city}, ${where.governorate} can donate to a ${where.bloodGroup} patient: ${breakdown}.`
      : `No registered donors in ${where.city}, ${where.governorate} can donate to a ${where.bloodGroup} patient.`,
  };
}

export function isValidBloodGroup(value: string): boolean {
  return BLOOD_GROUPS.includes(value);
}
