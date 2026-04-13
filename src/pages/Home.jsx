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

const INTERVAL = 3500;

export default function Home() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const handleStart = () => navigate('/camera');
  const next = useCallback(() => setCurrent(prev => (prev + 1) % SLIDES.length), []);

  useEffect(() => {
    timerRef.current = setInterval(next, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [next]);

  return (
    <div className="flex flex-col w-full overflow-hidden" style={{ height: '100dvh', background: '#2C1A0E' }}>

      <div className="relative flex-1 overflow-hidden">

        {SLIDES.map((s, i) => (
          <motion.div
            key={s.id}
            className="absolute inset-0"
            animate={{ opacity: i === current ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={s.image} className="w-full h-full object-cover object-top" />
          </motion.div>
        ))}

        <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-36">
          <h1 className="text-2xl text-white font-bold">
            Un selfie, et découvre
          </h1>
          <h1 className="text-2xl font-bold text-[#C9963A]">
            La meilleure coiffure
          </h1>
          <p className="mt-2 text-sm text-white/60">
            En 10 secondes seulement
          </p>
        </div>

        <div className="absolute bottom-24 left-0 right-0 z-40 flex flex-col items-center">
          <AnimatePresence>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
                <path d="M12 4v16M4 12l8 8 8-8" stroke="#C9963A" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </motion.div>
          </AnimatePresence>

          <button onClick={handleStart}
            className="mt-3 px-10 py-4 rounded-full font-bold text-lg"
            style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}>
            Découvrir mon style
          </button>
        </div>

      </div>
    </div>
  );
}
