import { supabase } from '../lib/supabase';

export type Profile = {
  display_name: string | null;
  photo_url: string | null;
  role: 'donor' | 'admin' | 'volunteer';
  status: 'active' | 'blocked';
  blood_group: string | null;
  governorate: string | null;
  city: string | null;
  is_searchable: boolean;
};

export type DonorMatch = {
  id: string;
  display_name: string | null;
  photo_url: string | null;
  blood_group: string;
  governorate: string;
  city: string;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, photo_url, role, status, blood_group, governorate, city, is_searchable')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data as Profile | null;
};

export const searchDonors = async (
  bloodGroup: string,
  governorate: string,
  city: string | null,
): Promise<DonorMatch[]> => {
  const { data, error } = await supabase.rpc('search_donors', {
    p_blood_group: bloodGroup,
    p_governorate: governorate,
    p_city: city,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as DonorMatch[];
};
