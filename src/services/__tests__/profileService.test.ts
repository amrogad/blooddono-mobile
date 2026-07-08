import {
  getProfile,
  updateProfile,
  searchDonors,
  savePushToken,
  uploadAvatar,
} from '@/services/profileService';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(), storage: { from: jest.fn() } },
}));

const rpc = supabase.rpc as jest.Mock;
const from = supabase.from as jest.Mock;
const storageFrom = supabase.storage.from as jest.Mock;

type QueryMock = {
  select: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  then: (resolve: (v: unknown) => void) => void;
};

function makeQuery(result: { data: unknown; error: unknown }): QueryMock {
  const q = {} as QueryMock;
  q.select = jest.fn(() => q);
  q.update = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.single = jest.fn(() => q);
  q.then = (resolve: (v: unknown) => void) => resolve(result);
  return q;
}

beforeEach(() => jest.clearAllMocks());

describe('getProfile', () => {
  test('reads the profile row for the user', async () => {
    const profile = { display_name: 'Amro', role: 'donor' };
    const q = makeQuery({ data: profile, error: null });
    from.mockReturnValue(q);
    await expect(getProfile('u1')).resolves.toEqual(profile);
    expect(from).toHaveBeenCalledWith('profiles');
    expect(q.eq).toHaveBeenCalledWith('id', 'u1');
  });

  test('throws on error', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: { message: 'no profile' } }));
    await expect(getProfile('u1')).rejects.toThrow('no profile');
  });
});

describe('updateProfile', () => {
  test('updates the row and returns the fresh profile', async () => {
    const updated = { display_name: 'New Name', role: 'donor' };
    const q = makeQuery({ data: updated, error: null });
    from.mockReturnValue(q);
    await expect(updateProfile('u1', { display_name: 'New Name' })).resolves.toEqual(updated);
    expect(q.update).toHaveBeenCalledWith({ display_name: 'New Name' });
    expect(q.eq).toHaveBeenCalledWith('id', 'u1');
  });

  test('throws on error', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: { message: 'blocked' } }));
    await expect(updateProfile('u1', {})).rejects.toThrow('blocked');
  });
});

describe('searchDonors', () => {
  test('passes blood group, governorate and city to the RPC', async () => {
    const matches = [{ id: 'd1', blood_group: 'O-' }];
    rpc.mockResolvedValue({ data: matches, error: null });
    await expect(searchDonors('O-', 'Cairo', 'Maadi')).resolves.toEqual(matches);
    expect(rpc).toHaveBeenCalledWith('search_donors', {
      p_blood_group: 'O-',
      p_governorate: 'Cairo',
      p_city: 'Maadi',
    });
  });

  test('returns an empty array when no donors match', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(searchDonors('O-', 'Cairo', null)).resolves.toEqual([]);
  });

  test('throws on error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });
    await expect(searchDonors('O-', 'Cairo', null)).rejects.toThrow('rpc failed');
  });
});

describe('uploadAvatar', () => {
  const mockFetch = (buffer = new ArrayBuffer(8)) => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ arrayBuffer: () => Promise.resolve(buffer) }) as unknown as typeof fetch;
  };

  test('uploads the picked file to the avatars bucket and returns its public url', async () => {
    mockFetch();
    const upload = jest.fn(() => Promise.resolve({ error: null }));
    const getPublicUrl = jest.fn(() => ({ data: { publicUrl: 'https://cdn/u1/pic.png' } }));
    storageFrom.mockReturnValue({ upload, getPublicUrl });

    await expect(uploadAvatar('u1', 'file:///tmp/pic.png')).resolves.toBe('https://cdn/u1/pic.png');
    expect(storageFrom).toHaveBeenCalledWith('avatars');
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^u1\/\d+\.png$/),
      expect.any(ArrayBuffer),
      expect.objectContaining({ contentType: 'image/png', upsert: true }),
    );
  });

  test('throws when the upload fails', async () => {
    mockFetch();
    storageFrom.mockReturnValue({
      upload: jest.fn(() => Promise.resolve({ error: { message: 'too large' } })),
      getPublicUrl: jest.fn(),
    });
    await expect(uploadAvatar('u1', 'file:///tmp/pic.png')).rejects.toThrow('too large');
  });
});

describe('savePushToken', () => {
  test('writes the token to the profile row', async () => {
    const q = makeQuery({ data: null, error: null });
    from.mockReturnValue(q);
    await savePushToken('u1', 'ExponentPushToken[abc]');
    expect(from).toHaveBeenCalledWith('profiles');
    expect(q.update).toHaveBeenCalledWith({ push_token: 'ExponentPushToken[abc]' });
    expect(q.eq).toHaveBeenCalledWith('id', 'u1');
  });

  test('throws on error', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: { message: 'blocked' } }));
    await expect(savePushToken('u1', 't')).rejects.toThrow('blocked');
  });
});
