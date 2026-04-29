import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCredits, syncCreditsFromServer } from '../services/credits.js';
import Seo from "../components/Seo.jsx";
import { getApprovedReviews } from '../services/reviews.js';

const SLIDES = [
  { id: 1, image: '/Afrotresse1.jpg', style: 'Knotless Braids' },
  { id: 2, image: '/Afrotresse2.jpg', style: 'Box Braids' },
  { id: 3, image: '/Afrotresse2.jpg', style: 'Cornrows' }, // Ajusté selon tes imports
  { id: 4, image: '/Afrotresse4.jpg', style: 'Fulani Braids' },
  { id: 5, image: '/Afrotresse5.jpg', style: 'Senegalese Twist' },
  { id: 6, image: '/Afrotresse6.jpg', style: 'Ghana Braids' },
];

const MAINTENANCE_MESSAGE = "✨ AfroTresse évolue pour vous ! Travaux de maintenance en cours : merci de votre patience. ✨";

const INTERVAL = 3500;

function TickerBar() {
  return (
    <div className="w-full overflow-hidden z-50 relative" style={{ background: '#C9963A', height: '28px' }}>
      <div className="flex items-center h-full">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
          className="flex items-center whitespace-nowrap"
          style={{ willChange: 'transform' }}
        >
          {/* Répétition pour une boucle infinie fluide */}
          {[0, 1, 2, 3].map(i => (
            <span key={i} className="font-body text-[11px] font-bold px-10 uppercase tracking-tight" style={{ color: '#2C1A0E' }}>
              {MAINTENANCE_MESSAGE}
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

  const storedName = localStorage.getItem('afrotresse_user_name');
  const userName = storedName || 'Reine';
  const [showArrow] = useState(true);
  const [socialProof, setSocialProof] = useState(null);

  const [credits, setCreditsState] = useState(() => getCredits());

  useEffect(() => {
    syncCreditsFromServer()
      .then(c => { if (c !== undefined) setCreditsState(c); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getApprovedReviews({ limit: 50, minRating: 4 }).then(reviews => {
      if (!reviews.length) return;
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      setSocialProof({ avg: avg.toFixed(1), count: reviews.length });
    }).catch(() => {});
  }, []);

  const handleStart = () => {
    if (credits === 0) {
      navigate('/credits');
    } else {
      navigate('/camera');
    }
  };

  const next = useCallback(() => setCurrent(prev => (prev + 1) % SLIDES.length), []);
  
  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  return (
    <>
      <Seo />
      <div className="flex flex-col w-full overflow-hidden" style={{ height: '100dvh', background: '#2C1A0E' }}>
        <TickerBar />

        <div className="relative flex-1 overflow-hidden" onClick={handleStart} style={{ cursor: 'pointer' }}>

          {SLIDES.map((s, i) => (
            <motion.div
              key={s.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: i === current ? 1 : 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{ zIndex: i === current ? 2 : 1, willChange: 'opacity', transform: 'translateZ(0)' }}
            >
              <img
                src={s.image}
                alt={s.style}
                className="w-full h-full"
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </motion.div>
          ))}

          {/* OVERLAYS */}
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-x-0 top-0 h-40 z-20"
            style={{ background: 'linear-gradient(to bottom, rgba(44,26,14,0.85), transparent)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 z-20"
            style={{ background: 'linear-gradient(to top, rgba(44,26,14,0.98), transparent)' }} />

          {/* LOGO */}
          <div className="absolute inset-x-0 top-0 z-30 px-5 pt-4">
            <div className="flex flex-col leading-tight">
              <span className="font-display text-4xl leading-none">
                <span className="text-white font-bold">Afro</span>
                <span className="text-[#C9963A] font-bold">Tresse</span>
              </span>
              <span className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Chaque visage a sa tresse
              </span>
            </div>
          </div>

          {/* TEXTE */}
          <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-36">
            <h1 className="font-display text-2xl font-medium" style={{ lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.65)' }}>
              <span style={{ color: '#C9963A', fontWeight: 600 }}>Un selfie, et</span>{' '}
              <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
                découvre<br />
                ta meilleure coiffure<br />
                <span style={{ fontSize: '0.62em' }}>avant d'aller chez ta coiffeuse.</span>
              </span>
            </h1>

            <div className="mt-4 flex gap-1.5 relative">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={'h-1 rounded-full transition-all duration-300 ' +
                    (i === current ? 'w-8 bg-[#C9963A]' : 'w-2 bg-white/30')}
                />
              ))}
            </div>

            {/* BADGE PREUVE SOCIALE */}
            {socialProof && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex items-center gap-3"
              >
                <div className="flex -space-x-2">
                  {[
                    { initial: 'A', bg: '#C9963A' },
                    { initial: 'F', bg: '#8B5E3C' },
                    { initial: 'K', bg: '#6B3F2A' },
                    { initial: 'M', bg: '#A0522D' },
                  ].map((a, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2"
                      style={{ background: a.bg, borderColor: '#2C1A0E', color: '#FAF4EC', zIndex: 4 - i }}
                    >
                      {a.initial}
                    </div>
                  ))}
                </div>

                <div className="w-px h-6 bg-white/15" />

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">⭐⭐⭐⭐⭐</span>
                    <span className="text-[#C9963A] font-black text-xs">{socialProof.avg}</span>
                  </div>
                  <span className="text-white/55 text-[10px] font-medium">
                    {socialProof.count}+ reines satisfaites
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* CTA */}
          <div className="absolute bottom-20 left-0 right-0 z-40 flex flex-col items-center gap-3 pointer-events-none px-5">
            <AnimatePresence>
              {showArrow && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-1"
                >
                  <span className="text-white/50 text-xs font-medium tracking-wide uppercase">Appuie ici pour commencer</span>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4v16M4 12l8 8 8-8" stroke="#C9963A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </>
  );
}
