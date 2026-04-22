// src/components/ReviewsCarousel.jsx — AfroTresse
// Carousel d'avis approuvés — utilisable partout dans l'app
// Props :
//   minRating   {number}  — note minimale à afficher (défaut 4)
//   limit       {number}  — nombre max d'avis (défaut 12)
//   title       {string}  — titre affiché (optionnel)
//   compact     {boolean} — version courte pour les pages de résultat
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApprovedReviews } from '../services/reviews.js'

// ── Étoiles statiques ────────────────────────────────────────────────────────
function Stars({ rating, size = 'sm' }) {
  const s = size === 'lg' ? 'text-xl' : 'text-sm'
  return (
    <span className={s}>
      {'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

// ── Card avis individuelle ────────────────────────────────────────────────────
function ReviewCard({ review, compact }) {
  return (
    <div
      className={`flex-shrink-0 ${compact ? 'w-64' : 'w-72'} rounded-3xl p-5 flex flex-col gap-3`}
      style={{
        background: 'linear-gradient(145deg, rgba(201,150,58,0.08), rgba(255,255,255,0.03))',
        border: '1px solid rgba(201,150,58,0.2)',
      }}
    >
      {/* Header : photo + prénom + badge */}
      <div className="flex items-center gap-3">
        {review.photo_url ? (
          <img
            src={review.photo_url}
            alt={review.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#C9963A]/30"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black text-[#1A0A00]"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
          >
            {review.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[#FAF4EC] font-bold text-sm truncate">{review.name}</p>
            {review.is_verified && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(201,150,58,0.2)', color: '#C9963A' }}
              >
                ✓ Vérifié
              </span>
            )}
          </div>
          <Stars rating={review.rating} />
        </div>
      </div>

      {/* Commentaire */}
      {review.comment && (
        <p className="text-[#FAF4EC]/70 text-xs leading-relaxed line-clamp-3">
          "{review.comment}"
        </p>
      )}

      {/* Date */}
      <p className="text-white/20 text-[10px] mt-auto">
        {new Date(review.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}

// ── Skeleton loading ─────────────────────────────────────────────────────────
function ReviewSkeleton() {
  return (
    <div className="flex-shrink-0 w-72 rounded-3xl p-5 flex flex-col gap-3 opacity-40"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-3 bg-white/10 rounded-full w-24" />
          <div className="h-2 bg-white/10 rounded-full w-16" />
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full" />
      <div className="h-2 bg-white/10 rounded-full w-3/4" />
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ReviewsCarousel({
  minRating = 4,
  limit     = 12,
  title     = 'Ce qu'elles disent 💛',
  compact   = false,
}) {
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const scrollRef = useRef()

  useEffect(() => {
    getApprovedReviews({ limit, minRating })
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [limit, minRating])

  // Auto-scroll infini doux
  useEffect(() => {
    if (!reviews.length || loading) return
    const el = scrollRef.current
    if (!el) return
    let frame
    let pos = 0
    const speed = 0.4 // px/frame
    const scroll = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      frame = requestAnimationFrame(scroll)
    }
    frame = requestAnimationFrame(scroll)
    const pause  = () => cancelAnimationFrame(frame)
    const resume = () => { frame = requestAnimationFrame(scroll) }
    el.addEventListener('mouseenter',  pause)
    el.addEventListener('mouseleave',  resume)
    el.addEventListener('touchstart',  pause,  { passive: true })
    el.addEventListener('touchend',    resume, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend',   resume)
    }
  }, [reviews, loading])

  if (!loading && reviews.length === 0) return null

  // Dupliquer pour le scroll infini
  const items = [...reviews, ...reviews]

  return (
    <section className="py-6">
      {title && (
        <h2 className="text-[#C9963A] font-black text-xl px-6 mb-4">{title}</h2>
      )}

      {/* Note globale */}
      {!loading && reviews.length > 0 && (
        <div className="px-6 mb-4 flex items-center gap-3">
          <span className="text-3xl font-black text-[#FAF4EC]">
            {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
          </span>
          <div>
            <Stars rating={Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)} size="lg" />
            <p className="text-white/40 text-xs mt-0.5">{reviews.length} avis</p>
          </div>
        </div>
      )}

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <ReviewSkeleton key={i} />)
          : items.map((review, i) => (
              <ReviewCard key={`${review.id}-${i}`} review={review} compact={compact} />
            ))
        }
      </div>
    </section>
  )
}
