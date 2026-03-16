import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brown pattern-overlay flex flex-col overflow-hidden">
      {/* Decorative top arc */}
      <div className="absolute top-0 left-0 right-0 h-72 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 390 280" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id="topGlow" cx="50%" cy="0%" r="60%">
              <stop offset="0%" stopColor="#5C3317" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#2C1A0E" stopOpacity="0"/>
            </radialGradient>
            <pattern id="adinkra" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="6" fill="none" stroke="#C9963A" strokeWidth="0.5" opacity="0.3"/>
              <line x1="20" y1="8" x2="20" y2="14" stroke="#C9963A" strokeWidth="0.5" opacity="0.3"/>
              <line x1="20" y1="26" x2="20" y2="32" stroke="#C9963A" strokeWidth="0.5" opacity="0.3"/>
              <line x1="8"  y1="20" x2="14" y2="20" stroke="#C9963A" strokeWidth="0.5" opacity="0.3"/>
              <line x1="26" y1="20" x2="32" y2="20" stroke="#C9963A" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="390" height="280" fill="url(#adinkra)"/>
          <rect width="390" height="280" fill="url(#topGlow)"/>
          <ellipse cx="195" cy="-40" rx="220" ry="160" fill="#5C3317" opacity="0.25"/>
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-14 pb-2">
        <Logo />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-full px-3 py-1.5"
        >
          <span className="text-goldLight text-xs font-body">✦ Bêta gratuite</span>
        </motion.div>
      </div>

      {/* Hero illustration */}
      <div className="relative z-10 flex justify-center mt-4">
        <HeroIllustration />
      </div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 px-8 mt-6 text-center"
      >
        <h1 className="font-display text-3xl text-cream leading-tight">
          Trouve ta{' '}
          <span className="shimmer-text">tresse parfaite</span>
        </h1>
        <div className="gold-divider mt-4" />
        <p className="font-body text-warm text-sm leading-relaxed mt-3 max-w-xs mx-auto">
          Analyse ton visage en quelques secondes et reçois des recommandations personnalisées parmi les plus beaux styles africains.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 180 }}
        className="relative z-10 px-8 mt-8"
      >
        <button
          onClick={() => navigate('/camera')}
          className="btn-gold w-full text-lg animate-pulse-gold"
        >
          📸 Prendre un selfie
        </button>

        <button
          onClick={() => navigate('/library')}
          className="btn-outline w-full mt-3 text-sm"
        >
          Parcourir les styles
        </button>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 mt-8 mx-6 mb-28 glass rounded-2xl px-4 py-4 flex justify-around"
      >
        {[['50+', 'Styles'], ['10k+', 'Analyses'], ['98%', 'Satisfaction']].map(([val, label]) => (
          <div key={label} className="text-center">
            <p className="font-display text-xl text-gold">{val}</p>
            <p className="font-body text-warm text-xs">{label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="flex items-center gap-2"
    >
      <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
        <span className="text-sm">🌿</span>
      </div>
      <span className="font-display text-xl text-cream">Afro<span className="text-gold">Tresse</span></span>
    </motion.div>
  )
}

function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
      className="relative w-52 h-52"
    >
      {/* Rotating outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-dashed border-gold/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner glow */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-mid to-brown"
        style={{ boxShadow: '0 0 40px rgba(201,150,58,0.15)' }} />

      {/* Woman silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 120 160" className="w-32 h-40">
          <defs>
            <radialGradient id="skinGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#8B5E3C"/>
              <stop offset="100%" stopColor="#5C3317"/>
            </radialGradient>
          </defs>
          {/* Neck + body */}
          <rect x="48" y="90" width="24" height="20" rx="4" fill="url(#skinGrad)"/>
          <ellipse cx="60" cy="120" rx="32" ry="16" fill="#2C1A0E"/>
          {/* Head */}
          <ellipse cx="60" cy="65" rx="28" ry="32" fill="url(#skinGrad)"/>
          {/* Braids */}
          {[-24,-14,-6,0,6,14,24].map((x, i) => (
            <motion.line
              key={i}
              x1={60 + x} y1={33}
              x2={60 + x * 1.4} y2={i % 2 === 0 ? 10 : 5}
              stroke="#C9963A"
              strokeWidth={i % 3 === 0 ? 3 : 2}
              strokeLinecap="round"
              animate={{ y2: [i % 2 === 0 ? 10 : 5, i % 2 === 0 ? 6 : 2, i % 2 === 0 ? 10 : 5] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
            />
          ))}
          {/* Eyes */}
          <ellipse cx="50" cy="62" rx="4" ry="4.5" fill="#2C1A0E"/>
          <ellipse cx="70" cy="62" rx="4" ry="4.5" fill="#2C1A0E"/>
          <circle cx="51" cy="60.5" r="1.5" fill="#FAF4EC"/>
          <circle cx="71" cy="60.5" r="1.5" fill="#FAF4EC"/>
          {/* Smile */}
          <path d="M52 75 Q60 82 68 75" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round"/>
          {/* Earrings */}
          <circle cx="32" cy="72" r="3" fill="none" stroke="#C9963A" strokeWidth="1.5"/>
          <circle cx="88" cy="72" r="3" fill="none" stroke="#C9963A" strokeWidth="1.5"/>
        </svg>
      </div>

      {/* Gold dots on ring */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gold"
          style={{
            top:  `${50 - 47 * Math.cos((deg * Math.PI) / 180)}%`,
            left: `${50 + 47 * Math.sin((deg * Math.PI) / 180)}%`,
            transform: 'translate(-50%,-50%)',
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.33 }}
        />
      ))}
    </motion.div>
  )
}
