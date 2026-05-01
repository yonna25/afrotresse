import { supabase } from './supabase.js';

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

/**
 * Récupère le solde de crédits depuis la table 'profiles' de Supabase
 */
export const getSupabaseCredits = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error("Erreur lors de la récupération des crédits:", error);
    return 0;
  }
  return data.credits || 0;
};

/**
 * S'assure que l'utilisateur existe dans la table 'profiles' (Upsert)
 */
export const ensureUserExists = async (user) => {
  if (!user) return;
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: user.email }, 
      { onConflict: 'id' }
    );
  if (error) console.error("Erreur lors de l'enregistrement du profil:", error);
};

/**
 * AJOUTE des crédits (via RPC ou Update direct)
 * C'est cette fonction qui manquait à l'export !
 */
export const addSupabaseCredits = async (userId, amount) => {
  // Tentative via une fonction RPC pour la sécurité atomique
  const { data, error } = await supabase.rpc('increment_credits', { 
    user_id: userId, 
    amount: amount 
  });
  
  if (error) {
    // Fallback : Update classique si le RPC n'est pas configuré
    const current = await getSupabaseCredits(userId);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: current + amount })
      .eq('id', userId);
    
    return !updateError;
  }
  return true;
};
