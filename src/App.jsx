import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home     from './pages/Home.jsx'
import Camera   from './pages/Camera.jsx'
import Analyze  from './pages/Analyze.jsx'
import Results  from './pages/Results.jsx'
import Library  from './pages/Library.jsx'
import Profile  from './pages/Profile.jsx'
import Credits  from './pages/Credits.jsx'
import PrivacyPolicy  from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import CookiePolicy   from './pages/CookiePolicy.jsx'
import MagicLink      from './pages/MagicLink.jsx'
import BottomNav from './components/BottomNav.jsx'

// \u2500\u2500\u2500 Popup de bienvenue \u2500\u2500\u2500
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
          <img src="/logo.png" alt="AfroTresse" className="h-28 w-auto object-contain"
            onError={e => { e.target.style.display='none' }}/>
        </div>

        <h2 className="font-display text-center font-bold mb-2"
          style={{ color: '#FAF4EC', fontSize: 'clamp(1.2rem, 5vw, 1.6rem)', lineHeight: '1.3' }}>
          Stop \u00e0 l'h\u00e9sitation ! \u270b
        </h2>

        <p className="font-body text-center text-sm mb-4 leading-relaxed"
          style={{ color: 'rgba(250,244,236,0.8)' }}>
          Trouve ta tresse id\u00e9ale en 10 secondes.
        </p>

        <label className="font-body text-xs uppercase tracking-widest mb-2 block"
          style={{ color: '#C9963A' }}>
          Comment tu t'appelles ?
        </label>
        <input
          type="text"
          placeholder="Ton pr\u00e9nom, Reine..."
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={20}
          className="w-full px-4 py-3 rounded-2xl font-body text-sm outline-none mb-4"
          style={{
            background: 'rgba(92,51,23,0.5)',
            border: '1px solid rgba(201,150,58,0.35)',
            color: '#FAF4EC',
          }}
          autoFocus
        />

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-display font-bold text-base"
          style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E', boxShadow: '0 4px 20px rgba(201,150,58,0.4)' }}
        >
          C'est parti ! \ud83d\ude80
        </button>

        <p className="font-body text-xs text-center mt-2 font-semibold"
          style={{ color: '#E8B96A' }}>
          \ud83c\udf81 3 essais gratuits aujourd'hui seulement !
        </p>
      </motion.div>
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const hideNav  = ['/camera', '/analyze', '/credits', '/privacy-policy', '/terms-of-service', '/cookie-policy', '/magic-link'].includes(location.pathname)

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"                element={<Home    />} />
          <Route path="/camera"          element={<Camera  />} />
          <Route path="/analyze"         element={<Analyze />} />
          <Route path="/results"         element={<Results />} />
          <Route path="/library"         element={<Library />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/credits"         element={<Credits />} />
          <Route path="/privacy-policy"  element={<PrivacyPolicy  />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy"   element={<CookiePolicy   />} />
          <Route path="/magic-link"      element={<MagicLink      />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const hasName = localStorage.getItem('afrotresse_user_name')
    if (!hasName) setShowWelcome(true)
  }, [])

  return (
    <BrowserRouter>
      {showWelcome && <WelcomePopup onDone={() => setShowWelcome(false)} />}
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
