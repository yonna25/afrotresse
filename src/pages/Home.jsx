import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  { id: 1, image: '/Afrotresse1.jpg', style: 'Knotless Braids', badge: '⚡️ TENDANCE #1', accent: '#C9963A' },
  { id: 2, image: '/Afrotresse2.jpg', style: 'Box Braids', badge: '🔥 POPULAIRE', accent: '#E8B96A' },
  { id: 3, image: '/Afrotresse3.jpg', style: 'Cornrows', badge: '✨ COUP DE CŒUR', accent: '#C9963A' },
  { id: 4, image: '/Afrotresse4.jpg', style: 'Fulani Braids', badge: '👑 PREMIUM', accent: '#E8B96A' },
  { id: 5, image: '/Afrotresse5.jpg', style: 'Senegalese Twist', badge: '💛 CLASSIQUE', accent: '#C9963A' },
  { id: 6, image: '/Afrotresse6.jpg', style: 'Ghana Braids', badge: '🌟 NOUVEAUTÉ', accent: '#E8B96A' },
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
  const text = TICKER_MESSAGES.join('   ✺   ');
  const innerRef = useRef(null);
  const [offset, setOffset] = useState(-2000);

  useEffect(() => {
    if (innerRef.current) {
      const w = innerRef.current.scrollWidth;
      setOffset(-(w / 3));
    }
  }, []);

  return (
    <div className="w-full overflow-hidden z-50 relative" style={{ background: '#C9963A', height: '28px' }}>
      <div className="flex items-center h-full">
        <motion.div
          ref={innerRef}
          animate={{ x: [0, offset] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="flex items-center gap-0 whitespace-nowrap"
        >
          {[0, 1, 2].map(i => (
            <span key={i} className="font-body text-xs font-semibold px-8" style={{ color: '#2C1A0E' }}>
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
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  const handleStart = () => {
    navigate('/camera');
  };

  const next = useCallback(() => setCurrent(prev => (prev + 1) % SLIDES.length), []);

  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div className="flex flex-col w-full bg-brown overflow-hidden" style={{ height: '100dvh' }}>
      <TickerBar />

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <img src={slide.image} alt={slide.style} className="w-full h-full object-cover object-top" />
          </motion.div>
        </AnimatePresence>

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-40 z-10" style={{ background: 'linear-gradient(to bottom, rgba(44,26,14,0.85), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-10" style={{ background: 'linear-gradient(to top, rgba(44,26,14,0.98), transparent)' }} />

        {/* Logo & Header */}
        <div className="absolute inset-x-0 top-0 z-30 px-5 pt-4 flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            <img
              src="/icons/Logo.png"
              alt="AfroTresse"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="font-display text-2xl leading-none">
              <span className="text-white font-bold">Afro</span>
              <span className="text-[#C9963A] font-bold">Tresse</span>
            </span>
            <span className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Chaque visage a sa tresse
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-36">
          <h1 className="font-display text-2xl text-white font-bold leading-tight">
            Prête pour ton nouveau look,
          </h1>
          <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: '#C9963A' }}>
            {userName} ? ✨
          </h1>

          <p className="mt-3 text-sm font-body leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Découvre les coiffures qui te vont vraiment en quelques secondes.
          </p>

          {/* Indicateurs */}
          <div className="mt-4 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-[#C9963A]' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bouton */}
        <div className="absolute bottom-16 left-0 right-0 z-40 flex flex-col items-center pointer-events-none">
          <div className="relative pointer-events-auto">
            <button
              onClick={handleStart}
              className="px-10 py-4 rounded-full font-display font-bold text-lg shadow-2xl transition-transform active:scale-95"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
            >
              Analyser mon visage 🤳🏾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
