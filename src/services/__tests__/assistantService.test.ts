import { supabase } from '@/services/supabase';
import { askAssistant, Message } from '@/services/assistantService';

jest.mock('@/services/supabase', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('askAssistant', () => {
  it('returns reply text on success', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { reply: 'Yes, you can donate.' }, error: null });
    const messages: Message[] = [{ role: 'user', text: 'Can I donate?' }];
    const result = await askAssistant(messages, 'O+', 'Cairo');
    expect(result).toBe('Yes, you can donate.');
    expect(mockInvoke).toHaveBeenCalledWith('ask-assistant', {
      body: { messages, bloodGroup: 'O+', city: 'Cairo', locale: 'en' },
    });
  });

  it('forwards the active locale to the edge function', async () => {
    mockInvoke.mockResolvedValueOnce({ data: { reply: 'نعم، يمكنك التبرع.' }, error: null });
    const messages: Message[] = [{ role: 'user', text: 'هل يمكنني التبرع؟' }];
    await askAssistant(messages, 'O+', 'Cairo', 'ar');
    expect(mockInvoke).toHaveBeenCalledWith('ask-assistant', {
      body: { messages, bloodGroup: 'O+', city: 'Cairo', locale: 'ar' },
    });
  });

  it('throws when the edge function returns an error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function returned a non-2xx status code' },
    });
    await expect(
      askAssistant([{ role: 'user', text: 'Can I donate?' }], 'O+', 'Cairo'),
    ).rejects.toThrow('Edge Function returned a non-2xx status code');
  });
});
