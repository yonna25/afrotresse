import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '../hooks/useProfile.js'

// ─── Slides du carousel ──────────────────────────────────────────
// 📌 POUR REMPLACER PAR TES PROPRES PHOTOS :
//    1. Ajoute tes photos dans le dossier public/photos/
//    2. Remplace les URL Unsplash ci-dessous par '/photos/ta-photo.jpg'
const SLIDES = [
  {
    id: 1,
    image: '/Afrotresse1.jpg',
    style: 'Knotless Braids',
    badge: '⚡ TENDANCE #1',
    accent: '#C9963A',
  },
  {
    id: 2,
    image: '/Afrotresse2.jpg',
    style: 'Cornrows',
    badge: '🔥 POPULAIRE',
    accent: '#E8B96A',
  },
  {
    id: 3,
    image: '/Afrotresse3.jpg',
    style: 'Senegalese Twist',
    badge: '✨ COUP DE CŒUR',
    accent: '#C9963A',
  },
  {
    id: 4,
    image: '/Afrotresse4.jpg',
    style: 'Fulani Braids',
    badge: '👑 PREMIUM',
    accent: '#E8B96A',
  },
  {
    id: 5,
    image: '/Afrotresse5.jpg',
    style: 'Box Braids',
    badge: '💛 CLASSIQUE',
    accent: '#C9963A',
  },
]

const INTERVAL = 3500

export default function Home() {
  const navigate        = useNavigate()
  const { displayName } = useProfile()
  const [current, setCurrent] = useState(0)
  const [dir,     setDir]     = useState(1)
  const timerRef = useRef(null)

  const goTo = useCallback((idx, d = 1) => {
    setDir(d)
    setCurrent(idx)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, 1)
  }, [current, goTo])

  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [next])

  const touchStart = useRef(null)
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      clearInterval(timerRef.current)
      diff > 0
        ? goTo((current + 1) % SLIDES.length, 1)
        : goTo((current - 1 + SLIDES.length) % SLIDES.length, -1)
    }
    touchStart.current = null
  }

  const slide = SLIDES[current]

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-brown"
      style={{ height: '100dvh' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Hero images */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={slide.id}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image}
            alt={slide.style}
            className="w-full h-full object-cover object-top select-none"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient top */}
      <div className="absolute inset-x-0 top-0 h-52 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(44,26,14,0.6) 0%, transparent 100%)' }} />

      {/* Gradient bottom */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{ height: '58%', background: 'linear-gradient(to top, rgba(44,26,14,0.98) 0%, rgba(44,26,14,0.8) 45%, transparent 100%)' }} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 pt-12">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-xs">🌿</div>
          <span className="font-display text-lg text-cream">Afro<span className="text-gold">Tresse</span></span>
        </div>
        <button className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(92,51,23,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(201,150,58,0.2)' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-cream" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>

      {/* ── Contenu bas ────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-28">

        {/* Greeting */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`g-${current}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-body text-xs tracking-[0.2em] text-goldLight/80 uppercase mb-2">
              Bonjour 👋
            </p>
            <h1 className="font-display text-cream leading-[1.15]" style={{ fontSize: '1.85rem' }}>
              <span className="text-gold italic">{displayName},</span>
              <br />
              quelle tresse aujourd&apos;hui&nbsp;?
            </h1>
          </motion.div>
        </AnimatePresence>

        {/* Badge tendance */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`b-${current}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mt-4 inline-flex"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-body text-xs font-bold tracking-wide" style={{ color: slide.accent }}>
                {slide.badge}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="font-body text-xs text-cream/75">{slide.style}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination dots */}
        <div className="flex gap-1.5 mt-4 mb-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearInterval(timerRef.current); goTo(i, i >= current ? 1 : -1) }}
              style={{
                height: '4px',
                borderRadius: '2px',
                transition: 'all 0.35s ease',
                width: i === current ? '28px' : '8px',
                background: i === current ? '#C9963A' : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </div>

        {/* CTA principal */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          whileTap={{ scale: 0.975 }}
          onClick={() => navigate('/camera')}
          className="w-full flex items-center justify-between px-5 py-[14px] rounded-full font-display font-semibold text-brown"
          style={{
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #C9963A 0%, #E8B96A 55%, #C9963A 100%)',
            boxShadow: '0 6px 28px rgba(201,150,58,0.5)',
          }}
        >
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(44,26,14,0.18)' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </span>
            Prendre mon Selfie
          </span>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </motion.button>

        {/* Lien secondaire */}
        <button
          onClick={() => navigate('/library')}
          className="w-full text-center mt-3 font-body text-sm py-1"
          style={{ color: 'rgba(250,244,236,0.45)' }}
        >
          Parcourir les styles →
        </button>
      </div>
    </div>
  )
}
