import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BraidCard from '../components/BraidCard.jsx'
import { useProfile } from '../hooks/useProfile.js'

const AVATARS = ['👩🏾','👩🏿','👩🏽','👸🏾','👸🏿','💁🏾‍♀️','💆🏾‍♀️','🧕🏾']

const LUXURY_STYLE = {
  pageBg: 'linear-gradient(160deg, #1A0A00 0%, #2C1A0E 40%, #1A0A00 100%)',
  cardBg: 'linear-gradient(145deg, rgba(60,35,15,0.9), rgba(30,15,5,0.95))',
  goldBorder: '1px solid rgba(201,150,58,0.5)',
  goldBorderBright: '2px solid rgba(232,185,106,0.7)',
  goldGlow: '0 0 20px rgba(201,150,58,0.3), 0 4px 24px rgba(0,0,0,0.5)',
  goldText: '#E8B96A',
  goldDark: '#C9963A',
  cream: '#FAF4EC',
  warm: 'rgba(250,244,236,0.65)',
}

// Texture SVG en filigrane
function LeatherTexture() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="leather" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20 Q10 10 20 20 Q30 30 40 20" fill="none" stroke="#C9963A" strokeWidth="0.5"/>
            <path d="M0 0 Q10 10 20 0 Q30-10 40 0" fill="none" stroke="#C9963A" strokeWidth="0.5"/>
            <path d="M0 40 Q10 30 20 40 Q30 50 40 40" fill="none" stroke="#C9963A" strokeWidth="0.5"/>
          </pattern>
          <pattern id="kente" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none"/>
            <line x1="0" y1="10" x2="20" y2="10" stroke="#C9963A" strokeWidth="0.3" opacity="0.5"/>
            <line x1="10" y1="0" x2="10" y2="20" stroke="#C9963A" strokeWidth="0.3" opacity="0.5"/>
            <rect x="8" y="8" width="4" height="4" fill="none" stroke="#E8B96A" strokeWidth="0.4" opacity="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#leather)"/>
        <rect width="100%" height="100%" fill="url(#kente)"/>
      </svg>
    </div>
  )
}

