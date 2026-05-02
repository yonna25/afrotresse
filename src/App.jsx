import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

// Services
import { setCredits, getCredits } from './services/credits.js'
import { getCurrentUser } from './services/useSupabaseCredits.js'
import { supabase } from './services/supabase.js'

// Pages
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
import AdminUsers from './pages/AdminUsers.jsx'
import Login from './pages/Login.jsx'

// Composants
import BottomNav from './components/BottomNav.jsx'
import WhatsAppWidget from './components/WhatsAppWidget.jsx'

function AdminRoute({ children }) {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  if (session === undefined) return (
    <div className="min-h-screen bg-[#0F0500] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#C9963A] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[#C9963A] text-[10px] font-black uppercase tracking-widest">V\u00e9rification...</span>
      </div>
    </div>
  );
  
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function CreditSuccessPopup({ data, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)',
          border: '2px solid #C9963A',
          boxShadow: '0 0 60px rgba(201,150,58,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">\ud83d\udc8e</div>
        <h2 className="text-2xl font-black text-[#C9963A] mb-1">F\u00e9licitations {data.userName} ! \ud83c\udf89</h2>
        <p className="text-4xl font-black text-white my-4">+{data.credits} cr\u00e9dits</p>
        <p className="text-xs text-white/40 mb-6">Nouveau solde : <span className="text-white font-bold">{getCredits()}</span></p>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-[#1A0A00]"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          Lancer un essai \u2728
        </button>
      </motion.div>
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  
  const hideNav = [
    '/camera', '/analyze', '/magic-link', '/admin-reviews', 
    '/admin-partners', '/admin-credits', '/admin-users', '/login', '/debug'
  ].includes(location.pathname)

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
          <Route path="/admin-users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
    const syncSession = async (user) => {
      if (!user) return;

      // Sync cr\u00e9dits depuis usage_credits (plus profiles)
      const { data: creditData } = await supabase
        .from('usage_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();
      if (creditData?.credits > 0) setCredits(creditData.credits);

      // Mise \u00e0 jour last_seen
      await supabase
        .from('usage_credits')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    };

    supabase.auth.getUser().then(({ data }) => syncSession(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        syncSession(session?.user);
      }
    });

    return () => subscription?.unsubscribe();
  }, [])

  useEffect(() => {
    const handler = (e) => setCreditSuccess(e.detail);
    window.addEventListener('afrotresse:credit_success', handler);
    return () => window.removeEventListener('afrotresse:credit_success', handler);
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black flex justify-center font-sans">
        <div className="w-full max-w-[430px] relative bg-[#2C1A0E] min-h-screen shadow-2xl overflow-x-hidden">
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
