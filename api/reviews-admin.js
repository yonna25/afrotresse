// api/reviews-admin.js — AfroTresse
// GET   → tous les avis (approuvés + en attente)
// PATCH → approuver ou rejeter un avis
// Protégé par ADMIN_SECRET (header x-admin-secret)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASEE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function checkAdmin(req) {
  const secret = req.headers['x-admin-secret']
  return secret && secret === process.env.ADMIN_SECRET
}

export default async function handler(req, res) {
  if (!checkAdmin(req)) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  // ── GET — tous les avis ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    const status = req.query.status // 'pending' | 'approved' | 'all'

    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (status === 'pending')  query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)

    const { data, error } = await query

    if (error) return res.status(500).json({ error: 'Erreur serveur' })
    return res.status(200).json({ reviews: data || [] })
  }

  // ── PATCH — approuver / rejeter / vérifier ───────────────────────────────
  if (req.method === 'PATCH') {
    const { id, action } = req.body || {}

    if (!id) return res.status(400).json({ error: 'id requis' })

    let update = {}
    if (action === 'approve')  update = { is_approved: true }
    if (action === 'reject')   update = { is_approved: false }
    if (action === 'verify')   update = { is_verified: true }
    if (action === 'unverify') update = { is_verified: false }
    if (action === 'delete') {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) return res.status(500).json({ error: 'Erreur suppression' })
      return res.status(200).json({ success: true })
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ error: 'action invalide (approve/reject/verify/delete)' })
    }

    const { error } = await supabase.from('reviews').update(update).eq('id', id)
    if (error) return res.status(500).json({ error: 'Erreur mise à jour' })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
