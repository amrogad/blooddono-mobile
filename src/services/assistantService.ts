import { supabase } from '@/services/supabase';

export type Message = { role: 'user' | 'assistant'; text: string };

export async function askAssistant(
  messages: Message[],
  bloodGroup: string,
  city: string,
  locale: 'en' | 'ar' = 'en',
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ask-assistant', {
    body: { messages, bloodGroup, city, locale },
  });
  if (error) throw new Error(error.message);
  return (data as { reply: string }).reply;
}
