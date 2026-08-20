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
    expect(result).toBe('Yes, you can donate.');
    expect(mockInvoke).toHaveBeenCalledWith('ask-assistant', {
      body: { messages, locale: 'en' },
    });
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
