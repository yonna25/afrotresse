import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
  '💛 -20 % sur ton premier pack avec le code AFRO20',
  '✨ Nouveau style disponible : Butterfly Locs',
  '🎁 Parraine une amie et gagne 2 essais gratuits',
];

const INTERVAL = 3500;

function TickerBar() {
  const text = TICKER_MESSAGES.join('   ✺   ');
  const innerRef = useRef(null);
  const [offset, setOffset] = useState(-2000);
  useEffect(() => {
    if (innerRef.current) setOffset(-(innerRef.current.scrollWidth / 3));
  }, []);
  return (
    <div className="w-full overflow-hidden z-50 relative" style={{ background: '#C9963A', height: '28px' }}>
      <div className="flex items-center h-full">
        <motion.div
          ref={innerRef}
          animate={{ x: [0, offset] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="flex items-center whitespace-nowrap"
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
  const navigate   = useNavigate();
  const [current, setCurrent] = useState(0);
  const timerRef   = useRef(null);
  const storedName = localStorage.getItem('afrotresse_user_name');
  const userName   = storedName || 'Reine';
  const [showArrow, setShowArrow] = useState(false);

  const handleStart = () => navigate('/camera');

  const next = useCallback(() => setCurrent(prev => (prev + 1) % SLIDES.length), []);
  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <div className="flex flex-col w-full overflow-hidden" style={{ height: '100dvh', background: '#2C1A0E' }}>
      <TickerBar />

      <div className="relative flex-1 overflow-hidden" style={{ background: '#2C1A0E' }}>

        {SLIDES.map((s, i) => (
          <motion.div
            key={s.id}
            className="absolute inset-0"
            animate={{ opacity: i === current ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ zIndex: i === current ? 2 : 1 }}
          >
            <img
              src={s.image}
              alt={s.style}
              className="w-full h-full object-cover object-top"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </motion.div>
        ))}

        <div className="absolute inset-x-0 top-0 h-40 z-10"
          style={{ background: 'linear-gradient(to bottom, rgba(44,26,14,0.85), transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 z-10"
          style={{ background: 'linear-gradient(to top, rgba(44,26,14,0.98), transparent)' }} />

        <div className="absolute inset-x-0 top-0 z-30 px-5 pt-4 flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            <img src="/icons/Logo.png" alt="AfroTresse" className="w-full h-full object-contain" />
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

        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-36">
          <h1 className="font-display text-2xl text-white font-bold leading-tight">
            Prête pour ton nouveau look,
          </h1>
          <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: '#C9963A' }}>
            {userName} ? ✨
          </h1>
          <p className="mt-3 text-sm font-body leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Un selfie, et découvre ta meilleure coiffure.
          </p>
          <div className="mt-4 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div key={i} className={'h-1 rounded-full transition-all duration-300 ' +
                (i === current ? 'w-8 bg-[#C9963A]' : 'w-2 bg-white/30')} />
            ))}
          </div>
        </div>

        <div className="absolute bottom-16 left-0 right-0 z-40 flex flex-col items-center gap-3 pointer-events-none">
          <AnimatePresence>
            {showArrow && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center pointer-events-none">
                <p className="text-white/80 text-xs font-bold mb-1">Appuie ici pour commencer</p>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v16M4 12l8 8 8-8" stroke="#C9963A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="pointer-events-auto">
            <button onClick={handleStart}
              className="px-10 py-4 rounded-full font-display font-bold text-lg shadow-2xl active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}>
              Découvrir mon style ✨
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
