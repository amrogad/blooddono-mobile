import { supabase } from '@/services/supabase';

export type Fund = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  amount: number;
  paid_at: string;
};

export const getFunds = async (): Promise<Fund[]> => {
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .order('paid_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Fund[];
};

export const getFundsTotal = async (): Promise<number> => {
  const { data, error } = await supabase.from('funds').select('amount');
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, f) => sum + Number(f.amount), 0);
};

export const createFund = async (fund: {
  user_id: string;
  name: string;
  email: string;
  amount: number;
}): Promise<Fund> => {
  const { data, error } = await supabase.from('funds').insert(fund).select().single();
  if (error) throw new Error(error.message);
  return data as Fund;
};
