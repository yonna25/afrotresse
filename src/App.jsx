import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { setCredits, getCredits, PRICING } from './services/credits.js'

// Import des pages
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import Analyze from './pages/Analyze.jsx'
import Results from './pages/Results.jsx'
import Profile from './pages/Profile.jsx'
import Credits from './pages/Credits.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import CookiePolicy from './pages/CookiePolicy.jsx'

import BottomNav from './components/BottomNav.jsx'

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME POPUP — Première visite uniquement
// ═══════════════════════════════════════════════════════════════════════════
function WelcomePopup({ onDone }) {
  const [name, setName] = useState('')

  const handleSubmit = () => {
    const finalName = name.trim() || 'Reine'
    localStorage.setItem('afrotresse_user_name', finalName)
    if (localStorage.getItem('afrotresse_credits') === null) {
      setCredits(PRICING.freeCredits)
    }
    onDone()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10 overflow-y-auto"
        style={{ background: '#2C1A0E', border: '1px solid rgba(201,150,58,0.3)', maxHeight: '90vh' }}
      >
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="AfroTresse" className="h-28 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
        </div>
        <h2 className="font-bold text-center mb-2 text-3xl" style={{ color: '#FAF4EC' }}>
          Stop à l'hésitation ! ✋
        </h2>
        <p className="text-center text-sm mb-1" style={{ color: 'rgba(250,244,236,0.8)' }}>
          Trouve ta tresse idéale en 10 secondes.
        </p>
        <p className="text-center text-xs mb-4 font-bold" style={{ color: '#C9963A' }}>
          🎁 2 essais gratuits offerts à l'inscription
        </p>
        <input
          type="text"
          placeholder="Ton prénom, Reine..."
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl mb-4 outline-none"
          style={{ background: 'rgba(92,51,23,0.5)', border: '1px solid rgba(201,150,58,0.35)', color: '#FAF4EC' }}
          onKeyPress={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-bold"
          style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
        >
          C'est parti ! 🚀
        </button>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CREDIT SUCCESS POPUP — Affiché après un rechargement réussi
// S'affiche par-dessus n'importe quelle page (accueil, résultats, profil…)
// ═══════════════════════════════════════════════════════════════════════════
function CreditSuccessPopup({ data, onClose }) {
  // Fermeture automatique après 4 secondes
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)',
          border: '2px solid #C9963A',
          boxShadow: '0 0 60px rgba(201,150,58,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Particules dorées animées */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-lg"
              initial={{ opacity: 0, y: 60, x: `${10 + i * 12}%` }}
              animate={{ opacity: [0, 1, 0], y: -80 }}
              transition={{ delay: i * 0.15, duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
            >
              {['✨', '💎', '👑', '⭐', '✨', '💛', '👑', '💎'][i]}
            </motion.div>
          ))}
        </div>

        {/* Icône centrale */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl mb-4"
        >
          💎
        </motion.div>

        {/* Titre */}
        <h2 className="text-2xl font-black text-[#C9963A] mb-1">
          Félicitations {data.userName} ! 🎉
        </h2>

        {/* Crédits ajoutés */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white my-4"
        >
          +{data.credits} crédits
        </motion.p>

        <p className="text-sm text-white/60 mb-2">
          Pack <span className="text-[#C9963A] font-bold">{data.label}</span> activé avec succès
        </p>

        <p className="text-xs text-white/40 mb-6">
          Solde actuel : <span className="text-white font-bold">{getCredits()} crédits</span>
        </p>

        {/* Barre de progression auto-fermeture */}
        <motion.div
          className="h-1 rounded-full bg-[#C9963A]/30 overflow-hidden mb-5"
        >
          <motion.div
            className="h-full bg-[#C9963A] rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </motion.div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-[#1A0A00] text-base"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          Lancer un essai ✨
        </button>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED ROUTES
// ═══════════════════════════════════════════════════════════════════════════
function AnimatedRoutes() {
  const location = useLocation()
  const hideNav = ['/camera', '/analyze'].includes(location.pathname)

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [creditSuccess, setCreditSuccess] = useState(null)

  // Popup bienvenue — première visite
  useEffect(() => {
    if (!localStorage.getItem('afrotresse_user_name')) {
      setShowWelcome(true)
    }
  }, [])

  // Popup félicitation — détecte le flag posé par Credits.jsx après paiement
  useEffect(() => {
    const checkCreditSuccess = () => {
      const raw = sessionStorage.getItem('afrotresse_credit_success')
      if (raw) {
        try {
          const data = JSON.parse(raw)
          sessionStorage.removeItem('afrotresse_credit_success') // consommé une seule fois
          setCreditSuccess(data)
        } catch (e) {}
      }
    }

    // Vérifie au montage et à chaque changement de focus (retour depuis Credits)
    checkCreditSuccess()
    window.addEventListener('focus', checkCreditSuccess)
    return () => window.removeEventListener('focus', checkCreditSuccess)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-[430px] relative bg-[#2C1A0E] min-h-screen overflow-hidden shadow-2xl">

          {/* Welcome popup — 1ère visite */}
          {showWelcome && <WelcomePopup onDone={() => setShowWelcome(false)} />}

          {/* Credit success popup — après rechargement, toutes pages */}
          <AnimatePresence>
            {creditSuccess && (
              <CreditSuccessPopup
                data={creditSuccess}
                onClose={() => setCreditSuccess(null)}
              />
            )}
          </AnimatePresence>

          <AnimatedRoutes />
        </div>
      </div>
    </BrowserRouter>
  )
}
