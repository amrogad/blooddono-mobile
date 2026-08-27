import { createClient } from 'jsr:@supabase/supabase-js@2';

import {
  type RequestDraft,
  compatibilityReference,
  resolveDonorArgs,
  resolveDraftArgs,
  ensureDisclaimer,
  isSmallTalk,
  stripAiDashes,
  stripDisclaimer,
  summarizeDonors,
  toolsFor,
} from './tools.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retired every llama model, which silently broke this function in
// production: llama-3.1-8b-instant returned model_not_found on every request.
// The eval suite exists partly so that failure surfaces immediately next time.
const MODEL = 'openai/gpt-oss-20b';

// React Native does not enforce CORS, so the mobile app never needed these and
// the function had no browser support at all until the web app called it.
// Allow-Origin is * because the JWT check below is the actual access boundary,
// not the origin header.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-eval-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });

type ChatMessage = {
  role: string;
  content: string | null;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

// Anonymous callers have no user id to meter, so they are metered on their
// address instead. It is hashed with a server-side salt before it leaves this
// function: the quota table should be able to tell two visitors apart without
// holding anybody's IP.
async function clientKey(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const salt = Deno.env.get('ANON_QUOTA_SALT') ?? 'blooddono';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Egypt, not UTC. The model has no clock, so it is told what today is and asked
// to resolve "tomorrow" itself; between midnight and 02:00 Cairo time UTC still
// says yesterday, and a request drafted for "tomorrow" would come back refused
// as a date in the past.
function todayInEgypt() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

async function callGroq(
  key: string,
  messages: ChatMessage[],
  tools: unknown[] | null,
) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(tools ? { tools, tool_choice: 'auto' } : {}),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  // supabase-js always sends an Authorization header, carrying the anon key when
  // nobody is signed in. So the presence of the header proves nothing; whether
  // getUser() resolves to a real user is what separates the two paths below.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await supabase.auth.getUser();

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) {
    return json({ error: 'GROQ_API_KEY not configured' }, 500);
  }

  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return json({ error: 'messages array required' }, 400);
  }
  const { messages, locale } = body as {
    messages: Array<{ role: string; text: string }>;
    locale?: string;
  };

  // Counted before the model runs, so a failed Groq call still costs the caller
  // a request. This is a spend limit, and attempts are what cost money.
  let quota: { allowed: boolean; used: number; daily_limit: number } | null = null;
  let quotaError: { message: string } | null = null;

  // The eval suite signs in as the donor demo account, and one run is 19 of that
  // account's 50 answers a day. Two runs plus a couple of spot checks locks the
  // account out, which also locks out the public demo, since they are the same
  // login. A shared secret lets the suite skip metering without changing what
  // anybody else is allowed.
  //
  // Fails closed: with the secret unset there is no bypass to find, and an empty
  // header can never match an empty env var.
  const evalKey = Deno.env.get('EVAL_BYPASS_KEY');
  const meteringExempt = Boolean(evalKey) && req.headers.get('x-eval-key') === evalKey;

  if (meteringExempt) {
    quota = null;
  } else if (user) {
    ({ data: quota, error: quotaError } = await supabase.rpc('bump_assistant_usage').single());
  } else {
    // The anon quota function is service-role only, so it needs its own client.
    // Metering a signed-out visitor on the key they sent us would be pointless:
    // the anon key is the same for everybody.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    ({ data: quota, error: quotaError } = await admin
      .rpc('bump_anon_assistant_usage', { p_client_key: await clientKey(req) })
      .single());
  }

  if (quotaError) {
    return json({ error: quotaError.message }, 500);
  }
  if (quota && !quota.allowed) {
    return json(
      { error: 'daily_limit_reached', used: quota.used, limit: quota.daily_limit },
      429,
    );
  }

  // Read from the session rather than the request body. The client used to send
  // its own blood group and city, which meant the model could be fed whatever a
  // caller decided to claim about themselves. A signed-out visitor simply has no
  // profile, so the model has to ask them for a blood group and city instead.
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('blood_group, governorate, city, role')
        .eq('id', user.id)
        .single()
    : { data: null };

  // Any signed-in user can post a request, which mirrors the insert policy
  // (requester_id = auth.uid()). Read from the session, never the request body.
  const canCreateRequests = !!user;
  const today = todayInEgypt();

  const whoTheyAre = user
    ? `The signed-in user's blood group is ${profile?.blood_group || 'unknown'} and they are in ` +
      `${[profile?.city, profile?.governorate].filter(Boolean).join(', ') || 'Egypt'}. `
    : `The user is not signed in, so you do not know their blood group or city. ` +
      `If a question needs either one, ask for it before calling any tool. ` +
      `Do not tell them to sign in unless they ask how to save something. `;

  const systemPrompt =
    `You are a blood donation eligibility assistant for BloodDono, used in Egypt. ` +
    whoTheyAre +
    `Answer questions about donation eligibility, preparation, and aftercare. ` +
    `Use the find_compatible_donors tool for any question about donor availability rather than guessing numbers. ` +
    `Never invent donor counts. When that tool returns, state its "summary" field as written and do not ` +
    `recalculate, round, or re-derive any number in it. Translate the wording if answering in another ` +
    `language, but keep every count exactly as given. Be concise and direct. ` +
    `Use this compatibility reference verbatim and never contradict it: ${compatibilityReference()}. ` +
    `When asked who can donate to a group, list every group in that reference entry, including the Rh-negative ones. ` +
    // Left to itself the model answered "hey" with "Sure—how can I help you with
    // blood donation information today?". Sure what? Nobody opens that way, and
    // the em dash is the giveaway that a machine wrote it.
    `Talk like a helpful person, not a chatbot. Greet someone back before anything else when they ` +
    `greet you, and keep small talk to a sentence. Never open with "Sure", "Certainly" or "Of ` +
    `course", and never use an em dash or en dash; write two sentences or use a comma instead. ` +
    // The chat already carries a permanent "Informational only, not medical
    // advice" line under the input in both apps, so repeating it every turn is
    // noise that trains people to stop reading it.
    `Close with a short reminder that this is informational only and not medical advice whenever you ` +
    `have answered anything about health or blood: eligibility, deferrals, preparation, aftercare, ` +
    `or which blood groups can give to which. Leave it off greetings, thanks, other small talk, and ` +
    `anything to do with drafting or posting a request, because no health question was asked. The ` +
    `app shows that notice under the chat at all times, so repeating it on a hello is noise.` +
    (canCreateRequests
      ? ` Today's date is ${today}. When the user wants to post a request for blood, gather the ` +
        `patient's name and blood group, the hospital, its city and street address, the date and ` +
        `time it is needed and a short note, then call draft_donation_request. That tool only ` +
        `prepares a card for them to confirm; it does not post anything, so never tell the user ` +
        `their request has been created, sent or shared.`
      : ``) +
    (locale === 'ar' ? ` Respond entirely in Modern Standard Arabic.` : ``);

  const chat: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const toolsUsed: string[] = [];
  let draft: RequestDraft | null = null;

  try {
    let completion = await callGroq(groqKey, chat, toolsFor(canCreateRequests));
    const first = completion.choices?.[0]?.message;
    const toolCalls = first?.tool_calls ?? [];

    if (toolCalls.length) {
      chat.push(first);

      for (const call of toolCalls) {
        toolsUsed.push(call.function.name);
        let result: unknown;

        if (call.function.name === 'find_compatible_donors') {
          const parsed = JSON.parse(call.function.arguments || '{}');
          const resolved = resolveDonorArgs(parsed, profile ?? null);

          if (!resolved.ok) {
            result = {
              error: `Missing ${resolved.missing.join(', ')}. Ask the user for the missing detail.`,
            };
          } else {
            const { data, error } = await supabase.rpc('search_donors', {
              p_blood_group: resolved.bloodGroup,
              p_governorate: resolved.governorate,
              p_city: resolved.city,
            });
            result = error ? { error: error.message } : summarizeDonors(data ?? [], resolved);
          }
        } else if (call.function.name === 'draft_donation_request' && canCreateRequests) {
          const parsed = JSON.parse(call.function.arguments || '{}');
          const resolved = resolveDraftArgs(parsed, profile ?? null, today);

          if (!resolved.ok) {
            result = {
              error:
                `Nothing was drafted. Still needed: ${resolved.missing.join(', ')}. ` +
                `Ask the user for those, and only those.`,
            };
          } else {
            // The response carries the validated draft, never the model's raw
            // arguments. Whatever it says next, the card shows a blood group
            // from the enum and a date that has not already passed.
            draft = resolved.draft;
            result = { summary: resolved.summary };
          }
        } else {
          result = { error: `Unknown tool ${call.function.name}` };
        }

        chat.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      // Second pass runs without tools so a confused model cannot loop, which
      // bounds both latency and spend at two calls per request. Groq rejects the
      // whole request if the model tries to call a tool anyway ("Tool choice is
      // none, but model called a tool"), which surfaced as an intermittent 502,
      // so it gets told in words that the lookup is already done.
      // The tone and disclaimer rules live in the first system message, and the
      // model half forgets them by this pass: it opened drafting replies with
      // "Sure," and closed them with a medical disclaimer nobody had asked for.
      // Restating the two that kept slipping is cheaper than post-processing the
      // prose, and it fixes the cause rather than the symptom.
      chat.push({
        role: 'system',
        content:
          'The tool results above are final. Answer the user in prose now and do not call any ' +
          'tool. Do not open with "Sure", "Certainly" or "Of course", and do not use an em dash. ' +
          'If a draft card was prepared, tell the user in one short sentence to look it over and ' +
          'press Confirm. Do not list the details back to them, the card already shows them, and ' +
          'do not say the request has been posted, because it has not. ' +
          'If this turn was about drafting or posting a request rather than a health question, ' +
          'leave off the not-medical-advice line.',
      });
      completion = await callGroq(groqKey, chat, null);
    }

    // The prompt asks for all three of these and the model complies most of the
    // time. "Most of the time" is not a standard you can ship, so the tics that
    // survived the asking get removed here instead. The disclaimer is only
    // dropped when the user said nothing but hello: a health question keeps it,
    // however casually it was phrased.
    const raw: string = completion.choices?.[0]?.message?.content ?? 'No response received.';
    const lang = locale === 'ar' ? 'ar' : 'en';
    let reply = stripAiDashes(raw, lang);

    // Whether the not-medical-advice line belongs on this turn is decided here,
    // from what the turn actually did, rather than left to the model. Asked
    // nicely it got this right about nine times in ten and flipped both ways
    // between runs of the same eval case: adding the line to a greeting, then
    // dropping it from an answer about who can safely donate to an O- patient.
    // On a health app the tenth time is the one that matters.
    const lastUserMessage = [...messages].reverse().find((m) => m.role !== 'assistant')?.text ?? '';
    // Attempted counts, not just succeeded. A call the resolver turned down for
    // a missing blood group is still a drafting turn, and the reply to it is
    // "which blood group is it?", which is not health advice either.
    const draftingTurn = toolsUsed.includes('draft_donation_request');
    const lookupOnly = toolsUsed.includes('find_compatible_donors') && !draftingTurn;

    if (draftingTurn || isSmallTalk(lastUserMessage)) {
      // Nothing health-related was answered: a card to confirm, or a hello.
      reply = stripDisclaimer(reply);
    } else if (!lookupOnly) {
      // Everything else this assistant answers is eligibility or compatibility.
      // A donor count is neither, so it is left however the model wrote it.
      reply = ensureDisclaimer(reply, lang);
    }
    return json({ reply, toolsUsed, draft });
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 502);
  }
});
