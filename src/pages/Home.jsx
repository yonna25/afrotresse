import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { setCredits, PRICING } from '../services/credits.js';

const SLIDES = [
  { id: 1, image: '/Afrotresse1.jpg', style: 'Knotless Braids' },
  { id: 2, image: '/Afrotresse2.jpg', style: 'Box Braids' },
  { id: 3, image: '/Afrotresse3.jpg', style: 'Cornrows' },
  { id: 4, image: '/Afrotresse4.jpg', style: 'Fulani Braids' },
  { id: 5, image: '/Afrotresse5.jpg', style: 'Senegalese Twist' },
  { id: 6, image: '/Afrotresse6.jpg', style: 'Ghana Braids' },
];

const TICKER_MESSAGES = [
  '🎉 Offre spéciale : 3 essais virtuels au prix de 2',
  '👑 Rejoins +500 reines qui ont trouvé leur tresse parfaite',
  '💛 -20% sur ton premier pack avec le code AFRO20',
  '✨ Nouveau style disponible : Butterfly Locs',
  '🎁 Parraine une amie et gagne 2 essais gratuits',
];

const INTERVAL = 3500;

function TickerBar() {
  const text = TICKER_MESSAGES.join("   ✺   ");
  const innerRef = useRef(null);
  const [offset, setOffset] = useState(-2000);
  useEffect(() => {
    if (innerRef.current) setOffset(-(innerRef.current.scrollWidth / 3));
  }, []);
  return (
    <div className="w-full overflow-hidden z-50 relative" style={{ background: "#C9963A", height: "28px" }}>
      <div className="flex items-center h-full">
        <motion.div
          ref={innerRef}
          animate={{ x: [0, offset] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex items-center whitespace-nowrap"
        >
          {[0, 1, 2].map(i => (
            <span key={i} className="font-body text-xs font-semibold px-8" style={{ color: "#2C1A0E" }}>
              {text}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const storedName = localStorage.getItem("afrotresse_user_name");
  const userName   = storedName || "Reine";

  const [showPopup, setShowPopup] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showArrow, setShowArrow] = useState(false);

  // Popup apres 5 secondes si premiere visite
  useEffect(() => {
    if (!storedName) {
      const t = setTimeout(() => setShowPopup(true), 10000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (showPopup && inputRef.current) {
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

  const handleSubmit = () => {
    const finalName = nameInput.trim() || "Reine";
    localStorage.setItem("afrotresse_user_name", finalName);
    if (!localStorage.getItem("afrotresse_credits")) setCredits(PRICING.freeCredits);
    setShowPopup(false);
    setShowArrow(true);
  };

  const handleStart = () => navigate("/camera");

  const next = useCallback(() => setCurrent(prev => (prev + 1) % SLIDES.length), []);
  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div className="flex flex-col w-full overflow-hidden" style={{ height: "100dvh", background: "#2C1A0E" }}>
      <TickerBar />

      <div className="relative flex-1 overflow-hidden">

        {/* Slides */}
        <AnimatePresence initial={false}>
          <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }} className="absolute inset-0">
            <img src={slide.image} alt={slide.style} className="w-full h-full object-cover object-top" />
          </motion.div>
        </AnimatePresence>

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-40 z-10"
          style={{ background: "linear-gradient(to bottom, rgba(44,26,14,0.85), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-10"
          style={{ background: "linear-gradient(to top, rgba(44,26,14,0.98), transparent)" }} />

        {/* Logo */}
        <div className="absolute inset-x-0 top-0 z-30 px-5 pt-4 flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            <img src="/icons/Logo.png" alt="AfroTresse" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-2xl leading-none">
              <span className="text-white font-bold">Afro</span>
              <span className="text-[#C9963A] font-bold">Tresse</span>
            </span>
            <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
              Chaque visage a sa tresse
            </span>
          </div>
        </div>

        {/* Texte bas */}
        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-36">
          <h1 className="font-display text-2xl text-white font-bold leading-tight">
            Prête pour ton nouveau look,
          </h1>
          <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: "#C9963A" }}>
            {userName} ? ✨
          </h1>
          <p className="mt-3 text-sm font-body leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
            Découvre les coiffures qui te vont vraiment en quelques secondes.
          </p>
          <div className="mt-4 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div key={i} className={"h-1 rounded-full transition-all duration-300 " +
                (i === current ? "w-8 bg-[#C9963A]" : "w-2 bg-white/30")} />
            ))}
          </div>
        </div>

        {/* Fleche animee + bouton CTA */}
        <div className="absolute bottom-16 left-0 right-0 z-40 flex flex-col items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {showArrow && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center pointer-events-none">
                <p className="text-white/80 text-xs font-bold mb-1">Appuie ici pour commencer</p>
                <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12l7 7 7-7" stroke="#C9963A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="pointer-events-auto">
            <button onClick={handleStart}
              className="px-10 py-4 rounded-full font-display font-bold text-lg shadow-2xl active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
              Analyser mon visage 🤳🏾
            </button>
          </div>
        </div>

        {/* MINI POPUP NOM — glisse de droite, apres 5s, premiere visite */}
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center px-6"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            >
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="w-full rounded-[1.75rem] p-5"
                style={{
                  maxWidth: 300,
                  background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                  border: "1.5px solid rgba(201,150,58,0.5)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
                }}
              >
                {/* Titre */}
                <p className="text-center font-semibold mb-1"
                  style={{ color: "rgba(250,244,236,0.55)", fontSize: 12 }}>
                  Salut ! 👋🏾
                </p>
                <h2 className="text-center font-display font-black mb-4 leading-tight"
                  style={{ color: "#FAF4EC", fontSize: 22 }}>
                  Je t’aide en 10 secondes à trouver ta tresse parfaite ! ⏱
                </h2>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ton prénom..."
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl mb-3 outline-none text-sm font-semibold"
                  style={{
                    background: "rgba(92,51,23,0.6)",
                    border: "1px solid rgba(201,150,58,0.4)",
                    color: "#FAF4EC",
                  }}
                />

                {/* Bouton */}
                <button onClick={handleSubmit}
                  className="w-full py-3 rounded-2xl font-display font-black text-base shadow-xl active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                  C’est parti ! 🚀
                </button>

                <p className="text-center mt-2 font-semibold"
                  style={{ color: "rgba(201,150,58,0.7)", fontSize: 10 }}>
                  🎁 2 essais gratuits offerts
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
