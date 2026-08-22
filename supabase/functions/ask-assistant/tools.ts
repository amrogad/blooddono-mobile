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

// The prompt asks the model not to use em dashes and it mostly complies, then
// slips one into "Just a reminder—this is informational only". It is the single
// clearest sign a machine wrote the text, so it gets enforced here rather than
// left to the model's good intentions.
export function stripAiDashes(text: string, locale = 'en'): string {
  const comma = locale === 'ar' ? '، ' : ', ';
  return text
    // A dash between two numbers is a range, "4-6 weeks", not an aside. Turning
    // that one into a comma would say something different and wrong.
    .replace(/(\d)\s*[—–]\s*(\d)/g, '$1-$2')
    .replace(/\s*[—–]\s*/g, comma);
}

// "Sure, I'll draft that once I know his blood group." Sure what? It agrees with
// nothing; it is throat-clearing the model does because it was trained to sound
// eager. The prompt asks it not to, twice, and it still does on about one reply
// in ten, so the opener comes off here.
// The punctuation is required, not optional, and that is the whole subtlety.
// Matching a bare "sure" turned "Sure thing! I'll need a few details" into
// "Thing! I'll need a few details", which is worse than the tic it was removing.
// Requiring the comma or the exclamation mark means an opener is only stripped
// when it is unambiguously an opener, and "Sure I can help" is left alone.
//
// Dashes are in the punctuation class so this does not depend on running after
// stripAiDashes: "Absolutely — eat first." loses the opener either way round.
const CHATBOT_OPENER =
  /^\s*(?:sure thing|sure|certainly|of course|absolutely|no problem)\s*[,!.:—–-]+\s*/i;

