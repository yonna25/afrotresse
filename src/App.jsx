import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

// Import des pages
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import Analyze from './pages/Analyze.jsx'
import Results from './pages/Results.jsx'
import Library from './pages/Library.jsx'
import Profile from './pages/Profile.jsx'
import Credits from './pages/Credits.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import CookiePolicy from './pages/CookiePolicy.jsx'
import MagicLink from './pages/MagicLink.jsx'

// Import de la navigation
import BottomNav from './components/BottomNav.jsx'

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME POPUP — Première visite
// ═══════════════════════════════════════════════════════════════════════════
function WelcomePopup({ onDone }) {
  const [name, setName] = useState('')
  
  const handleSubmit = () => {
    const finalName = name.trim() || 'Reine'
    localStorage.setItem('afrotresse_user_name', finalName)
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
          <img src="/logo.png" alt="AfroTresse" className="h-28 w-auto object-contain" />
        </div>
        
        <h2 className="font-bold text-center mb-2 text-3xl" style={{ color: '#FAF4EC' }}>
          Stop à l'hésitation ! ✋
        </h2>
        
        <p className="text-center text-sm mb-4" style={{ color: 'rgba(250,244,236,0.8)' }}>
          Trouve ta tresse idéale en 10 secondes.
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
// ANIMATED ROUTES — Gestion des routes et de la navigation
// ═══════════════════════════════════════════════════════════════════════════
function AnimatedRoutes() {
  const location = useLocation()
  
  // Routes où la BottomNav doit être CACHÉE
  const hideNav = ['/camera', '/analyze', '/credits', '/privacy-policy', '/terms-of-service', '/cookie-policy', '/magic-link'].includes(location.pathname)

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/magic-link" element={<MagicLink />} />
        </Routes>
      </AnimatePresence>
      
      {/* BottomNav visible partout sauf sur les routes spécifiées */}
      {!hideNav && <BottomNav />}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [showWelcome, setShowWelcome] = useState(false)

  // Affiche le Welcome popup si c'est la première visite
  useEffect(() => {
    if (!localStorage.getItem('afrotresse_user_name')) {
      setShowWelcome(true)
    }
  }, [])

  return (
    <BrowserRouter>
      {showWelcome && <WelcomePopup onDone={() => setShowWelcome(false)} />}
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