// Séparateur doré
function GoldDivider() {
  return (
    <div className="flex items-center gap-2 px-4 my-1">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #C9963A, transparent)' }}/>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9963A' }}/>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #C9963A, transparent)' }}/>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { name, displayName, setName, avatar, setAvatar } = useProfile()
  const [saved,       setSaved]       = useState([])
  const [tab,         setTab]         = useState(0)
  const [copied,      setCopied]      = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [showAvatars, setShowAvatars] = useState(false)

  const REFERRAL_CODE = useState(
    () => localStorage.getItem('afrotresse_ref') || (() => {
      const c = 'AFRO-' + Math.random().toString(36).substring(2,7).toUpperCase()
      localStorage.setItem('afrotresse_ref', c)
      return c
    })()
  )[0]

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('afrotresse_saved') || '[]')
    setSaved(s)
    setNameInput(name)
  }, [name])

  const handleSaveName = () => {
    if (nameInput.trim()) setName(nameInput.trim())
    setEditingName(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="min-h-screen pb-28 relative" style={{ background: LUXURY_STYLE.pageBg }}>
      <LeatherTexture />

      {/* ── Header ── */}
      <div className="relative overflow-hidden pt-12 pb-6 px-5">
        {/* Halo doré en arrière-plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full -translate-y-1/2 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,150,58,0.18) 0%, transparent 70%)' }}/>

        <div className="relative flex items-center gap-4">
          {/* Avatar avec cadre luxe */}
          <button onClick={() => setShowAvatars(!showAvatars)} className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl relative"
              style={{
                background: 'linear-gradient(145deg, #3C2310, #1A0A00)',
                border: '3px solid transparent',
                backgroundClip: 'padding-box',
                boxShadow: `0 0 0 2px #C9963A, 0 0 0 4px rgba(201,150,58,0.3), ${LUXURY_STYLE.goldGlow}`,
              }}>
              {avatar}
            </div>
            {/* Badge édition */}
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', boxShadow: '0 2px 8px rgba(201,150,58,0.5)', color: '#1A0A00' }}>
              ✏️
            </motion.div>
          </button>

          {/* Nom */}
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  placeholder="Ton prénom..."
                  className="flex-1 rounded-xl px-3 py-1.5 text-sm outline-none"
                  style={{ background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.5)', color: LUXURY_STYLE.cream }}
                  maxLength={20}
                />
                <button onClick={handleSaveName}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#1A0A00' }}>✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditingName(true); setNameInput(name) }} className="text-left">
                <p className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: LUXURY_STYLE.cream }}>
                  {displayName}
                  <span className="text-base" style={{ color: LUXURY_STYLE.goldDark }}>💎</span>
                </p>
                <p className="font-body text-xs mt-0.5 tracking-widest uppercase" style={{ color: LUXURY_STYLE.goldText }}>
                  Membre AfroTresse ✦
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        <AnimatePresence>
          {showAvatars && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative mt-4 overflow-hidden">
              <div className="flex gap-3 flex-wrap p-3 rounded-2xl"
                style={{ background: 'rgba(201,150,58,0.08)', border: LUXURY_STYLE.goldBorder }}>
                {AVATARS.map(a => (
                  <button key={a} onClick={() => { setAvatar(a); setShowAvatars(false) }}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all"
                    style={{
                      background: avatar === a ? 'linear-gradient(135deg,#C9963A,#E8B96A)' : 'rgba(255,255,255,0.05)',
                      boxShadow: avatar === a ? '0 0 12px rgba(201,150,58,0.6)' : 'none',
                      border: avatar === a ? 'none' : '1px solid rgba(201,150,58,0.2)',
                    }}>
                    {a}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GoldDivider />

        {/* Stats */}
        <div className="flex gap-3 mt-3">
          {[
            [saved.length, 'Styles sauvés', '💾'],
            [sessionStorage.getItem('afrotresse_results') ? '1' : '0', 'Analyses', '🔍'],
            ['0', 'Filleules', '👯‍♀️'],
          ].map(([val, label, icon], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 rounded-2xl py-4 text-center relative overflow-hidden"
              style={{ background: LUXURY_STYLE.cardBg, border: LUXURY_STYLE.goldBorder, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              {/* Halo interne */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(201,150,58,0.08), transparent 70%)' }}/>
              <p className="text-base mb-0.5">{icon}</p>
              <p className="font-display text-2xl font-bold" style={{ color: LUXURY_STYLE.goldText, textShadow: '0 0 10px rgba(232,185,106,0.4)' }}>{val}</p>
              <p className="font-body text-xs mt-0.5" style={{ color: LUXURY_STYLE.warm }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3 px-4 mt-2">
        {['Mes styles', 'Parrainage 🎁'].map((label, i) => (
          <button key={label} onClick={() => setTab(i)}
            className="flex-1 py-3 rounded-2xl text-sm font-body font-semibold transition-all"
            style={{
              background: tab === i
                ? 'linear-gradient(135deg,#C9963A,#E8B96A)'
                : 'rgba(201,150,58,0.07)',
              color: tab === i ? '#1A0A00' : LUXURY_STYLE.goldText,
              boxShadow: tab === i ? '0 4px 20px rgba(201,150,58,0.4)' : 'none',
              border: tab === i ? 'none' : LUXURY_STYLE.goldBorder,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      <div className="px-4 mt-4 space-y-3">
        {tab === 0 ? (
          <>
            {saved.length === 0 ? (
              <EmptyState onNavigate={() => navigate('/camera')} />
            ) : (
              saved.map((b, i) => <BraidCard key={b.id} braid={b} index={i} compact />)
            )}

            {sessionStorage.getItem('afrotresse_results') && (() => {
              const r = JSON.parse(sessionStorage.getItem('afrotresse_results'))
              return (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="rounded-3xl p-4 relative overflow-hidden"
                  style={{ background: LUXURY_STYLE.cardBg, border: LUXURY_STYLE.goldBorder, boxShadow: LUXURY_STYLE.goldGlow }}>
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 0% 50%, rgba(201,150,58,0.06), transparent 60%)' }}/>
                  <p className="font-display text-sm mb-3" style={{ color: LUXURY_STYLE.goldText }}>✦ Dernière analyse</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'rgba(201,150,58,0.1)', border: LUXURY_STYLE.goldBorder }}>🔍</div>
                    <div className="flex-1">
                      <p className="text-sm font-body" style={{ color: LUXURY_STYLE.cream }}>
                        Visage <span className="font-semibold" style={{ color: LUXURY_STYLE.goldText }}>{r.faceShapeName}</span>
                        {r.confidence && <span className="text-xs ml-2" style={{ color: LUXURY_STYLE.warm }}>{r.confidence}%</span>}
                      </p>
                    </div>
                    <button onClick={() => navigate('/results')}
                      className="text-xs font-body px-3 py-1.5 rounded-xl font-semibold"
                      style={{ background: 'rgba(201,150,58,0.15)', color: LUXURY_STYLE.goldText, border: LUXURY_STYLE.goldBorder }}>
                      Voir →
                    </button>
                  </div>
                </motion.div>
              )
            })()}
          </>
        ) : (
          <ReferralTab code={REFERRAL_CODE} copied={copied} onCopy={handleCopy} />
        )}
      </div>

      {/* ── Liens légaux ── */}
      <div className="px-4 mt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(201,150,58,0.2), transparent)' }}/>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {[
            { label: 'Confidentialité', to: '/privacy-policy' },
            { label: 'Conditions', to: '/terms-of-service' },
            { label: 'Cookies', to: '/cookie-policy' },
          ].map(({ label, to }) => (
            <button key={to} onClick={() => navigate(to)}
              className="font-body text-xs"
              style={{ color: 'rgba(201,150,58,0.45)' }}>
              {label}
            </button>
          ))}
        </div>
        <p className="font-body text-xs text-center mt-2" style={{ color: 'rgba(201,150,58,0.25)' }}>
          © 2026 AfroTresse
        </p>
      </div>
    </div>
  )
}

function EmptyState({ onNavigate }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="text-center py-16 flex flex-col items-center gap-4">
      <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl relative"
        style={{
          background: 'linear-gradient(145deg, #3C2310, #1A0A00)',
          boxShadow: '0 0 0 2px #C9963A, 0 0 0 4px rgba(201,150,58,0.2), 0 8px 30px rgba(0,0,0,0.5)',
        }}>
        💆🏾‍♀️
      </div>
      <p className="font-display text-xl" style={{ color: '#FAF4EC' }}>Aucun style sauvegardé</p>
      <p className="font-body text-sm max-w-xs text-center" style={{ color: 'rgba(250,244,236,0.55)' }}>
        Lance ton premier selfie pour recevoir des recommandations personnalisées
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNavigate}
        className="mt-2 px-8 py-4 rounded-full font-display font-semibold text-sm"
        style={{
          background: 'linear-gradient(135deg,#C9963A,#E8B96A)',
          color: '#1A0A00',
          boxShadow: '0 4px 24px rgba(201,150,58,0.5), 0 0 0 1px rgba(232,185,106,0.3)',
        }}>
        📸 Commencer l'analyse
      </motion.button>
    </motion.div>
  )
}

function ReferralTab({ code, copied, onCopy }) {
  return (
    <div className="space-y-4 pb-4">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="rounded-3xl p-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#3C2310,#1A0A00)', border: '1px solid rgba(201,150,58,0.5)', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,185,106,0.1)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(201,150,58,0.15), transparent 60%)' }}/>
        <div className="text-5xl mb-3">🌟</div>
        <h2 className="font-display text-xl font-bold" style={{ color: '#FAF4EC' }}>Partage AfroTresse</h2>
        <GoldDivider />
        <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(250,244,236,0.65)' }}>
          Invite tes amies et gagnez toutes les deux un accès premium gratuit !
        </p>
      </motion.div>

      <div className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#3C2310,#1A0A00)', border: '1px solid rgba(201,150,58,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <p className="font-body text-xs mb-3 text-center tracking-widest uppercase" style={{ color: 'rgba(232,185,106,0.7)' }}>
          Ton code de parrainage
        </p>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.4)' }}>
          <span className="flex-1 font-display text-xl text-center tracking-widest"
            style={{ color: '#E8B96A', textShadow: '0 0 12px rgba(232,185,106,0.4)' }}>{code}</span>
          <button onClick={onCopy}
            className="text-xs font-body px-4 py-2 rounded-xl font-semibold transition-all"
            style={{ background: copied ? 'linear-gradient(135deg,#C9963A,#E8B96A)' : 'transparent', color: copied ? '#1A0A00' : '#C9963A', border: copied ? 'none' : '1px solid rgba(201,150,58,0.5)' }}>
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-full font-display font-semibold"
        style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#1A0A00', boxShadow: '0 4px 24px rgba(201,150,58,0.5)' }}
        onClick={() => {
          if (navigator.share) navigator.share({ title: 'AfroTresse', text: `Rejoins AfroTresse avec mon code ${code} !`, url: window.location.origin })
        }}>
        Partager mon code →
      </motion.button>
    </div>
  )
}
