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

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, photo_url, role, status, blood_group, governorate, city, is_searchable')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data as Profile | null;
};
