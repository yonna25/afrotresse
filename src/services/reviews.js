// src/services/reviews.js — AfroTresse
// Fonctions client pour le système d'avis
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Clé sessionStorage : popup déjà vue ──────────────────────────────────────
const KEY_POPUP_SEEN   = 'afrotresse_review_popup_seen'
const KEY_REVIEW_DONE  = 'afrotresse_review_submitted'

// ── Récupérer les avis approuvés ─────────────────────────────────────────────
export async function getApprovedReviews({ limit = 20, minRating = 1 } = {}) {
  try {
    const res = await fetch(`/api/reviews?limit=${limit}&minRating=${minRating}`)
    if (!res.ok) return []
    const { reviews } = await res.json()
    return reviews || []
  } catch {
    return []
  }
}

// ── Soumettre un avis ────────────────────────────────────────────────────────
export async function submitReview({ name, rating, comment, photo }) {
  let photo_url = null

  // Upload photo si fournie
  if (photo) {
    photo_url = await uploadReviewPhoto(photo)
  }

  const res = await fetch('/api/reviews', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, rating, comment, photo_url }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur envoi avis')

  // Marquer localement que l'avis a été soumis
  localStorage.setItem(KEY_REVIEW_DONE, '1')
  sessionStorage.setItem(KEY_POPUP_SEEN, '1')

  return data
}

// ── Upload photo vers Supabase Storage ───────────────────────────────────────
export async function uploadReviewPhoto(file) {
  try {
    const ext      = file.name.split('.').pop()
    const filename = `review_${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('reviews')
      .upload(filename, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from('reviews')
      .getPublicUrl(filename)

    return urlData?.publicUrl || null
  } catch {
    return null // photo optionnelle — on continue sans
  }
}

// ── Vérifier si la popup doit s'afficher ────────────────────────────────────
export function shouldShowReviewPopup() {
  if (sessionStorage.getItem(KEY_POPUP_SEEN)) return false
  if (localStorage.getItem(KEY_REVIEW_DONE))  return false
  return true
}

export function dismissReviewPopup() {
  sessionStorage.setItem(KEY_POPUP_SEEN, '1')
}

export function hasAlreadyReviewed() {
  return !!localStorage.getItem(KEY_REVIEW_DONE)
}
