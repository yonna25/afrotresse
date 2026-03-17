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
import BottomNav from './components/BottomNav.jsx'

// ─── Popup de bienvenue ───
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
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10"
        style={{ background: '#2C1A0E', border: '1px solid rgba(201,150,58,0.3)' }}
      >
        {/* Icone */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(201,150,58,0.15)', border: '1px solid rgba(201,150,58,0.4)' }}>
            🌿
          </div>
        </div>

        {/* Titre */}
        <h2 className="font-display text-center text-xl mb-1"
          style={{ color: '#FAF4EC' }}>
          Bienvenue chez <span style={{ color: '#C9963A' }}>AfroTresse</span>
        </h2>
        <p className="font-body text-center text-sm mb-6"
          style={{ color: 'rgba(250,244,236,0.65)' }}>
          L'art de la tresse, ta signature
        </p>

        {/* Champ prénom */}
        <label className="font-body text-xs uppercase tracking-widest mb-2 block"
          style={{ color: '#C9963A' }}>
          Comment tu t'appelles, Reine ?
        </label>
        <input
          type="text"
          placeholder="Ton prénom..."
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

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-2xl font-display font-semibold text-sm"
          style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
        >
          {name.trim() ? `Commencer, ${name.trim()} 👑` : 'Commencer en tant que Reine 👑'}
        </button>

        <p className="font-body text-xs text-center mt-3"
          style={{ color: 'rgba(250,244,236,0.35)' }}>
          Ton prénom reste uniquement sur ton téléphone
        </p>
      </motion.div>
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  const hideNav  = ['/camera', '/analyze', '/credits'].includes(location.pathname)

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<Home    />} />
          <Route path="/camera"  element={<Camera  />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results" element={<Results />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/credits" element={<Credits />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  // Afficher le popup seulement au premier lancement
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
