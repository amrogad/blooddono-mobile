import { getProfile, updateProfile, searchDonors } from '@/services/profileService';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

const rpc = supabase.rpc as jest.Mock;
const from = supabase.from as jest.Mock;

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
