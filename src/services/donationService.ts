import { supabase } from '@/services/supabase';

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

export type MyRequest = {
  id: string;
  recipient_name: string;
  recipient_governorate: string;
  recipient_city: string;
  blood_group: string;
  donation_date: string;
  donation_time: string;
  donation_status: 'pending' | 'inprogress' | 'done' | 'canceled';
};

export const getPendingRequests = async (): Promise<PendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_requests');
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingRequest[];
};

export const getMyRequests = async (userId: string): Promise<MyRequest[]> => {
  const { data, error } = await supabase
    .from('blood_donation_requests')
    .select(
      'id, recipient_name, recipient_governorate, recipient_city, blood_group, donation_date, donation_time, donation_status',
    )
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MyRequest[];
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
