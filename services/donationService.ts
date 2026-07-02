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

export type RequestDetails = {
  id: string;
  recipient_name: string;
  recipient_governorate: string;
  recipient_city: string;
  hospital_name: string;
  full_address: string;
  blood_group: string;
  donation_date: string;
  donation_time: string;
  request_message: string;
  donation_status: 'pending' | 'inprogress' | 'done' | 'canceled';
  donor_id: string | null;
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_requests');
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingRequest[];
};

export const getRequestDetails = async (id: string): Promise<RequestDetails | null> => {
  const { data, error } = await supabase.rpc('get_request_details', { p_id: id });
  if (error) throw new Error(error.message);
  return (data?.[0] ?? null) as RequestDetails | null;
};

export const acceptRequest = async (id: string) => {
  const { error } = await supabase.rpc('accept_request', { request_id: id });
  if (error) throw new Error(error.message);
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
