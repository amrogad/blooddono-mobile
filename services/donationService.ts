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

export type NewDonationRequest = {
  requester_id: string;
  requester_name: string;
  requester_email: string;
  recipient_name: string;
  recipient_governorate: string;
  recipient_city: string;
  hospital_name: string;
  full_address: string;
  blood_group: string;
  donation_date: string;
  donation_time: string;
  request_message: string;
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_requests');
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingRequest[];
};

export const createDonationRequest = async (input: NewDonationRequest) => {
  const { data, error } = await supabase
    .from('blood_donation_requests')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
