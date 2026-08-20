import { supabase } from '@/services/supabase';

export type Message = { role: 'user' | 'assistant'; text: string };

export type AssistantReply = { reply: string; toolsUsed: string[] };

// Blood group and city are no longer sent: the edge function reads them from
// the session, so a caller cannot claim a profile that isn't theirs.
export async function askAssistant(
  messages: Message[],
  locale: 'en' | 'ar' = 'en',
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ask-assistant', {
    body: { messages, locale },
  });
  if (error) throw new Error(error.message);
  return (data as AssistantReply).reply;
}
