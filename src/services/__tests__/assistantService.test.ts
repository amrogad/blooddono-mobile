import { supabase } from '@/services/supabase';
import { askAssistant, Message } from '@/services/assistantService';

jest.mock('@/services/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('askAssistant', () => {
  it('returns reply text on success', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { reply: 'Yes, you can donate.', toolsUsed: [] },
      error: null,
    });
    const messages: Message[] = [{ role: 'user', text: 'Can I donate?' }];
    const result = await askAssistant(messages);
    expect(result).toEqual({ reply: 'Yes, you can donate.', toolsUsed: [], draft: null });
    expect(mockInvoke).toHaveBeenCalledWith('ask-assistant', {
      body: { messages, locale: 'en' },
    });
  });

  it('passes through the draft the function validated', async () => {
    const draft = {
      recipient_name: 'Mona Fahmy',
      recipient_governorate: 'Cairo',
      recipient_city: 'Nasr City',
      hospital_name: 'Wadi El Nil Hospital',
      full_address: '12 Abbas El Akkad St',
      blood_group: 'O-',
      donation_date: '2026-08-24',
      donation_time: '14:30',
      request_message: 'Two units needed before surgery.',
    };
    mockInvoke.mockResolvedValueOnce({
      data: { reply: 'Have a look and confirm.', toolsUsed: ['draft_donation_request'], draft },
      error: null,
    });
    const result = await askAssistant([{ role: 'user', text: 'Post a request for my mother' }]);
    expect(result.draft).toEqual(draft);
  });

  // Older deploys of the function answer without the field at all.
  it('reports no draft rather than undefined when the function omits one', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { reply: 'ok' }, error: null });
    const result = await askAssistant([{ role: 'user', text: 'Can I donate?' }]);
    expect(result).toEqual({ reply: 'ok', toolsUsed: [], draft: null });
  });

  // The card and its posted state are display concerns. Sending them back would
  // put a request id into a third-party model's context for no reason.
  it('strips card state from the history it sends back', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { reply: 'ok', toolsUsed: [] }, error: null });
    await askAssistant([
      { role: 'user', text: 'Post a request' },
      { role: 'assistant', text: 'Confirm it', draft: null, postedId: 'row-1', discarded: true },
    ]);
    expect(mockInvoke.mock.calls[0][1].body.messages).toEqual([
      { role: 'user', text: 'Post a request' },
      { role: 'assistant', text: 'Confirm it' },
    ]);
  });

  it('forwards the active locale to the edge function', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { reply: 'نعم، يمكنك التبرع.', toolsUsed: [] },
      error: null,
    });
    const messages: Message[] = [{ role: 'user', text: 'هل يمكنني التبرع؟' }];
    await askAssistant(messages, 'ar');
    expect(mockInvoke).toHaveBeenCalledWith('ask-assistant', {
      body: { messages, locale: 'ar' },
    });
  });

  it('never sends blood group or city, which the server reads from the session', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { reply: 'ok', toolsUsed: [] }, error: null });
    await askAssistant([{ role: 'user', text: 'Who can donate to me?' }]);
    const sentBody = mockInvoke.mock.calls[0][1].body;
    expect(sentBody).not.toHaveProperty('bloodGroup');
    expect(sentBody).not.toHaveProperty('city');
  });

  it('throws when the edge function returns an error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    await expect(askAssistant([{ role: 'user', text: 'Can I donate?' }])).rejects.toThrow(
      'Edge Function returned a non-2xx status code',
    );
  });
});
