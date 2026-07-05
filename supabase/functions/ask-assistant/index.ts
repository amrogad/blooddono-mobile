import { createClient } from 'jsr:@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
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

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const geminiRes = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return Response.json({ error: errText }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const reply: string =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received.';

  return Response.json({ reply });
});
