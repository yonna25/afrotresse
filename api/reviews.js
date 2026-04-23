// api/reviews.js — AfroTresse
// GET  → avis approuvés (affichage public)
// POST → soumettre un nouvel avis (pending modération)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASEE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Rate limit simple en mémoire (anti-spam soumissions)
const submitRateMap = new Map()
function checkSubmitRate(ip) {
  const now   = Date.now()
  const entry = submitRateMap.get(ip) || { count: 0, start: now }
  if (now - entry.start > 60 * 60 * 1000) {
    submitRateMap.set(ip, { count: 1, start: now })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  submitRateMap.set(ip, entry)
  return true
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://afrotresse.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── GET — Récupérer les avis approuvés ───────────────────────────────────
  if (req.method === 'GET') {
    const limit  = Math.min(parseInt(req.query.limit  || '20', 10), 50)
    const minRating = parseInt(req.query.minRating || '1', 10)

    const { data, error } = await supabase
      .from('reviews')
      .select('id, name, rating, comment, photo_url, is_verified, created_at')
      .eq('is_approved', true)
      .gte('rating', minRating)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[reviews GET]', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }

    return res.status(200).json({ reviews: data || [] })
  }

  // ── POST — Soumettre un nouvel avis ──────────────────────────────────────
  if (req.method === 'POST') {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
    if (!checkSubmitRate(ip)) {
      return res.status(429).json({ error: 'Trop de soumissions. Réessaie plus tard.' })
    }

    const { name, rating, comment, photo_url } = req.body || {}

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Prénom requis (2 caractères min.)' })
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Note entre 1 et 5 requise' })
    }
    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Commentaire trop long (500 car. max)' })
    }

    const { error } = await supabase
      .from('reviews')
      .insert([{
        name:        name.trim().slice(0, 50),
        rating:      Number(rating),
        comment:     comment?.trim().slice(0, 500) || null,
        photo_url:   photo_url || null,
        is_approved: false,
        is_verified: false,
      }])

    if (error) {
      console.error('[reviews POST]', error)
      return res.status(500).json({ error: 'Erreur enregistrement' })
    }

    return res.status(201).json({ success: true, message: 'Avis reçu, en attente de modération.' })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
