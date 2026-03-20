import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PRICING, getCredits, addCredits, hasGivenReview,
  submitReview, getMyReferralCode, applyReferralCode, getReferralCount
} from '../services/credits.js'
import { sendMagicLink, getCurrentUser, getSupabaseCredits, addSupabaseCredits, ensureUserExists } from '../services/useSupabaseCredits.js'

export default function Credits() {
  const navigate   = useNavigate()
  const [credits,  setCredits]  = useState(0)
  const [tab,      setTab]      = useState(0) // 0=acheter 1=parrainage 2=avis
  const [copied,   setCopied]   = useState(false)
  const [refInput, setRefInput] = useState('')
  const [refMsg,   setRefMsg]   = useState(null)
  const [reviewDone, setReviewDone] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [showEmailPopup, setShowEmailPopup] = useState(false)
  const [pendingPackId, setPendingPackId] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [supabaseUser, setSupabaseUser] = useState(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const myCode = getMyReferralCode()

  useEffect(() => {
    setCredits(getCredits())
    setReviewDone(hasGivenReview())
  }, [])

  const refresh = () => setCredits(getCredits())

  // Verifier si utilisatrice connectee via magic link
  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        setSupabaseUser(user)
        await ensureUserExists(user.id, user.email)
        // Synchroniser credits Supabase vers localStorage
        const supaCredits = await getSupabaseCredits(user.id)
        const localCredits = getCredits()
        if (supaCredits > localCredits) {
          addCredits(supaCredits - localCredits)
          refresh()
        }
      }
    })
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleApplyRef = () => {
    const result = applyReferralCode(refInput.trim().toUpperCase())
    setRefMsg(result)
    if (result.success) refresh()
  }

  const handleReview = (text) => {
    if (!text.trim()) return
    const ok = submitReview()
    if (ok) { setReviewDone(true); refresh() }
  }

  const handlePayment = (packId) => {
    setPendingPackId(packId)
    setShowEmailPopup(true)
    setPaymentError('')
  }

  const handleConfirmPayment = async (email) => {
    setShowEmailPopup(false)
    setPaymentLoading(pendingPackId)
    setPaymentError('')
    try {
      const res = await fetch('/api/fedapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: pendingPackId, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur paiement')
      // Sauvegarder email pour magic link apres paiement
      if (email) localStorage.setItem('afrotresse_email', email)
      window.location.href = data.paymentUrl
    } catch (err) {
      setPaymentError('Paiement indisponible. Reessaie.')
    } finally {
      setPaymentLoading(null)
    }
  }

  // Verifier si paiement reussi (retour FedaPay)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      const earned = parseInt(params.get('credits') || '0')
      if (earned > 0) {
        addCredits(earned)
        setCreditsEarned(earned)
        setShowCelebration(true)
        refresh()
        setTimeout(() => setShowCelebration(false), 8000)

        // Sauvegarder dans Supabase + envoyer magic link
        const savedEmail = localStorage.getItem('afrotresse_email')
        if (savedEmail) {
          getCurrentUser().then(async (user) => {
            if (user) {
              await ensureUserExists(user.id, user.email)
              await addSupabaseCredits(user.id, earned)
            }
          })
          // Envoyer magic link pour securiser les credits
          sendMagicLink(savedEmail).then(() => {
            setMagicLinkSent(true)
          }).catch(console.error)
        }
      }
      window.history.replaceState({}, '', '/credits')
    }
  }, [])

  return (
    <>
    {/* Banniere celebration apres paiement */}
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 pt-12 pb-5"
          style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', maxWidth: '430px', margin: '0 auto' }}>
          <div className="text-center">
            <p className="text-3xl mb-1">🎉</p>
            <p className="font-display font-bold text-lg" style={{ color: '#2C1A0E' }}>
              Felicitations Reine !
            </p>
            <p className="font-body text-sm mb-1" style={{ color: 'rgba(44,26,14,0.75)' }}>
              Tes {creditsEarned} credits sont prets !
            </p>
            {magicLinkSent && (
              <p className="font-body text-xs mb-3" style={{ color: 'rgba(44,26,14,0.6)' }}>
                Un lien de securite a ete envoye a ton email.
              </p>
            )}
            <button
              onClick={() => { setShowCelebration(false); navigate('/camera') }}
              className="w-full py-3 rounded-2xl font-display font-bold text-sm mb-2"
              style={{ background: '#2C1A0E', color: '#E8B96A' }}>
              Lancer mon analyse maintenant →
            </button>
            <button
              onClick={() => setShowCelebration(false)}
              className="font-body text-xs"
              style={{ color: 'rgba(44,26,14,0.5)' }}>
              Fermer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Popup email avant paiement */}
    <AnimatePresence>
      {showEmailPopup && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <motion.div
            initial={{ y: 300 }} animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
            style={{ background: '#2C1A0E', border: '1px solid rgba(201,150,58,0.3)' }}>
            <h2 className="font-display text-center text-lg mb-1" style={{ color: '#FAF4EC' }}>
              Securise ton achat
            </h2>
            <p className="font-body text-center text-sm mb-5" style={{ color: 'rgba(250,244,236,0.6)' }}>
              Entre ton email pour recevoir ton recu et recuperer tes credits en cas de perte de telephone.
            </p>
            <input
              type="email"
              placeholder="ton@email.com"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmPayment(emailInput.trim())}
              className="w-full px-4 py-3 rounded-2xl font-body text-sm outline-none mb-3"
              style={{ background: 'rgba(92,51,23,0.5)', border: '1px solid rgba(201,150,58,0.35)', color: '#FAF4EC' }}
              autoFocus
            />
            <button
              onClick={() => handleConfirmPayment(emailInput.trim())}
              className="w-full py-3 rounded-2xl font-display font-semibold text-sm"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}>
              Continuer vers le paiement
            </button>
            <button
              onClick={() => handleConfirmPayment('')}
              className="w-full py-2 mt-2 font-body text-xs text-center"
              style={{ color: 'rgba(250,244,236,0.4)' }}>
              Continuer sans email
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="min-h-screen pb-28" style={{ background:"#1A0E07" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(201,150,58,0.15)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background:"rgba(255,255,255,0.1)", border:'1px solid rgba(201,150,58,0.2)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-cream" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 className="font-display text-xl text-cream">Mes crédits</h1>
        </div>

        {/* Solde */}
        <div className="rounded-3xl p-5 text-center"
          style={{ background:'linear-gradient(135deg, #5C3317, #2C1A0E)', border:'1px solid rgba(201,150,58,0.3)', boxShadow:'0 4px 24px rgba(201,150,58,0.15)' }}>
          <p className="font-body text-xs text-[#D4B896] uppercase tracking-widest mb-1">Solde actuel</p>
          <p className="font-display text-5xl text-gold font-bold">{credits}</p>
          <p className="font-body text-sm text-[#D4B896] mt-1">
            {credits === 0 ? 'Plus de tests disponibles' : `test${credits > 1 ? 's' : ''} disponible${credits > 1 ? 's' : ''}`}
          </p>
          <p className="font-body text-xs mt-2" style={{ color:'rgba(232,185,106,0.6)' }}>
            1 test = 2 styles générés sur ton visage
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {['Acheter', 'Parrainer', 'Avis gratuit'].map((label, i) => (
          <button key={label} onClick={() => setTab(i)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-body font-semibold transition-all"
            style={{ background: tab===i ? '#C9963A' : 'rgba(92,51,23,0.4)', color: tab===i ? '#2C1A0E' : '#8B5E3C', border:'1px solid rgba(201,150,58,0.15)' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">

        {/* ── ACHETER ── */}
        {tab === 0 && (
          <>
            {paymentError && (
              <p className="font-body text-red-400 text-xs text-center mb-2">{paymentError}</p>
            )}
            <p className="font-body text-[#D4B896] text-xs text-center mb-2">
              Paiement securise via MTN MoMo & Moov Money
            </p>
            {PRICING.packs.map((pack) => (
              <motion.div key={pack.id}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                className="relative rounded-3xl p-5"
                style={{ background: pack.popular ? 'linear-gradient(135deg, rgba(201,150,58,0.25), rgba(232,185,106,0.1))' : 'rgba(255,255,255,0.06)', border: pack.popular ? '1px solid rgba(201,150,58,0.5)' : '1px solid rgba(201,150,58,0.15)' }}>

                {pack.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold font-body"
                    style={{ background:'#C9963A', color:'#2C1A0E' }}>
                    ⭐ POPULAIRE
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-cream text-lg">{pack.label}</p>
                    <p className="font-body text-[#D4B896] text-xs mt-0.5">
                      {pack.monthly ? 'Illimité pendant 30 jours' : `${pack.tests} test${pack.tests > 1 ? 's' : ''} = ${pack.tests * 2} styles`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-gold text-xl font-bold">{pack.price}</p>
                    <p className="font-body text-[#D4B896] text-xs">{PRICING.currency}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => handlePayment(pack.id)}
                    disabled={paymentLoading === pack.id}
                    className="w-full py-3 rounded-2xl font-body text-sm font-semibold transition-all"
                    style={{
                      background: paymentLoading === pack.id ? 'rgba(201,150,58,0.3)' : 'linear-gradient(135deg,#C9963A,#E8B96A)',
                      color: '#2C1A0E',
                      opacity: paymentLoading === pack.id ? 0.7 : 1,
                    }}>
                    {paymentLoading === pack.id ? 'Redirection...' : '📱 Payer via MTN MoMo / Moov Money'}
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {/* ── PARRAINAGE ── */}
        {tab === 1 && (
          <>
            {/* Mon code */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              className="rounded-3xl p-5"
              style={{ background:"rgba(255,255,255,0.08)", border:'1px solid rgba(201,150,58,0.2)' }}>
              <p className="font-display text-cream text-sm mb-1">Mon code parrain</p>
              <p className="font-body text-[#D4B896] text-xs mb-3">
                Partage ce code — tu gagnes <span className="text-gold font-bold">+{PRICING.referral.giver} test</span> par filleule inscrite
              </p>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(201,150,58,0.3)' }}>
                <span className="flex-1 font-display text-lg text-gold tracking-widest text-center">{myCode}</span>
                <button onClick={handleCopy}
                  className="text-xs font-body px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: copied ? '#C9963A' : 'transparent', color: copied ? '#2C1A0E' : '#C9963A', border: copied ? 'none' : '1px solid rgba(201,150,58,0.4)' }}>
                  {copied ? '✓ Copié !' : 'Copier'}
                </button>
              </div>
              <div className="flex justify-between mt-3 pt-3"
                style={{ borderTop:'1px solid rgba(201,150,58,0.1)' }}>
                <span className="font-body text-[#D4B896] text-xs">Filleules parrainées</span>
                <span className="font-display text-gold">{getReferralCount()}</span>
              </div>
            </motion.div>

            {/* Entrer un code */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              className="rounded-3xl p-5"
              style={{ background:"rgba(255,255,255,0.08)", border:'1px solid rgba(201,150,58,0.2)' }}>
              <p className="font-display text-cream text-sm mb-1">J'ai un code parrain</p>
              <p className="font-body text-[#D4B896] text-xs mb-3">
                Entre le code d'une amie et reçois <span className="text-gold font-bold">+{PRICING.referral.receiver} test gratuit</span>
              </p>
              <div className="flex gap-2">
                <input
                  value={refInput}
                  onChange={e => setRefInput(e.target.value.toUpperCase())}
                  placeholder="AFRO-XXXXX"
                  maxLength={10}
                  className="flex-1 rounded-2xl px-4 py-3 font-body text-sm text-cream outline-none"
                  style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(201,150,58,0.3)' }}
                />
                <button onClick={handleApplyRef}
                  className="px-4 rounded-2xl font-body text-sm font-semibold"
                  style={{ background:'#C9963A', color:'#2C1A0E' }}>
                  OK
                </button>
              </div>
              {refMsg && (
                <p className="font-body text-xs mt-2"
                  style={{ color: refMsg.success ? '#4CAF50' : '#FF6B6B' }}>
                  {refMsg.success ? '✅' : '❌'} {refMsg.message}
                </p>
              )}
            </motion.div>

            {/* Comment ça marche */}
            <div className="rounded-3xl p-5"
              style={{ background:"rgba(255,255,255,0.06)", border:'1px solid rgba(201,150,58,0.1)' }}>
              <p className="font-display text-cream text-sm mb-3">Comment ça marche ?</p>
              {[
                ['1', 'Copie ton code et partage à une amie', '📤'],
                ['2', 'Elle s\'inscrit et entre ton code', '📱'],
                ['3', 'Elle reçoit 1 test gratuit', '🎁'],
                ['4', 'Toi tu reçois 1 test gratuit', '✨'],
                ['5', 'Si elle achète, tu gagnes 10% en crédits', '💰'],
              ].map(([n, text, icon]) => (
                <div key={n} className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background:'rgba(201,150,58,0.2)', color:'#C9963A', border:'1px solid rgba(201,150,58,0.3)' }}>
                    {n}
                  </div>
                  <p className="font-body text-cream text-xs flex-1 mt-0.5">{text}</p>
                  <span>{icon}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AVIS GRATUIT ── */}
        {tab === 2 && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            {reviewDone ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background:'rgba(26,102,64,0.2)', border:'1px solid rgba(26,102,64,0.4)' }}>
                <p className="text-4xl mb-3">✅</p>
                <p className="font-display text-cream text-lg">Merci pour ton avis !</p>
                <p className="font-body text-[#D4B896] text-sm mt-2">
                  Tu as reçu <span className="text-gold font-bold">+{PRICING.reviewBonus} test gratuit</span>
                </p>
              </div>
            ) : (
              <ReviewForm onSubmit={handleReview} bonus={PRICING.reviewBonus} />
            )}
          </motion.div>
        )}
      </div>
    </div>
    </>
  )
}

function ReviewForm({ onSubmit, bonus }) {
  const [text,  setText]  = useState('')
  const [stars, setStars] = useState(0)
  const [sent,  setSent]  = useState(false)

  const handleSubmit = () => {
    if (stars === 0 || text.trim().length < 10) return
    onSubmit(text)
    setSent(true)
  }

  if (sent) return (
    <div className="rounded-3xl p-8 text-center"
      style={{ background:'rgba(26,102,64,0.2)', border:'1px solid rgba(26,102,64,0.4)' }}>
      <p className="text-4xl mb-3">🌟</p>
      <p className="font-display text-cream text-lg">Merci !</p>
      <p className="font-body text-[#D4B896] text-sm mt-2">
        +{bonus} test gratuit ajouté à ton solde
      </p>
    </div>
  )

  return (
    <div className="rounded-3xl p-5"
      style={{ background:"rgba(255,255,255,0.08)", border:'1px solid rgba(201,150,58,0.2)' }}>
      <p className="font-display text-cream text-lg mb-1">Laisse ton avis</p>
      <p className="font-body text-[#D4B896] text-xs mb-4">
        En échange de ton avis honnête, reçois <span className="text-gold font-bold">+{bonus} test gratuit</span>
      </p>

      {/* Étoiles */}
      <div className="flex gap-2 mb-4">
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setStars(s)}
            className="text-2xl transition-all"
            style={{ opacity: s <= stars ? 1 : 0.3 }}>
            ⭐
          </button>
        ))}
      </div>

      {/* Texte */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Dis-nous ce que tu penses de l'application... (minimum 10 caractères)"
        rows={4}
        className="w-full rounded-2xl px-4 py-3 font-body text-sm text-cream outline-none resize-none"
        style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(201,150,58,0.3)' }}
      />

      <button
        onClick={handleSubmit}
        disabled={stars === 0 || text.trim().length < 10}
        className="w-full mt-3 py-4 rounded-full font-display font-semibold transition-all disabled:opacity-40"
        style={{ background:'linear-gradient(135deg, #C9963A, #E8B96A)', color:'#2C1A0E', boxShadow:'0 4px 20px rgba(201,150,58,0.4)' }}>
        Envoyer mon avis et recevoir mon test gratuit
      </button>
    </div>
  )
}
