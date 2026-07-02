import { supabase } from '../lib/supabase';

export type PendingRequest = {
  id: string;
  recipient_name: string;
  recipient_governorate: string;
  recipient_city: string;
  blood_group: string;
  donation_date: string;
  donation_time: string;
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_requests');
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingRequest[];
};
