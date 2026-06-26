import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';


export const signIn = async (email: string, password: string): Promise<Session> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.session;
};


export const signOut= async () =>{
    await supabase.auth.signOut();
}

export const getSession= async () =>{
    const { data } = await supabase.auth.getSession();
    return data.session;
}

