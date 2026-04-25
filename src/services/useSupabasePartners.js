import { supabase } from './supabase.js'

// ── Récupérer tous les partenaires actifs (triés : sponsorisés en premier) ──
export async function getPartners() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('active', true)
    .order('sponsored', { ascending: false })
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

// ── Récupérer tous les partenaires (admin) ───────────────────────────────────
export async function getAllPartners() {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

// ── Créer un partenaire ──────────────────────────────────────────────────────
export async function createPartner(partner) {
  const { data, error } = await supabase
    .from('partners')
    .insert([partner])
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Mettre à jour un partenaire ──────────────────────────────────────────────
export async function updatePartner(id, updates) {
  const { data, error } = await supabase
    .from('partners')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Supprimer un partenaire ──────────────────────────────────────────────────
export async function deletePartner(id) {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// ── Activer / désactiver un partenaire ───────────────────────────────────────
export async function togglePartner(id, active) {
  return updatePartner(id, { active })
}
