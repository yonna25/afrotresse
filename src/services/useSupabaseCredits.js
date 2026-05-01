import { supabase } from './supabase.js';

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSupabaseCredits = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  
  if (error) return 0;
  return data.credits;
};

export const ensureUserExists = async (user) => {
  if (!user) return;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
  if (error) console.error("Erreur lors de l'upsert du profil:", error);
};

// LA FONCTION QUI MANQUAIT
export const addSupabaseCredits = async (userId, amount) => {
  const { data, error } = await supabase.rpc('increment_credits', { 
    user_id: userId, 
    amount: amount 
  });
  if (error) {
    // Fallback si la fonction RPC n'existe pas encore sur ton Supabase
    const current = await getSupabaseCredits(userId);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: current + amount })
      .eq('id', userId);
    return !updateError;
  }
  return true;
};
