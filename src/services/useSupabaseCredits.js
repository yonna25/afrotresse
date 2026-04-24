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

// RÉPARATION : Recuperer le solde depuis 'usage_credits'
export async function getSupabaseCredits(userId) {
  if (!userId) return 0;
  const { data, error } = await supabase
    .from('usage_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) return 0
  return data?.credits || 0
}

// RÉPARATION : Ajouter des credits après paiement dans 'usage_credits'
export async function addSupabaseCredits(userId, amount) {
  const current = await getSupabaseCredits(userId)
  const { error } = await supabase
    .from('usage_credits')
    .upsert({ 
      user_id: userId, 
      credits: current + amount, 
      updated_at: new Date() 
    }, { onConflict: 'user_id' })
    
  if (error) throw error
  return current + amount
}

// RÉPARATION : Consommer 1 credit (Optionnel car l'API s'en occupe aussi)
export async function useSupabaseCredit(userId) {
  const current = await getSupabaseCredits(userId)
  if (current <= 0) return false
  const { error } = await supabase
    .from('usage_credits')
    .update({ credits: current - 1 })
    .eq('user_id', userId)
    
  if (error) return false
  return true
}

// RÉPARATION : Initialisation correcte de l'utilisateur
export async function ensureUserExists(userId, email) {
  // On vérifie si l'utilisateur a déjà une ligne de crédits
  const { data } = await supabase
    .from('usage_credits')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) {
    // Si nouveau, on lui crée sa ligne avec 0 crédit (ou tes crédits offerts)
    await supabase.from('usage_credits').insert({ 
      user_id: userId, 
      credits: 0 
    })
  }
}
