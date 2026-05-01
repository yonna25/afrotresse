import { supabase } from './supabase.js'

/**
 * Synchronise les crédits avec le serveur (Double Ancre : Email + Fingerprint)
 * Appelle la fonction SQL sécurisée pour fusionner les sessions anonymes et connectées.
 */
export async function syncCreditsWithServer(email = null, fingerprint = null) {
  try {
    // Nettoyage de l'email pour éviter les erreurs de doublons
    const cleanEmail = email?.trim().toLowerCase() || null;
    const fp = fingerprint || localStorage.getItem('afrotresse_fingerprint');

    // Appel de la Database Function (RPC) - Sécurité côté serveur
    const { data, error } = await supabase.rpc('sync_user_credits_secure', {
      p_email: cleanEmail,
      p_fingerprint: fp
    });

    if (error) throw error;

    // Le serveur renvoie un tableau contenant le solde (res_credits)
    const balance = data[0]?.res_credits ?? 0;
    
    // Mise à jour locale du cache pour l'UI
    localStorage.setItem('afrotresse_credits', balance.toString());
    
    return balance;
  } catch (err) {
    console.error('Erreur lors de la synchronisation des crédits:', err);
    // En cas d'erreur, on retourne le solde local par défaut
    return parseInt(localStorage.getItem('afrotresse_credits') || '0', 10);
  }
}

/**
 * Génère ou récupère l'identifiant unique du navigateur (Fingerprint)
 * Assure la persistance des crédits pour les utilisatrices anonymes.
 */
export function getOrCreateFingerprint() {
  let fp = localStorage.getItem('afrotresse_fingerprint');
  
  if (!fp) {
    // Génération d'un identifiant aléatoire sécurisé
    fp = `fp_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem('afrotresse_fingerprint', fp);
  }
  
  return fp;
}

/**
 * Récupère les informations de l'utilisateur actuellement connecté via Supabase Auth.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/**
 * Récupère le solde actuel stocké en base de données pour un user_id spécifique.
 * Utile pour les rafraîchissements rapides de l'interface.
 */
export async function getSupabaseCredits(userId) {
  const { data, error } = await supabase
    .from('usage_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return 0;
  return data?.credits ?? 0;
}
