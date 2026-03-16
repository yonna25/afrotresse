import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDES = [
  { id:1, image:'/Afrotresse1.jpg', style:'Knotless Braids', badge:'⚡ TENDANCE #1', accent:'#C9963A' },
  { id:2, image:'/Afrotresse2.jpg', style:'Box Braids',      badge:'🔥 POPULAIRE',   accent:'#E8B96A' },
  { id:3, image:'/Afrotresse3.jpg', style:'Cornrows',        badge:'✨ COUP DE CŒUR',accent:'#C9963A' },
  { id:4, image:'/Afrotresse4.jpg', style:'Fulani Braids',   badge:'👑 PREMIUM',     accent:'#E8B96A' },
  { id:5, image:'/Afrotresse5.jpg', style:'Senegalese Twist',badge:'💛 CLASSIQUE',   accent:'#C9963A' },
  { id:6, image:'/Afrotresse6.jpg', style:'Ghana Braids',    badge:'🌟 NOUVEAUTÉ',   accent:'#E8B96A' },
]

const INTERVAL = 3500

export default function Home() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [dir,     setDir]     = useState(1)
  const timerRef  = useRef(null)

  // Prénom depuis le profil
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine'

  const goTo = useCallback((idx, d=1) => { setDir(d); setCurrent(idx) }, [])
  const next  = useCallback(() => goTo((current+1) % SLIDES.length, 1), [current, goTo])

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
        ? goTo((current+1) % SLIDES.length, 1)
        : goTo((current-1+SLIDES.length) % SLIDES.length, -1)
    }
    touchStart.current = null
  }

  const slide    = SLIDES[current]
  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-brown"
      style={{ height:'100dvh' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Photos carousel ───────────────────────────────── */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={slide.id} custom={dir} variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration:0.65, ease:[0.32,0.72,0,1] }}
          className="absolute inset-0"
        >
          <img
            src={slide.image} alt={slide.style}
            className="w-full h-full object-cover object-top select-none"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Dégradé haut fort pour lisibilité logo ─────── */}
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none z-10"
        style={{ background:'linear-gradient(to bottom, rgba(44,26,14,0.85) 0%, rgba(44,26,14,0.4) 70%, transparent 100%)' }}/>

      {/* ── Dégradé bas ───────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10"
        style={{ height:'48%', background:'linear-gradient(to top, rgba(44,26,14,0.98) 0%, rgba(44,26,14,0.80) 50%, transparent 100%)' }}/>

      {/* ── LOGO + SLOGAN (fixe, ne défile pas) ──────────── */}
      <div className="absolute inset-x-0 top-0 z-30 px-5 pt-12">
        <div className="flex items-center justify-between">
          {/* Logo + slogan */}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background:'rgba(201,150,58,0.25)', border:'1px solid rgba(201,150,58,0.5)' }}>
                🌿
              </div>
              <span className="font-display text-2xl leading-none">
                <span className="text-cream font-bold">Afro</span><span style={{ color:'#C9963A' }} className="font-bold">Tresse</span>
              </span>
            </div>
            <p className="font-body text-xs tracking-widest ml-9"
              style={{ color:'rgba(232,185,106,0.75)', letterSpacing:'0.15em' }}>
              Trouve la tresse parfaite
            </p>
          </div>

          {/* Cloche notif */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(92,51,23,0.5)', backdropFilter:'blur(8px)', border:'1px solid rgba(201,150,58,0.2)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-cream" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── GREETING FIXE (ne défile pas) ────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-24">
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
        >
          {/* Bonjour */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
            style={{ background:'rgba(201,150,58,0.15)', border:'1px solid rgba(201,150,58,0.3)' }}>
            <span className="text-sm">👋</span>
            <span className="font-body text-xs font-semibold tracking-widest uppercase"
              style={{ color:'#E8B96A' }}>
              Bonjour
            </span>
          </div>

          {/* Prénom + question */}
          <h1 className="font-display text-cream leading-[1.2]" style={{ fontSize:'2rem' }}>
            <span style={{ color:'#C9963A' }} className="italic">{userName},</span>
            <br/>
            <span className="text-cream">quelle tresse</span>
            <br/>
            <span className="text-cream">aujourd&apos;hui&nbsp;?</span>
          </h1>
        </motion.div>

        {/* Badge tendance — change avec le slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`b-${current}`}
            initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:10 }} transition={{ duration:0.3 }}
            className="mt-4 inline-flex"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background:'rgba(255,255,255,0.07)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-body text-xs font-bold" style={{ color:slide.accent }}>
                {slide.badge}
              </span>
              <span className="w-px h-3 bg-white/20"/>
              <span className="font-body text-xs" style={{ color:'rgba(250,244,236,0.75)' }}>
                {slide.style}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots pagination */}
        <div className="flex gap-1.5 mt-4">
          {SLIDES.map((_,i) => (
            <button
              key={i}
              onClick={() => { clearInterval(timerRef.current); goTo(i, i>=current?1:-1) }}
              style={{
                height:'4px', borderRadius:'2px', transition:'all 0.35s ease',
                width: i===current ? '28px' : '8px',
                background: i===current ? '#C9963A' : 'rgba(255,255,255,0.28)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
