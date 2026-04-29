import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Configuration ─────────────────────────────────────────────────
const WHATSAPP_NUMBER = '2290151360355'; // 👈 Remplace par ton numéro WhatsApp

const MESSAGES = {
  '/credits': "Bonjour, je suis sur la page des tarifs AfroTresse et j'aimerais avoir plus d'informations sur les packs.",
  '/profile': "Bonjour, j'ai besoin d'aide pour gérer mon compte AfroTresse.",
  default:    "Bonjour, j'ai besoin d'aide avec AfroTresse.",
};

const TRIGGER_PAGES   = ['/credits', '/profile'];
const DELAY_MS        = 90_000; // 90 secondes
const STORAGE_SHOWN   = 'afrotresse_whatsapp_shown';
const STORAGE_START   = 'afrotresse_whatsapp_timer_start';
const AUTO_HIDE_MS    = 600_000; // 10 minutes d'inactivité

function buildWhatsAppUrl(pathname) {
  const msg = MESSAGES[pathname] || MESSAGES.default;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export default function WhatsAppWidget() {
  const { pathname } = useLocation();
  const [visible, setVisible]   = useState(false);
  const [pulse,   setPulse]     = useState(false);

  const isTargetPage = TRIGGER_PAGES.includes(pathname);

  useEffect(() => {
    // Déjà affiché lors d'une visite précédente → afficher immédiatement
    if (localStorage.getItem(STORAGE_SHOWN) === 'true') {
      setVisible(true);
      return;
    }

    if (!isTargetPage) return;

    // Récupérer ou initialiser le timestamp de début
    let start = parseInt(localStorage.getItem(STORAGE_START) || '0', 10);
    if (!start) {
      start = Date.now();
      localStorage.setItem(STORAGE_START, String(start));
    }

    const elapsed  = Date.now() - start;
    const remaining = Math.max(0, DELAY_MS - elapsed);

    if (remaining === 0) {
      // Délai déjà écoulé
      setVisible(true);
      localStorage.setItem(STORAGE_SHOWN, 'true');
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      localStorage.setItem(STORAGE_SHOWN, 'true');
    }, remaining);

    return () => clearTimeout(timer);
  }, [isTargetPage, pathname]);

  // Auto-hide après 10 minutes d'inactivité
  useEffect(() => {
    if (!visible) return;
    let hideTimer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);

    const reset = () => {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    };

    window.addEventListener('touchstart', reset);
    window.addEventListener('click', reset);

    return () => {
      clearTimeout(hideTimer);
      window.removeEventListener('touchstart', reset);
      window.removeEventListener('click', reset);
    };
  }, [visible]);

  // Pulse toutes les 8s pour attirer l'attention
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 8000);
    return () => clearInterval(interval);
  }, [visible]);

  // Visible uniquement sur les pages cibles
  if (!visible || !isTargetPage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: pulse ? 1.12 : 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          position: 'fixed',
          bottom: 100, // au-dessus de la BottomNav
          right: 20,
          zIndex: 60,  // au-dessus de la BottomNav (z-50)
        }}
      >
        <a
          href={buildWhatsAppUrl(pathname)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contacter sur WhatsApp"
          style={{ textDecoration: 'none' }}
        >
          {/* Badge notification */}
          <div style={{ position: 'relative', width: 56, height: 56 }}>

            {/* Halo animé */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                backgroundColor: '#25D366',
                opacity: 0.3,
              }}
            />

            {/* Bouton principal */}
            <div style={{
              position: 'relative',
              width: 56, height: 56,
              borderRadius: '50%',
              backgroundColor: '#25D366',
              border: '2.5px solid #C29036',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(37,211,102,0.4), 0 0 0 3px rgba(194,144,54,0.2)',
            }}>
              {/* Icône WhatsApp SVG officielle */}
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.5L4 29l7.75-1.804A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z"
                  fill="white"
                />
                <path
                  d="M21.8 18.8c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z"
                  fill="#25D366"
                />
              </svg>
            </div>

            {/* Badge point rouge */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 14, height: 14,
              borderRadius: '50%',
              backgroundColor: '#FF3B30',
              border: '2px solid #1E1008',
            }} />
          </div>
        </a>
      </motion.div>
    </AnimatePresence>
  );
}
