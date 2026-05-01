import { supabase } from './supabase.js'

// Envoyer magic link par email
export async function sendMagicLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/credits` }
  })
  if (error) throw error
  return true
}

// Recuperer l'utilisateur connecte
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Recuperer le solde de credits
export async function getSupabaseCredits(userId) {
  const { data, error } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .single()
  if (error) return 0
  return data?.balance || 0
}

// Ajouter des credits apres paiement
export async function addSupabaseCredits(userId, amount) {
  const current = await getSupabaseCredits(userId)
  const { error } = await supabase
    .from('credits')
    .upsert({ user_id: userId, balance: current + amount, updated_at: new Date() })
  if (error) throw error
  return current + amount
}

// Consommer 1 credit
export async function useSupabaseCredit(userId) {
  const current = await getSupabaseCredits(userId)
  if (current <= 0) return false
  const { error } = await supabase
    .from('credits')
    .upsert({ user_id: userId, balance: current - 1, updated_at: new Date() })
  if (error) return false
  return true
}

// Creer un user s'il n'existe pas encore
export async function ensureUserExists(userId, email) {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()
  if (!data) {
    await supabase.from('users').insert({ id: userId, email })
    await supabase.from('credits').insert({ user_id: userId, balance: 0 })
  }
}
