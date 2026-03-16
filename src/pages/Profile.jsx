import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BraidCard from '../components/BraidCard.jsx'

export default function Profile() {
  const navigate = useNavigate()
  const [saved,   setSaved]   = useState([])
  const [tab,     setTab]     = useState(0)
  const [copied,  setCopied]  = useState(false)

  const REFERRAL_CODE = 'AFRO-' + Math.random().toString(36).substring(2,7).toUpperCase()

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('afrotresse_saved') || '[]')
    setSaved(s)
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const analyses = JSON.parse(sessionStorage.getItem('afrotresse_results') ? '1' : '0') || 0

  return (
    <div className="min-h-screen bg-brown pb-28">
      {/* Header + Avatar */}
      <div className="relative glass pt-12 pb-6 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 390 160" className="w-full h-full opacity-10">
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill="#C9963A"/>
            </pattern>
            <rect width="390" height="160" fill="url(#dots)"/>
          </svg>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-mid border-2 border-gold/50 flex items-center justify-center text-2xl"
            style={{ boxShadow: '0 0 20px rgba(201,150,58,0.3)' }}>
            👩🏾
          </div>
          <div>
            <h1 className="font-display text-xl text-cream">Mon Profil</h1>
            <p className="font-body text-warm text-sm">Membre AfroTresse ✦</p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex gap-3 mt-5">
          {[
            [saved.length, 'Styles sauvés'],
            [sessionStorage.getItem('afrotresse_results') ? '1' : '0', 'Analyses'],
            ['0', 'Filleules'],
          ].map(([val, label]) => (
            <div key={label} className="flex-1 bg-brown/50 rounded-2xl py-3 text-center border border-warm/10">
              <p className="font-display text-xl text-gold">{val}</p>
              <p className="font-body text-warm text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {['Mes styles', 'Parrainage'].map((label, i) => (
          <button key={label} onClick={() => setTab(i)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-body font-semibold transition-all
              ${tab === i ? 'bg-gold text-brown' : 'glass text-warm'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 0 ? (
        <div className="px-4 mt-4 space-y-3">
          {saved.length === 0 ? (
            <EmptyHistory onNavigate={() => navigate('/camera')} />
          ) : (
            saved.map((b, i) => <BraidCard key={b.id} braid={b} index={i} compact />)
          )}

          {/* Last analysis */}
          {sessionStorage.getItem('afrotresse_results') && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-3xl p-4 mt-4"
            >
              <p className="font-display text-cream text-sm mb-1">Dernière analyse</p>
              {(() => {
                const r = JSON.parse(sessionStorage.getItem('afrotresse_results'))
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-lg">🔍</div>
                    <div>
                      <p className="text-cream text-sm font-body">Visage <span className="text-gold font-semibold">{r.faceShapeName}</span></p>
                      <p className="text-warm text-xs">{r.recommendations.length} styles recommandés</p>
                    </div>
                    <button onClick={() => navigate('/results')}
                      className="ml-auto text-gold text-xs font-body border border-gold/30 rounded-xl px-3 py-1.5">
                      Voir →
                    </button>
                  </div>
                )
              })()}
            </motion.div>
          )}
        </div>
      ) : (
        <ReferralTab code={REFERRAL_CODE} copied={copied} onCopy={handleCopy} />
      )}
    </div>
  )
}

function ReferralTab({ code, copied, onCopy }) {
  return (
    <div className="px-4 mt-4 space-y-4">
      {/* Hero card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-6 text-center"
        style={{ boxShadow: '0 4px 24px rgba(201,150,58,0.1)' }}
      >
        <div className="text-4xl mb-3">🌟</div>
        <h2 className="font-display text-xl text-cream">Partage AfroTresse</h2>
        <div className="gold-divider" />
        <p className="font-body text-warm text-sm leading-relaxed mt-2">
          Invite tes amies et gagnez toutes les deux un accès premium gratuit pendant 1 mois !
        </p>
      </motion.div>

      {/* Code */}
      <div className="glass rounded-3xl p-5">
        <p className="font-body text-warm text-xs mb-3 text-center">Ton code de parrainage</p>
        <div className="flex items-center gap-3 bg-brown rounded-2xl px-4 py-3 border border-gold/20">
          <span className="flex-1 font-display text-lg text-gold text-center tracking-widest">{code}</span>
          <button onClick={onCopy}
            className={`text-xs font-body px-3 py-1.5 rounded-xl transition-all ${copied ? 'bg-gold text-brown' : 'border border-gold/40 text-gold'}`}>
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass rounded-3xl p-5">
        <p className="font-display text-cream text-sm mb-4">Comment ça marche ?</p>
        <div className="space-y-4">
          {[
            ['1', 'Partage ton code avec une amie', '📤'],
            ['2', 'Elle crée un compte avec ton code', '📱'],
            ['3', 'Vous obtenez toutes les deux 1 mois premium', '🎁'],
          ].map(([num, text, icon]) => (
            <div key={num} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 text-gold text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {num}
              </div>
              <div className="flex-1">
                <p className="text-cream text-sm font-body">{text}</p>
              </div>
              <span className="text-lg">{icon}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      <div className="space-y-3 pb-4">
        <button className="btn-gold w-full" onClick={() => {
          if (navigator.share) {
            navigator.share({ title: 'AfroTresse', text: `Rejoins AfroTresse avec mon code ${code} !`, url: window.location.origin })
          }
        }}>
          Partager via WhatsApp / Réseaux
        </button>
      </div>
    </div>
  )
}

function EmptyHistory({ onNavigate }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-center py-16 flex flex-col items-center gap-4">
      <div className="w-16 h-16 glass rounded-full flex items-center justify-center text-2xl">💆🏾‍♀️</div>
      <p className="font-display text-cream">Aucun style sauvegardé</p>
      <p className="font-body text-warm text-sm max-w-xs text-center">
        Lance ton premier selfie pour recevoir des recommandations personnalisées
      </p>
      <button onClick={onNavigate} className="btn-gold mt-2">
        📸 Commencer l'analyse
      </button>
    </motion.div>
  )
}
