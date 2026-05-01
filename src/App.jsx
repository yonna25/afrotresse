import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { setCredits, getCredits } from './services/credits.js'
import { syncCreditsWithServer, getOrCreateFingerprint } from './services/useSupabaseCredits.js'
import { supabase } from './services/supabase.js'

// --- TES IMPORTS DE PAGES (Inchangés) ---
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
import Partners from './pages/Partners.jsx'
import AdminPartners from './pages/AdminPartners.jsx'
import AdminCredits from './pages/AdminCredits.jsx'
import Login from './pages/Login.jsx'
import BottomNav from './components/BottomNav.jsx'
import WhatsAppWidget from './components/WhatsAppWidget.jsx'

// --- TON DESIGN POPUP (Inchangé) ---
function CreditSuccessPopup({ data, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)', border: '2px solid #C9963A', boxShadow: '0 0 60px rgba(201,150,58,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">💎</div>
        <h2 className="text-2xl font-black text-[#C9963A] mb-1">Félicitations {data.userName} ! 🎉</h2>
        <p className="text-4xl font-black text-white my-4">+{data.credits} crédits</p>
        <button onClick={onClose} className="w-full py-4 rounded-2xl font-black text-[#1A0A00]" style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>Lancer un essai ✨</button>
      </motion.div>
    </motion.div>
  )
}

// --- LOGIQUE DE ROUTE PROTEGÉE (Corrigée pour le 2/5) ---
function AdminRoute({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (session === undefined) return (
    <div className="min-h-screen bg-[#0F0500] flex items-center justify-center">
      <div className="text-[#C9963A] font-bold">Vérification...</div>
    </div>
  );
  
  return session ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation()
  const hideNav = ['/camera', '/analyze', '/magic-link', '/admin-reviews', '/admin-partners', '/admin-credits', '/login', '/debug'].includes(location.pathname)

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
          <Route path="/debug" element={<AdminRoute><Debug /></AdminRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/magic-link" element={<MagicLink />} />
          <Route path="/library" element={<Library />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/admin-reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
          <Route path="/admin-partners" element={<AdminRoute><AdminPartners /></AdminRoute>} />
          <Route path="/admin-credits" element={<AdminRoute><AdminCredits /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
      <WhatsAppWidget />
    </>
  )
}

export default function App() {
  const [creditSuccess, setCreditSuccess] = useState(null)

  useEffect(() => {
    // 1. Initialisation Fingerprint au démarrage
    const fp = getOrCreateFingerprint();

    // 2. Fonction de synchronisation unique
    const handleSync = async (user) => {
      const balance = await syncCreditsWithServer(user?.email, fp);
      setCredits(balance);
    };

    // 3. Premier check au montage
    supabase.auth.getUser().then(({ data }) => handleSync(data.user));

    // 4. Écouteur de session stable (ne saute plus au refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handleSync(session?.user);
      }
    });

    return () => subscription?.unsubscribe();
  }, [])

  // --- TES EFFECT DE POPUP (Inchangés) ---
  useEffect(() => {
    const handler = (e) => setCreditSuccess(e.detail)
    window.addEventListener('afrotresse:credit_success', handler)
    return () => window.removeEventListener('afrotresse:credit_success', handler)
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-[430px] relative bg-[#2C1A0E] min-h-screen shadow-2xl">
          <AnimatePresence>
            {creditSuccess && <CreditSuccessPopup data={creditSuccess} onClose={() => setCreditSuccess(null)} />}
          </AnimatePresence>
          <AnimatedRoutes />
        </div>
      </div>
    </BrowserRouter>
  )
}
