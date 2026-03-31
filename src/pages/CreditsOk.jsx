import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCredits, addCredits, PRICING } from '../services/credits.js'

// Charge le script FedaPay depuis le CDN
function loadFedaPay() {
  return new Promise((resolve, reject) => {
    if (window.FedaPay) { resolve(window.FedaPay); return; }
    const script = document.createElement('script')
    script.src = 'https://cdn.fedapay.com/checkout.js?v=1.1.7'
    script.onload = () => window.FedaPay ? resolve(window.FedaPay) : reject(new Error('FedaPay non disponible'))
    script.onerror = () => reject(new Error('Impossible de charger FedaPay'))
    document.head.appendChild(script)
  })
}

export default function Credits() {
  const navigate = useNavigate()
  const [credits, setCredits] = useState(getCredits())
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine'

  const handleBuy = async () => {
    const pack = PRICING.packs.find(p => p.id === selected)
    if (!pack) return

    setLoading(true)
    setErrorMsg('')

    try {
      const FedaPay = await loadFedaPay()

      FedaPay.init({
        public_key: import.meta.env.VITE_FEDAPAY_PUBLIC_KEY,
        transaction: {
          amount: pack.price,
          description: `AfroTresse — ${pack.label} (${pack.credits} crédits)`,
        },
        customer: {
          firstname: userName,
        },
        environment: 'sandbox',
        onComplete: (response) => {
          setLoading(false)
          if (response.reason === FedaPay.CHECKOUT_COMPLETED) {
            addCredits(pack.credits)
            setCredits(getCredits())
            setSuccess(true)
            setTimeout(() => navigate(-1), 2500)
          } else {
            setErrorMsg('Paiement annulé ou échoué. Réessaie.')
          }
        },
      }).open()

    } catch (err) {
      setLoading(false)
      setErrorMsg('Impossible de charger le paiement. Réessaie.')
      console.error('FedaPay error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] pb-32">

      {/* Header */}
      <div className="pt-14 pb-6 px-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="font-bold text-3xl text-[#C9963A]">Recharger</h1>
        <p className="text-sm opacity-60 mt-1">Choisis ton pack d'essais virtuels</p>
      </div>

      {/* Solde actuel */}
      <div className="mx-6 mb-8 p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div>
          <p className="text-xs opacity-50 uppercase tracking-widest">Solde actuel</p>
          <p className="text-4xl font-black text-[#C9963A] mt-1">{credits}</p>
          <p className="text-xs opacity-50">crédits disponibles</p>
        </div>
        <div className="text-5xl">💎</div>
      </div>

      {/* Packs */}
      <div className="px-6 space-y-4">
        {PRICING.packs.map((pack) => (
          <motion.div
            key={pack.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(pack.id)}
            className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all ${
              selected === pack.id
                ? 'border-[#C9963A] bg-[#C9963A]/10'
                : 'border-white/10 bg-white/5'
            }`}>

            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9963A] text-[#1A0A00] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                ⭐ Populaire
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-lg">{pack.label}</p>
                <p className="text-[#C9963A] text-sm font-bold mt-1">
                  {pack.credits} crédits
                  {pack.monthly && <span className="ml-2 opacity-60 text-xs">/ mois</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl">{pack.price}</p>
                <p className="text-xs opacity-50">{PRICING.currency}</p>
              </div>
            </div>

            {selected === pack.id && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#C9963A] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="#1A0A00" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Erreur */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-4 p-4 rounded-2xl bg-red-900/30 border border-red-500/50">
            <p className="text-red-200 text-sm text-center">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton acheter */}
      <div className="px-6 mt-8">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBuy}
          disabled={!selected || loading || success}
          className="w-full py-5 rounded-2xl font-black text-lg disabled:opacity-30 transition-all text-[#1A0A00] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
          {success
            ? '✅ Crédits ajoutés !'
            : loading
            ? <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg> Chargement...</>
            : 'Payer avec FedaPay 💳'}
        </motion.button>
      </div>

      {/* Info */}
      <div className="mx-6 mt-6 p-4 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-xs opacity-50 text-center leading-relaxed">
          🎁 {PRICING.freeCredits} crédits offerts à l'inscription · 
          Parrainage : +{PRICING.referral.receiver} crédits · 
          Avis : +{PRICING.reviewBonus} crédits
        </p>
      </div>

      <div className="mx-6 mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-xs opacity-50 text-center mb-2 uppercase tracking-widest">Paiements acceptés</p>
        <p className="text-xs opacity-70 text-center">📱 Mobile Money · 💳 Carte bancaire · 🏦 Virement</p>
      </div>

    </div>
  )
}
