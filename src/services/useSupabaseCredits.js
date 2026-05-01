import { supabase } from './supabase.js'

/**
 * Synchronise les crédits avec le serveur (Double Ancre : Email + Fingerprint)
 * Cette fonction est "Atomic" et sécurisée côté serveur.
 */
export async function syncCreditsWithServer(email = null, fingerprint = null) {
  try {
    // On appelle la fonction RPC créée à l'étape 1
    const { data, error } = await supabase.rpc('sync_user_credits_secure', {
      p_email: email?.trim().toLowerCase() || null,
      p_fingerprint: fingerprint || localStorage.getItem('afrotresse_fingerprint') || null
    });

    if (error) throw error;

    // data[0].res_credits contient le solde renvoyé par le serveur
    return data[0]?.res_credits ?? 0;
  } catch (err) {
    console.error('Erreur syncCreditsWithServer:', err);
    return 0;
  }
}

/**
 * Récupère le fingerprint local ou en génère un nouveau
 */
export function getOrCreateFingerprint() {
  let fp = localStorage.getItem('afrotresse_fingerprint');
  if (!fp) {
    fp = `fp_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem('afrotresse_fingerprint', fp);
  }
  return fp;
}

/**
 * Note : La fonction addSupabaseCredits et ensureUserExists 
 * sont désormais gérées par syncCreditsWithServer pour plus de sécurité.
 */
