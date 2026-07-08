import { supabase } from '@/services/supabase';

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

export type ProfileUpdate = {
  display_name?: string;
  blood_group?: string;
  governorate?: string;
  city?: string;
  is_searchable?: boolean;
  photo_url?: string;
};

export const updateProfile = async (userId: string, updates: ProfileUpdate): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('display_name, photo_url, role, status, blood_group, governorate, city, is_searchable')
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
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

export const uploadAvatar = async (userId: string, uri: string): Promise<string> => {
  const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
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

export const savePushToken = async (userId: string, token: string): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
  if (error) throw new Error(error.message);
};