export function stripChatbotOpener(text: string): string {
  const stripped = text.replace(CHATBOT_OPENER, '');
  // A reply that was only "Sure." has nothing left worth showing, so it stands.
  if (!stripped.trim() || stripped === text) return text;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

// Deliberately anchored at both ends, so it only fires when the whole message is
// a greeting. "hey can I donate after a tattoo" is a health question wearing a
// hello and must keep its disclaimer.
const SMALL_TALK =
  /^(hi+|hey+|hello|yo|hiya|good (morning|afternoon|evening)|thanks?|thank you|thx|ok(ay)?|cool|nice|bye|goodbye|salam|salaam|مرحبا|السلام عليكم|شكرا|شكرًا|أهلا|اهلا|صباح الخير|مساء الخير)[\s!.,?]*$/i;

export function isSmallTalk(text: string): boolean {
  return SMALL_TALK.test(text.trim());
}

// Matches the closing sentence only, in either language. The Arabic question
// mark is its own character, so leaving it out of the sentence boundary made
// this swallow the sentence before the disclaimer as well.
// The word boundaries wrap only the Latin phrases: \b is defined on ASCII word
// characters, so \bنصيحة طبية\b never matches anything at all.
const DISCLAIMER_SENTENCE =
  /\s*[^.!?؟]*(?:\b(?:medical advice|informational only|not a substitute)\b|نصيحة طبية|للعلم فقط)[^.!?؟]*[.!?؟]*\s*$/i;

// The prompt says to leave the not-medical-advice line off greetings, and the
// model obeys most of the time. It slipped on "hey" often enough that the eval
// case for it went from passing to failing between runs, and an intermittent
// answer is worse than a consistently wrong one.
export function stripDisclaimer(text: string): string {
  const stripped = text.replace(DISCLAIMER_SENTENCE, '').trim();
  // If the disclaimer was the entire reply there is nothing to show instead.
  return stripped || text;
}

export function hasDisclaimer(text: string): boolean {
  return DISCLAIMER_SENTENCE.test(text);
}

const DISCLAIMER = {
  en: 'This is informational only and not medical advice.',
  ar: 'هذه معلومات عامة وليست نصيحة طبية.',
};

// The other half of the same problem. Told to close health answers with the
// not-medical-advice line the model does it about nine times in ten, and the
// tenth is the one that matters, on an app that answers questions about who may
// safely give blood. Whether the line appears is decided by the caller from the
// turn it just handled, not by the model remembering.
export function ensureDisclaimer(text: string, locale = 'en'): string {
  if (hasDisclaimer(text)) return text;
  const trimmed = text.trim();
  const line = locale === 'ar' ? DISCLAIMER.ar : DISCLAIMER.en;
  return trimmed ? `${trimmed} ${line}` : line;
}

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

export const DRAFT_REQUEST_TOOL = {
  type: 'function',
  function: {
    name: 'draft_donation_request',
    description:
      'Prepares a draft blood donation request and shows it to the user as a card they must ' +
      'confirm before anything is saved. Calling this does not post the request and does not ' +
      'notify anyone. Call it once you have gathered the patient details from the user. Any ' +
      'detail you leave out comes back as a list of what is still missing, so call it as soon ' +
      'as you have most of the answers rather than interrogating the user first. Never guess a ' +
      'blood group, hospital, address, date or time: ask for them.',
    parameters: {
      type: 'object',
      properties: {
        recipientName: { type: 'string', description: 'Name of the patient who needs the blood.' },
        // Deliberately not an enum, unlike the donor lookup. This tool is built
        // to be called with gaps so the missing fields come back as a question,
        // and a model with no blood group to give sends "". Groq validates enums
        // itself and 400s the whole request over that, so the user got an error
        // instead of being asked which group. resolveDraftArgs checks the value
        // against BLOOD_GROUPS anyway, so nothing invalid reaches the card.
        bloodGroup: {
          type: 'string',
          description:
            "The patient's blood group, one of " +
            BLOOD_GROUPS.join(', ') +
            ". Never assume the user's own group. Leave it out if you have not been told it.",
        },
        hospitalName: { type: 'string', description: 'Hospital where the donation happens.' },
        governorate: {
          type: 'string',
          description: 'Governorate. Omit to derive it from the city.',
        },
        city: { type: 'string', description: "City of the hospital. Defaults to the user's city." },
        address: { type: 'string', description: 'Street address of the hospital.' },
        date: {
          type: 'string',
          description:
            'Date needed as YYYY-MM-DD, today or later. Resolve wording like "tomorrow" ' +
            "against today's date given in your instructions.",
        },
        time: { type: 'string', description: 'Time needed as HH:MM on a 24-hour clock.' },
        // Left to the model to write and it would ask for a note the user had
        // already given, in different words, roughly half the time. Summarising
        // what they said is not inventing anything; asking again is just a turn
        // wasted on somebody in a hurry.
        message: {
          type: 'string',
          description:
            'Short note for donors saying why the blood is needed. Write it yourself from ' +
            'what the user already told you, in their words. Only ask for one if they gave ' +
            'no reason at all.',
        },
      },
      required: [],
    },
  },
};

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

// Drafting is only offered to someone who could post the request through the
// form anyway. A signed-out visitor or a volunteer never sees the tool exist,
// so the model cannot offer them something the database would refuse.
export function toolsFor(canCreateRequests: boolean) {
  return canCreateRequests ? [...TOOLS, DRAFT_REQUEST_TOOL] : TOOLS;
}

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
  const namedCity = pick(args.city, null);
  const city = namedCity || pick(null, profile?.city);
  // An explicit city decides the governorate, ahead of the one on the profile.
  // The other order looked reasonable and was wrong: asking about Tanta from a
  // profile that says Cairo searched "Tanta, Cairo", which matches nobody, and
  // the assistant reported no donors instead of saying it could not tell.
  // Falls back to deriving from the profile city so a caller who named neither
  // is not asked for something already known.
  const governorate =
    pick(args.governorate, null) ||
    (namedCity ? governorateForCity(namedCity) : '') ||
    pick(null, profile?.governorate) ||
    (city ? governorateForCity(city) : '');

  const missing: string[] = [];
  if (!bloodGroup) missing.push('bloodGroup');
  if (!governorate) missing.push('governorate');
  if (!city) missing.push('city');
  if (missing.length) return { ok: false, missing };

  return { ok: true, bloodGroup, governorate, city };
}

// Shaped as the request columns so the client can spread it straight into an
// insert. requester_id is deliberately absent: it defaults to auth.uid() and the
// insert policy checks it, so the draft has no say in who owns the row.
export type RequestDraft = {
  recipient_name: string;
  blood_group: string;
  hospital_name: string;
  recipient_governorate: string;
  recipient_city: string;
  full_address: string;
  donation_date: string;
  donation_time: string;
  request_message: string;
};

