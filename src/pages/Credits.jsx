import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Seo from "../components/Seo.jsx";

const PACKS_CONFIG = {
  decouverte: {
    label: 'Découverte',
    description: '3 essais pour découvrir ton style unique',
    credits: 3,
    price: 300,
    currency: 'FCFA',
  },
  allie: {
    label: '🤝 Allié',
    description: '10 essais + 2 bonus exclusifs',
    credits: 10,
    price: 900,
    currency: 'FCFA',
    popular: true,
  },
  vip: {
    label: '🚀 Accès VIP',
    description: '50 essais + 10 crédits / mois',
    credits: 50,
    price: 2500,
    currency: 'FCFA',
  },
};

function matchFedaError(msg = '') {
  if (!msg) return 'Une erreur est survenue. Veuillez réessayer.';
  const lower = msg.toLowerCase();
  if (lower.includes('fonds') || lower.includes('funds') || lower.includes('balance') || lower.includes('suffis'))
    return 'Fonds insuffisants sur votre compte. Veuillez créditer votre balance et réessayer.';
  if (lower.includes('échou') || lower.includes('failed'))
    return 'Transaction échouée. Veuillez réessayer.';
  return msg;
}

// ── Portals — z-index SOUS la BottomNav (z-50 = 50) ─────────────
// On utilise z-40 pour les overlays afin de ne jamais passer au-dessus de la nav

function LoadingOverlay() {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
        background: 'rgba(20,8,0,0.88)', backdropFilter: 'blur(6px)',
        // Laisser les événements passer sur la zone BottomNav (80px en bas)
        paddingBottom: 80,
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '3px solid rgba(194,144,54,0.2)',
          borderTopColor: '#C29036',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 4 }}>
          Préparation du paiement…
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
          Connexion sécurisée FedaPay en cours
        </p>
      </div>
    </motion.div>,
    document.body
  );
}

function FedaPayModal({ url, onClose }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)',
        // Laisser la BottomNav accessible
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', flexShrink: 0,
        borderBottom: '1px solid rgba(194,144,54,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            backgroundColor: '#C29036',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>💳</div>
          <div>
            <p style={{ fontWeight: 600, color: '#fff', fontSize: 13, lineHeight: 1.2 }}>
              Paiement sécurisé
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              FedaPay · Crypté SSL
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: 'none', color: '#fff', fontSize: 15,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {!iframeLoaded && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(194,144,54,0.2)',
              borderTopColor: '#C29036',
            }}
          />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Chargement du paiement…
          </p>
        </div>
      )}

      <iframe
        src={url}
        title="Paiement FedaPay"
        style={{
          flex: 1, width: '100%', border: 'none',
          display: iframeLoaded ? 'block' : 'none',
        }}
        onLoad={() => setIframeLoaded(true)}
        allow="payment"
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '8px 0', flexShrink: 0,
        fontSize: 10, color: 'rgba(255,255,255,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        🔒 Paiement 100 % sécurisé · Ne jamais partager vos codes
      </div>
    </motion.div>,
    document.body
  );
}

