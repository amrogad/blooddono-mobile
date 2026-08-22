import { supabase } from '@/services/supabase';

import type { RequestDraft } from '@/services/donationService';

export type Message = {
  role: 'user' | 'assistant';
  text: string;
  // Present only when the model drafted a request. It is the edge function's
  // validated draft, never the model's raw tool arguments.
  draft?: RequestDraft | null;
  // Kept on the message rather than inside the card: a FlatList row can be
  // recycled, and a card holding its own "posted" state would come back
  // offering to post the same request a second time.
  postedId?: string;
  discarded?: boolean;
};

export type AssistantReply = {
  reply: string;
  toolsUsed: string[];
  draft: RequestDraft | null;
};

// Blood group and city are no longer sent: the edge function reads them from
// the session, so a caller cannot claim a profile that isn't theirs.
export async function askAssistant(
  messages: Message[],
  locale: 'en' | 'ar' = 'en',
): Promise<AssistantReply> {
  const { data, error } = await supabase.functions.invoke('ask-assistant', {
    // Only role and text go back to the model; the draft and its posted state
    // are display concerns.
    body: { messages: messages.map(({ role, text }) => ({ role, text })), locale },
  });
  if (error) throw new Error(error.message);
  const reply = data as Partial<AssistantReply>;
  return {
    reply: reply.reply ?? '',
    toolsUsed: reply.toolsUsed ?? [],
    draft: reply.draft ?? null,
  };
}
