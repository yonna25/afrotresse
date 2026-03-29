import React, { useState, useEffect } from 'react'; // Correction : Imports explicites
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Imports des composants de pages
import Home from './pages/Home.jsx';
import Camera from './pages/Camera.jsx';
import Analyze from './pages/Analyze.jsx';
import Results from './pages/Results.jsx';
import Library from './pages/Library.jsx';
import Profile from './pages/Profile.jsx';
import Credits from './pages/Credits.jsx';
import BottomNav from './components/BottomNav.jsx';

// Composant Popup de Bienvenue
function WelcomePopup({ onDone }) {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    const finalName = name.trim() || 'Reine';
    localStorage.setItem('afrotresse_user_name', finalName);
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 300 }} animate={{ y: 0 }}
        className="w-full max-w-sm rounded-t-3xl p-6 pb-10 bg-[#2C1A0E] border-t border-[#C9963A]/30"
      >
        <h2 className="text-center font-bold mb-2 text-[#FAF4EC]">Bienvenue ! 👑</h2>
        <input
          type="text" placeholder="Ton prénom..."
          value={name} onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl mb-4 bg-[#5C3317]/50 border border-[#C9963A]/35 text-[#FAF4EC]"
        />
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E]"
        >
          Découvrir mes styles
        </button>
      </motion.div>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const hideNav = ['/camera', '/analyze'].includes(location.pathname);

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
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('afrotresse_user_name')) setShowWelcome(true);
  }, []);

  return (
    <BrowserRouter>
      {showWelcome && <WelcomePopup onDone={() => setShowWelcome(false)} />}
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
