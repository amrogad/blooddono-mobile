import { createClient } from 'jsr:@supabase/supabase-js@2';

import { TOOLS, compatibilityReference, resolveDonorArgs, summarizeDonors } from './tools.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Groq retired every llama model, which silently broke this function in
// production: llama-3.1-8b-instant returned model_not_found on every request.
// The eval suite exists partly so that failure surfaces immediately next time.
const MODEL = 'openai/gpt-oss-20b';

type ChatMessage = {
  role: string;
  content: string | null;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

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
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages)) {
    return Response.json({ error: 'messages array required' }, { status: 400 });
  }
  const { messages, locale } = body as {
    messages: Array<{ role: string; text: string }>;
    locale?: string;
  };

  // Counted before the model runs, so a failed Groq call still costs the caller
  // a request. This is a spend limit, and attempts are what cost money.
  const { data: quota, error: quotaError } = await supabase.rpc('bump_assistant_usage').single();
  if (quotaError) {
    return Response.json({ error: quotaError.message }, { status: 500 });
  }
  if (quota && !quota.allowed) {
    return Response.json(
      { error: 'daily_limit_reached', used: quota.used, limit: quota.daily_limit },
      { status: 429 },
    );
  }

  // Read from the session rather than the request body. The client used to send
  // its own blood group and city, which meant the model could be fed whatever a
  // caller decided to claim about themselves.
  const { data: profile } = await supabase
    .from('profiles')
    .select('blood_group, governorate, city')
    .eq('id', user.id)
    .single();

  const systemPrompt =
    `You are a blood donation eligibility assistant for BloodDono, used in Egypt. ` +
    `The signed-in user's blood group is ${profile?.blood_group || 'unknown'} and they are in ` +
    `${[profile?.city, profile?.governorate].filter(Boolean).join(', ') || 'Egypt'}. ` +
    `Answer questions about donation eligibility, preparation, and aftercare. ` +
    `Use the find_compatible_donors tool for any question about donor availability rather than guessing numbers. ` +
    `Never invent donor counts. Be concise and direct. ` +
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
      // bounds both latency and spend at two calls per request.
      completion = await callGroq(groqKey, chat, false);
    }

    const reply: string = completion.choices?.[0]?.message?.content ?? 'No response received.';
    return Response.json({ reply, toolsUsed });
  } catch (err) {
    return Response.json({ error: String(err instanceof Error ? err.message : err) }, { status: 502 });
  }
});
