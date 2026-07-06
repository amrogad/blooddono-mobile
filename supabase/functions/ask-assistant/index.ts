import { createClient } from 'jsr:@supabase/supabase-js@2';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

  const { messages, bloodGroup, city } = body as {
    messages: Array<{ role: string; text: string }>;
    bloodGroup: string;
    city: string;
  };

  const systemPrompt =
    `You are a blood donation eligibility assistant. ` +
    `The user has blood group ${bloodGroup || 'unknown'} and is based in ${city || 'Egypt'}. ` +
    `Answer questions about eligibility, preparation, and aftercare. ` +
    `Be concise and direct. ` +
    `Always end each response with a one-sentence disclaimer that this is informational only and not medical advice.`;

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: groqMessages,
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return Response.json({ error: errText }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const reply: string = groqData.choices?.[0]?.message?.content ?? 'No response received.';

  return Response.json({ reply });
});
