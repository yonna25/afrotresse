import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { setCredits, getCredits, syncCreditsFromServer } from './services/credits.js'
import { getCurrentUser, getSupabaseCredits, ensureUserExists, addSupabaseCredits } from './services/useSupabaseCredits.js'
import { supabase } from './services/supabase.js'

// Import des pages
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import Analyze from './pages/Analyze.jsx'
import Results from './pages/Results.jsx'
import Profile from './pages/Profile.jsx'
import Credits from './pages/Credits.jsx'
import Debug from './pages/Debug.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import CookiePolicy from './pages/CookiePolicy.jsx'
import FAQ from './pages/FAQ.jsx'
import MagicLink from './pages/MagicLink.jsx'
import Library from './pages/Library.jsx'
import AdminReviews from './pages/AdminReviews.jsx'

// Import de la navigation
import BottomNav from './components/BottomNav.jsx'

// ─── Transfert crédits en attente → Supabase ─────────────────────
// Appelé dès qu'une utilisatrice se connecte (Magic Link ou autre)
async function flushPendingCredits(userId) {
  try {
    const pending = parseInt(localStorage.getItem('afrotresse_pending_credits') || '0', 10)
    if (pending > 0) {
      await addSupabaseCredits(userId, pending)
      localStorage.removeItem('afrotresse_pending_credits')
    }
  } catch (err) {
    console.error('flushPendingCredits error:', err)
  }
}

// CREDIT SUCCESS POPUP
function CreditSuccessPopup({ data, onClose }) {
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

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl mb-4"
        >
          💎
        </motion.div>

        <h2 className="text-2xl font-black text-[#C9963A] mb-1">
          Félicitations {data.userName} ! 🎉
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white my-4"
        >
          +{data.credits} crédits
        </motion.p>

        <p className="text-sm text-white/60 mb-2">
          Pack <span className="text-[#C9963A] font-bold">{data.label}</span> activé
        </p>

        <p className="text-xs text-white/40 mb-6">
          Solde : <span className="text-white font-bold">{getCredits()} crédits</span>
        </p>

        <motion.div className="h-1 rounded-full bg-[#C9963A]/30 overflow-hidden mb-5">
          <motion.div
            className="h-full bg-[#C9963A]"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4 }}
          />
        </motion.div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-[#1A0A00]"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          Lancer un essai ✨
        </button>
      </motion.div>
    </motion.div>
  )
}

// ROUTES
function AnimatedRoutes() {
  const location = useLocation()
  const hideNav = ['/camera', '/analyze', '/magic-link', '/admin-reviews'].includes(location.pathname)

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
          <Route path="/debug" element={<Debug />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/magic-link" element={<MagicLink />} />
          <Route path="/library" element={<Library />} />
          <Route path="/admin-reviews" element={<AdminReviews />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  )
}

// APP
export default function App() {
  const [creditSuccess, setCreditSuccess] = useState(null)

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (user) {
        try {
          await ensureUserExists(user.id, user.email)
          // Transférer les crédits en attente achetés en mode anonyme
          await flushPendingCredits(user.id)
          const balance = await getSupabaseCredits(user.id)
          if (balance > 0) setCredits(balance)
        } catch {}
      } else {
        // Utilisatrice anonyme → sync depuis Supabase via fingerprint
        syncCreditsFromServer().catch(() => {})
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.id) {
          try {
            await ensureUserExists(session.user.id, session.user.email)
            // Transférer les crédits en attente achetés en mode anonyme
            await flushPendingCredits(session.user.id)
            const balance = await getSupabaseCredits(session.user.id)
            if (balance > 0) setCredits(balance)
          } catch {}
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e) => setCreditSuccess(e.detail)
    window.addEventListener('afrotresse:credit_success', handler)
    return () => window.removeEventListener('afrotresse:credit_success', handler)
  }, [])

  // Fallback : polling sessionStorage (si FedaPay onComplete s'exécute dans son iframe)
  useEffect(() => {
    const interval = setInterval(() => {
      const raw = sessionStorage.getItem('afrotresse_credit_success')
      if (raw) {
        try {
          const data = JSON.parse(raw)
          sessionStorage.removeItem('afrotresse_credit_success')
          setCreditSuccess(data)
        } catch {}
      }
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-[430px] relative bg-[#2C1A0E] min-h-screen overflow-hidden shadow-2xl">

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
