import {
  getPendingRequests,
  getMyRequests,
  getRequestDetails,
  acceptRequest,
  createDonationRequest,
} from '@/services/donationService';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

const rpc = supabase.rpc as jest.Mock;
const from = supabase.from as jest.Mock;

type QueryMock = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  then: (resolve: (v: unknown) => void) => void;
};

function makeQuery(result: { data: unknown; error: unknown }): QueryMock {
  const q = {} as QueryMock;
  q.select = jest.fn(() => q);
  q.insert = jest.fn(() => q);
  q.update = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.single = jest.fn(() => q);
  q.then = (resolve: (v: unknown) => void) => resolve(result);
  return q;
}

beforeEach(() => jest.clearAllMocks());

describe('getPendingRequests', () => {
  test('calls the get_pending_requests RPC and returns the rows', async () => {
    const rows = [{ id: '1', recipient_name: 'A' }];
    rpc.mockResolvedValue({ data: rows, error: null });
    await expect(getPendingRequests()).resolves.toEqual(rows);
    expect(rpc).toHaveBeenCalledWith('get_pending_requests');
  });

  test('returns an empty array when the RPC yields null', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(getPendingRequests()).resolves.toEqual([]);
  });

  test('throws the error message on failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(getPendingRequests()).rejects.toThrow('boom');
  });
});

describe('getMyRequests', () => {
  test('queries the caller rows newest-first and returns them', async () => {
    const rows = [{ id: '1' }];
    const q = makeQuery({ data: rows, error: null });
    from.mockReturnValue(q);
    await expect(getMyRequests('user-1')).resolves.toEqual(rows);
    expect(from).toHaveBeenCalledWith('blood_donation_requests');
    expect(q.eq).toHaveBeenCalledWith('requester_id', 'user-1');
    expect(q.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('throws on query error', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: { message: 'nope' } }));
    await expect(getMyRequests('user-1')).rejects.toThrow('nope');
  });
});

describe('getRequestDetails', () => {
  test('returns the first row from the details RPC', async () => {
    rpc.mockResolvedValue({ data: [{ id: '9' }], error: null });
    await expect(getRequestDetails('9')).resolves.toEqual({ id: '9' });
    expect(rpc).toHaveBeenCalledWith('get_request_details', { p_id: '9' });
  });

  test('returns null when the RPC yields no rows', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(getRequestDetails('9')).resolves.toBeNull();
  });
});

describe('acceptRequest', () => {
  test('calls accept_request with the request id', async () => {
    rpc.mockResolvedValue({ error: null });
    await acceptRequest('req-1');
    expect(rpc).toHaveBeenCalledWith('accept_request', { request_id: 'req-1' });
  });

  test('throws when the RPC returns an error', async () => {
    rpc.mockResolvedValue({ error: { message: 'already taken' } });
    await expect(acceptRequest('req-1')).rejects.toThrow('already taken');
  });
});

describe('createDonationRequest', () => {
  const input = { requester_id: 'u1', recipient_name: 'B' } as never;

  test('inserts the request and returns the created row', async () => {
    const q = makeQuery({ data: { id: 'new' }, error: null });
    from.mockReturnValue(q);
    await expect(createDonationRequest(input)).resolves.toEqual({ id: 'new' });
    expect(from).toHaveBeenCalledWith('blood_donation_requests');
    expect(q.insert).toHaveBeenCalledWith(input);
  });

  test('throws when the insert fails', async () => {
    from.mockReturnValue(makeQuery({ data: null, error: { message: 'duplicate' } }));
    await expect(createDonationRequest(input)).rejects.toThrow('duplicate');
  });
});
