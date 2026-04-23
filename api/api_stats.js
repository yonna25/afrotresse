// api/stats.js — AfroTresse
// POST → incrémenter une stat (view / like / download / share)
// GET  → récupérer les stats d'un style
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASEE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET — stats d'un style ───────────────────────────────────────────────
  if (req.method === 'GET') {
    const { styleId } = req.query
    if (!styleId) return res.status(400).json({ error: 'styleId requis' })

    const { data, error } = await supabase
      .from('style_stats')
      .select('views, likes, downloads, shares')
      .eq('style_id', styleId)
      .maybeSingle()

    if (error) return res.status(500).json({ error: 'Erreur serveur' })
    return res.status(200).json(data || { views: 0, likes: 0, downloads: 0, shares: 0 })
  }

  // ── POST — incrémenter une stat ──────────────────────────────────────────
  if (req.method === 'POST') {
    const { styleId, action } = req.body || {}

    const allowed = ['views', 'likes', 'downloads', 'shares']
    if (!styleId || !allowed.includes(action)) {
      return res.status(400).json({ error: 'styleId et action (views/likes/downloads/shares) requis' })
    }

    // Upsert : crée la ligne si elle n'existe pas, sinon incrémente
    const { error } = await supabase.rpc('increment_style_stat', {
      p_style_id: styleId,
      p_column:   action,
    })

    if (error) {
      // Fallback si la fonction RPC n'existe pas encore
      const { data: existing } = await supabase
        .from('style_stats')
        .select('*')
        .eq('style_id', styleId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('style_stats')
          .update({ [action]: (existing[action] || 0) + 1, updated_at: new Date().toISOString() })
          .eq('style_id', styleId)
      } else {
        await supabase
          .from('style_stats')
          .insert([{ style_id: styleId, [action]: 1 }])
      }
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