export type ResolvedDraft =
  | { ok: true; draft: RequestDraft; summary: string }
  | { ok: false; missing: string[] };

const CAPS = {
  recipientName: 120,
  hospitalName: 160,
  address: 240,
  message: 600,
};

const text = (value: unknown, cap: number) =>
  typeof value === 'string' ? value.trim().slice(0, cap) : '';

// A calendar day, not a date the model made up in another format. Round-tripping
// through Date is what rejects 2026-02-31, which the regex alone would accept.
function isoDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return '';
  const day = value.trim();
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day ? '' : day;
}

// Postgres stores a `time` column, so seconds are accepted and dropped rather
// than rejected. "2:30 PM" is refused outright: guessing whether the model meant
// 02:30 or 14:30 on a hospital appointment is not a guess worth making.
function clockTime(value: unknown): string {
  if (typeof value !== 'string') return '';
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value.trim())
    ? value.trim().slice(0, 5)
    : '';
}

type DraftArgKey =
  | 'recipientName'
  | 'bloodGroup'
  | 'hospitalName'
  | 'governorate'
  | 'city'
  | 'address'
  | 'date'
  | 'time'
  | 'message';

// `today` is passed in rather than read from the clock so the rule stays
// testable and so the caller decides the timezone. Egypt, not UTC: for two hours
// every night those disagree about what "tomorrow" means.
export function resolveDraftArgs(
  args: Partial<Record<DraftArgKey, unknown>>,
  profile: Profile | null,
  today: string,
): ResolvedDraft {
  const recipientName = text(args.recipientName, CAPS.recipientName);
  const hospitalName = text(args.hospitalName, CAPS.hospitalName);
  const address = text(args.address, CAPS.address);
  const message = text(args.message, CAPS.message);

  // No fallback to the profile. The requester is not the patient, and defaulting
  // to the account holder's group would put a wrong blood type on a real request.
  const claimedGroup = text(args.bloodGroup, 8).toUpperCase();
  const bloodGroup = BLOOD_GROUPS.includes(claimedGroup) ? claimedGroup : '';

  const namedCity = text(args.city, 80);
  const city = namedCity || text(profile?.city, 80);
  // An explicit city wins over the profile governorate. Inheriting it instead
  // would file a Tanta hospital under Cairo for anyone whose profile says Cairo.
  const governorate =
    text(args.governorate, 80) ||
    (namedCity ? governorateForCity(namedCity) : '') ||
    text(profile?.governorate, 80) ||
    (city ? governorateForCity(city) : '');

  const date = isoDate(args.date);
  const time = clockTime(args.time);

  const missing: string[] = [];
  if (!recipientName) missing.push('recipientName');
  if (!bloodGroup) missing.push('bloodGroup');
  if (!hospitalName) missing.push('hospitalName');
  if (!governorate) missing.push('governorate');
  if (!city) missing.push('city');
  if (!address) missing.push('address');
  // A date already past is as useless as no date: the request would land in the
  // list already expired, so it goes back as something to ask about.
  if (!date || date < today) missing.push('date');
  if (!time) missing.push('time');
  if (!message) missing.push('message');
  if (missing.length) return { ok: false, missing };

  const draft: RequestDraft = {
    recipient_name: recipientName,
    blood_group: bloodGroup,
    hospital_name: hospitalName,
    recipient_governorate: governorate,
    recipient_city: city,
    full_address: address,
    donation_date: date,
    donation_time: time,
    request_message: message,
  };

  return {
    ok: true,
    draft,
    // Facts only. This started out carrying its own instructions, along the
    // lines of "tell them to check it and press Confirm, in one short sentence",
    // and the model read that as text to repeat: users were shown the
    // instruction verbatim, stage directions and all. Anything addressed to the
    // model belongs in a system message, where it cannot be mistaken for
    // something to say out loud. The card already renders every field, so there
    // is nothing here for the model to transcribe.
    summary:
      `A draft card for ${recipientName} (${bloodGroup}, ${hospitalName}, ${city}, ` +
      `${date} at ${time}) is now on the user's screen. Nothing has been saved.`,
  };
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
