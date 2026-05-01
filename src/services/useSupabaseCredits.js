import { supabase } from './supabase.js'

// ── Fingerprint device (persisté en localStorage) ────────────────────────────
export function getOrCreateFingerprint() {
  let fp = localStorage.getItem('afrotresse_fingerprint')
  if (!fp) {
    fp = 'fp_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36)
    localStorage.setItem('afrotresse_fingerprint', fp)
  }
  return fp
}

// ── Magic Link ────────────────────────────────────────────────────────────────
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/credits` }
  })
  if (error) throw error
  return true
}

// ── Utilisateur connecté ──────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Récupérer les crédits (par user_id, email ou fingerprint) ─────────────────
export async function getSupabaseCredits(userId) {
  if (!userId) return 0
  const { data, error } = await supabase
    .from('usage_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return 0
  return data?.credits || 0
}

// ── Ajouter des crédits ───────────────────────────────────────────────────────
export async function addSupabaseCredits(userId, amount) {
  const current = await getSupabaseCredits(userId)
  const { error } = await supabase
    .from('usage_credits')
    .upsert(
      { user_id: userId, credits: current + amount, updated_at: new Date() },
      { onConflict: 'user_id' }
    )
  if (error) throw error
  return current + amount
}

// ── Consommer 1 crédit ────────────────────────────────────────────────────────
export async function useSupabaseCredit(userId) {
  const current = await getSupabaseCredits(userId)
  if (current <= 0) return false
  const { error } = await supabase
    .from('usage_credits')
    .update({ credits: current - 1, updated_at: new Date() })
    .eq('user_id', userId)
  if (error) return false
  return true
}

// ── CŒUR DU SYSTÈME — ensureUserExists avec fusion email + fingerprint ────────
//
// Priorité de récupération des crédits :
//   1. Ligne existante avec ce user_id             → rien à faire
//   2. Ligne existante avec cet email              → on transfère au nouveau user_id
//   3. Ligne existante avec ce fingerprint         → on transfère au nouveau user_id
//   4. Aucune ligne trouvée                        → on crée avec 0 crédit
//
export async function ensureUserExists(userId, email) {
  const fingerprint = getOrCreateFingerprint()

  // 1. Ligne déjà liée à ce user_id ?
  const { data: byUserId } = await supabase
    .from('usage_credits')
    .select('id, credits, email, fingerprint')
    .eq('user_id', userId)
    .maybeSingle()

  if (byUserId) {
    // Enrichir avec email/fingerprint si manquants
    const updates = {}
    if (email && !byUserId.email)           updates.email       = email.toLowerCase()
    if (fingerprint && !byUserId.fingerprint) updates.fingerprint = fingerprint
    if (Object.keys(updates).length > 0) {
      await supabase.from('usage_credits').update(updates).eq('user_id', userId)
    }
    return byUserId.credits
  }

  // 2. Ligne existante avec cet email ?
  if (email) {
    const { data: byEmail } = await supabase
      .from('usage_credits')
      .select('id, credits, fingerprint')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (byEmail) {
      // Fusion : on transfère les crédits vers le nouveau user_id
      await supabase
        .from('usage_credits')
        .update({
          user_id:     userId,
          fingerprint: fingerprint || byEmail.fingerprint,
          updated_at:  new Date(),
        })
        .eq('id', byEmail.id)

      return byEmail.credits
    }
  }

  // 3. Ligne existante avec ce fingerprint ?
  const { data: byFp } = await supabase
    .from('usage_credits')
    .select('id, credits, email')
    .eq('fingerprint', fingerprint)
    .maybeSingle()

  if (byFp) {
    // Fusion : on attache le user_id et l'email à cette ligne
    await supabase
      .from('usage_credits')
      .update({
        user_id:    userId,
        email:      email ? email.toLowerCase() : byFp.email,
        updated_at: new Date(),
      })
      .eq('id', byFp.id)

    return byFp.credits
  }

  // 4. Aucune ligne → créer
  await supabase.from('usage_credits').insert({
    user_id:     userId,
    email:       email ? email.toLowerCase() : null,
    fingerprint: fingerprint,
    credits:     0,
    created_at:  new Date(),
    updated_at:  new Date(),
  })

  return 0
}

// ── Récupérer les crédits par fingerprint seul (utilisatrice anonyme) ─────────
export async function getCreditsByFingerprint() {
  const fingerprint = getOrCreateFingerprint()
  const { data } = await supabase
    .from('usage_credits')
    .select('credits')
    .eq('fingerprint', fingerprint)
    .maybeSingle()
  return data?.credits || 0
}

// ── Créer/récupérer une ligne anonyme par fingerprint ─────────────────────────
export async function ensureAnonymousCredits() {
  const fingerprint = getOrCreateFingerprint()

  const { data: existing } = await supabase
    .from('usage_credits')
    .select('id, credits')
    .eq('fingerprint', fingerprint)
    .is('user_id', null)
    .maybeSingle()

  if (existing) return existing.credits

  await supabase.from('usage_credits').insert({
    fingerprint,
    user_id:    null,
    email:      null,
    credits:    0,
    created_at: new Date(),
    updated_at: new Date(),
  })

  return 0
}
