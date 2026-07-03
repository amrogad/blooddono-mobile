import { signIn, signOut, getSession } from '../authService';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as {
  signInWithPassword: jest.Mock;
  signOut: jest.Mock;
  getSession: jest.Mock;
};

beforeEach(() => jest.clearAllMocks());

describe('signIn', () => {
  test('returns the session on success', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });

    const session = await signIn('a@b.com', 'pw');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
    });
    expect(session.user.id).toBe('u1');
  });

  test('throws on auth error', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login' },
    });

    await expect(signIn('a@b.com', 'bad')).rejects.toThrow('Invalid login');
  });
});

describe('signOut', () => {
  test('calls supabase signOut', async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await signOut();
    expect(auth.signOut).toHaveBeenCalled();
  });
});

describe('getSession', () => {
  test('returns the current session', async () => {
    auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    const session = await getSession();
    expect(session?.user.id).toBe('u1');
  });
});