function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        position: 'fixed', bottom: 100, left: 16, right: 16,
        zIndex: 45,  // juste en dessous de la nav (z-50)
        maxWidth: 400, margin: '0 auto',
        borderRadius: 18, padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'linear-gradient(135deg, #3D0E0E, #2A0808)',
        border: '1px solid rgba(255,80,80,0.3)',
        boxShadow: '0 4px 24px rgba(255,60,60,0.18)',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: 13, color: '#ff9090', marginBottom: 3 }}>
          Paiement non abouti
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,200,200,0.7)' }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        style={{
          fontSize: 16, color: 'rgba(255,150,150,0.6)',
          background: 'none', border: 'none', cursor: 'pointer',
          flexShrink: 0, marginTop: 2, lineHeight: 1,
        }}
      >✕</button>
    </motion.div>,
    document.body
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function Credits() {
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const payButtonRef = useRef(null);

  // Nettoyage à la navigation
  useEffect(() => {
    return () => {
      setLoading(false);
      setPaymentUrl(null);
      setErrorMsg(null);
    };
  }, []);

  const handleSelect = (key) => {
    setSelected(key);
    setErrorMsg(null);
    setTimeout(() => {
      payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleBuy = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabaseAuth = localStorage.getItem('sb-fowatshrtuzyyqsvvpxu-auth-token');
      let userId = null;
      if (supabaseAuth) {
        try { userId = JSON.parse(supabaseAuth)?.user?.id; } catch {}
      }
      const sessionId = userId || localStorage.getItem('afrotresse_session_id') || 'guest_user';

      const response = await fetch('/api/fedapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: selected,
          email: localStorage.getItem('afrotresse_email') || '',
          sessionId,
        }),
      });

      const result = await response.json();

      if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setErrorMsg(matchFedaError(result.error));
      }
    } catch {
      setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="text-white font-sans"
      style={{ backgroundColor: '#1E1008', height: '100dvh', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '100px', WebkitOverflowScrolling: 'touch' }}
    >
      <Seo title="Acheter des crédits - AfroTresse" />

      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
        {paymentUrl && (
          <FedaPayModal key="modal" url={paymentUrl} onClose={() => setPaymentUrl(null)} />
        )}
        {errorMsg && (
          <ErrorToast key="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-10">

        {/* Titre */}
        <h1
          className="text-3xl font-bold text-center mb-10"
          style={{ color: '#C29036' }}
        >
          Choisis ton pack
        </h1>

        {/* Packs */}
        <div className="flex flex-col gap-5 mb-10">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative">
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="text-[10px] font-semibold tracking-widest uppercase px-4 py-1 rounded-full"
                      style={{ backgroundColor: '#C29036', color: '#1E1008' }}
                    >
                      ★ Conseillé
                    </span>
                  </div>
                )}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(key)}
                  className="cursor-pointer rounded-3xl px-6 py-5 flex items-center justify-between"
                  style={{
                    backgroundColor: '#2C1A0E',
                    border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.07)',
                    boxShadow: isSelected ? '0 0 16px rgba(194,144,54,0.15)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Radio */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.25)',
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: '#C29036' }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white leading-tight">
                        {pack.label}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {pack.description}
                      </p>
                    </div>
                  </div>
                  {/* Prix */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      className="text-2xl font-bold leading-none"
                      style={{ color: '#C29036' }}
                    >
                      {pack.price}
                    </span>
                    <span
                      className="text-[10px] font-medium ml-1"
                      style={{ color: '#C29036', verticalAlign: 'super' }}
                    >
                      FCFA
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Bouton paiement */}
        <button
          ref={payButtonRef}
          onClick={handleBuy}
          disabled={loading}
          className="w-full font-semibold py-4 rounded-2xl text-sm tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C29036', color: '#1E1008' }}
        >
          <span>💳</span>
          <span>Payer avec FedaPay</span>
        </button>

        {/* Section bas */}
        <div className="mt-8 space-y-3 mb-4">

          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, #2C1A0E, #3a2010)',
              border: '1px solid rgba(194,144,54,0.18)',
            }}
          >
            <span className="text-xl flex-shrink-0">🎁</span>
            <div>
              <p className="font-medium text-white text-sm">Crédits offerts à l'inscription</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Commence gratuitement dès ton arrivée
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, #2C1A0E, #3a2010)',
              border: '1px solid rgba(194,144,54,0.18)',
            }}
          >
            <span className="text-xl flex-shrink-0">👥</span>
            <div className="flex-1">
              <p className="font-medium text-white text-sm">Parrainage</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Invite une amie et gagne des crédits
              </p>
            </div>
            <span
              className="font-semibold text-xs px-3 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'rgba(194,144,54,0.15)', color: '#C29036' }}
            >
              +2 crédits
            </span>
          </div>

          <div
            className="rounded-2xl px-5 py-4"
            style={{
              backgroundColor: '#2C1A0E',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-medium mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Paiements acceptés
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { icon: '📱', label: 'Mobile Money' },
                { icon: '💳', label: 'Carte bancaire' },
                { icon: '🏦', label: 'Virement' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
