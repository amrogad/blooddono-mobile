import { supabase } from '../lib/supabase';

export type BloodRequest = {
  id: string;
  requester_id: string;
  blood_group: string;
  units: number;
  urgency: string;
  hospital_name: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  status: string;
  created_at: string;
};

export type NewBloodRequest = {
  blood_group: string;
  units: number;
  urgency: string;
  hospital_name: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
};

export const listRequests = async (): Promise<BloodRequest[]> => {
  const { data, error } = await supabase
    .from('blood_donation_requests')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const createRequest = async (input: NewBloodRequest): Promise<BloodRequest> => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('blood_donation_requests')
    .insert({ ...input, requester_id: userId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};
