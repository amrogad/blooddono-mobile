import { createClient } from 'jsr:@supabase/supabase-js@2';

import { TOOLS, compatibilityReference, resolveDonorArgs, summarizeDonors } from './tools.ts';

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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function callGroq(key: string, messages: ChatMessage[], withTools: boolean) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(withTools ? { tools: TOOLS, tool_choice: 'auto' } : {}),
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

  if (user) {
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
        .select('blood_group, governorate, city')
        .eq('id', user.id)
        .single()
    : { data: null };

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
    `Always end each response with a one-sentence disclaimer that this is informational only and not medical advice.` +
    (locale === 'ar' ? ` Respond entirely in Modern Standard Arabic.` : ``);

  const chat: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const toolsUsed: string[] = [];

  try {
    let completion = await callGroq(groqKey, chat, true);
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
      chat.push({
        role: 'system',
        content:
          'The tool results above are final. Answer the user in prose now and do not call any tool.',
      });
      completion = await callGroq(groqKey, chat, false);
    }

    const reply: string = completion.choices?.[0]?.message?.content ?? 'No response received.';
    return json({ reply, toolsUsed });
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 502);
  }
});
