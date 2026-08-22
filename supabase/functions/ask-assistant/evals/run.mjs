// Runs the eval set against the deployed ask-assistant function and prints a
// pass rate. Deliberately not part of `npm test`: it makes real Groq calls, so
// it costs money and is not deterministic. CI runs the mocked tool tests
// instead; this is the accuracy number, run on demand.
//
// Usage: npm run eval
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(repoRoot, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  } catch {
    /* fall through to process.env */
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const URL_BASE = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = env.EVAL_EMAIL || 'donor@blooddono.demo';
const PASSWORD = env.EVAL_PASSWORD || 'Demo123!';

if (!URL_BASE || !ANON) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// The model writes "O‑negative" with U+2011, not an ASCII hyphen. Without this
// the extractor silently found zero blood groups in answers that were entirely
// correct, and the first run scored four good answers as failures.
const normalizeDashes = (s) => s.replace(/[‐-―−]/g, '-');

const GROUP_RE = /\b(?:AB|A|B|O)\s*(?:\+|-|positive|negative)/gi;

function normalizeGroup(raw) {
  const s = raw.replace(/\s+/g, '').toLowerCase();
  const letter = s.match(/^(ab|a|b|o)/)[1].toUpperCase();
  return letter + (/(\+|positive)$/.test(s) ? '+' : '-');
}

function extractGroups(text) {
  return [...new Set((text.match(GROUP_RE) || []).map(normalizeGroup))].sort();
}

async function signIn() {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`sign-in failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Groq's free tier caps tokens-per-minute, and a 15-case run trips it. That is
// a harness problem, not a model accuracy problem, so it retries rather than
// scoring a false failure.
async function ask(token, question, attempt = 0) {
  const res = await fetch(`${URL_BASE}/functions/v1/ask-assistant`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: [{ role: 'user', text: question }], locale: 'en' }),
  });
  const data = await res.json();

  if (!res.ok) {
    const detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error || data);
    if (/rate_limit_exceeded|tokens per minute|TPM/i.test(detail) && attempt < 4) {
      await sleep(15000 * (attempt + 1));
      return ask(token, question, attempt + 1);
    }
    throw new Error(detail);
  }
  return data;
}

function grade(testCase, result) {
  const reply = normalizeDashes(result.reply || '');
  const used = result.toolsUsed || [];
  const failures = [];

  const calledTool = used.includes('find_compatible_donors');
  if (testCase.expectTool === true && !calledTool) failures.push('did not call find_compatible_donors');
  if (testCase.expectTool === false && calledTool) failures.push('called the tool when it should not have');

  // A draft is only real if the function validated one. Asserting on toolsUsed
  // alone would pass a call the resolver rejected for a missing field.
  if (testCase.expectDraft === true && !result.draft) {
    failures.push('no draft came back');
  }
  if (testCase.expectDraft === false && result.draft) {
    failures.push('drafted a request when it should have asked first');
  }

  if (testCase.expectDraftFields) {
    for (const [field, want] of Object.entries(testCase.expectDraftFields)) {
      const got = result.draft?.[field];
      if (got !== want) failures.push(`draft.${field} was ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`);
    }
  }

  for (const pattern of testCase.expectAll || []) {
    if (!new RegExp(pattern, 'i').test(reply)) failures.push(`missing /${pattern}/`);
  }

  for (const pattern of testCase.expectNone || []) {
    if (new RegExp(pattern, 'i').test(reply)) failures.push(`should not have said /${pattern}/`);
  }

  if (testCase.expectGroups) {
    const found = extractGroups(reply);
    const want = [...testCase.expectGroups].sort();
    if (JSON.stringify(found) !== JSON.stringify(want)) {
      failures.push(`blood groups ${JSON.stringify(found)} != expected ${JSON.stringify(want)}`);
    }
  }

  // Every answer must carry the not-medical-advice line. Kept deliberately
  // loose: the first version demanded those words be contiguous and rejected
  // "does not constitute medical advice" and "not a substitute for
  // personalized medical advice", both of which are perfectly good disclaimers.
  //
  // Drafting turns opt out: handing someone a card to confirm is a UI step, not
  // medical information, and the prompt asks for one short sentence there.
  if (
    testCase.expectDisclaimer !== false &&
    !/\bmedical advice\b|\bnot a substitute\b|\binformational purposes\b/i.test(reply)
  ) {
    failures.push('missing medical disclaimer');
  }

  return failures;
}

const cases = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));

const token = await signIn();
console.log(`Running ${cases.length} eval cases against ${URL_BASE}\n`);

let passed = 0;
const failedDetail = [];

const verbose = process.argv.includes('--verbose');

for (const testCase of cases) {
  let failures;
  let reply = '';
  try {
    const result = await ask(token, testCase.question);
    reply = result.reply || '';
    failures = grade(testCase, result);
  } catch (err) {
    failures = [`request failed: ${err.message}`];
  }

  if (failures.length === 0) {
    passed += 1;
    console.log(`  PASS  ${testCase.id}`);
  } else {
    console.log(`  FAIL  ${testCase.id}`);
    for (const f of failures) console.log(`          ${f}`);
    if (verbose && reply) console.log(`          reply: ${reply.replace(/\s+/g, ' ').slice(0, 400)}`);
    failedDetail.push(testCase.id);
  }

  await sleep(2500);
}

const rate = Math.round((passed / cases.length) * 100);
console.log(`\n${passed}/${cases.length} passed (${rate}%)`);
if (failedDetail.length) console.log(`failed: ${failedDetail.join(', ')}`);

process.exit(passed === cases.length ? 0 : 1);
