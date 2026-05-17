import { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
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

const pricePerCredit = (pack) => Math.round(pack.price / pack.credits);

// Durée de validité du pending pack : 15 minutes
const PENDING_TTL_MS = 15 * 60 * 1000;

function getPendingPack() {
  const pack = localStorage.getItem('afrotresse_pending_pack');
  const ts   = localStorage.getItem('afrotresse_pending_pack_ts');
  if (!pack || !ts) return null;
  if (Date.now() - parseInt(ts, 10) > PENDING_TTL_MS) {
    localStorage.removeItem('afrotresse_pending_pack');
    localStorage.removeItem('afrotresse_pending_pack_ts');
    return null;
  }
  return pack;
}

function clearPendingPack() {
  localStorage.removeItem('afrotresse_pending_pack');
  localStorage.removeItem('afrotresse_pending_pack_ts');
}

function setPendingPack(pack) {
  localStorage.setItem('afrotresse_pending_pack', pack);
  localStorage.setItem('afrotresse_pending_pack_ts', Date.now().toString());
}

function matchFedaError(msg = '') {
  if (!msg) return 'Une erreur est survenue. Veuillez réessayer.';
  const lower = msg.toLowerCase();
  if (lower.includes('fonds') || lower.includes('funds') || lower.includes('balance') || lower.includes('suffis'))
    return 'Fonds insuffisants sur votre compte. Veuillez créditer votre balance et réessayer.';
  if (lower.includes('échou') || lower.includes('failed'))
    return 'Transaction échouée. Veuillez réessayer.';
  return msg;
}

// ── Portals ──────────────────────────────────────────────────────

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
        paddingBottom: 80,
      }}
    >
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
        zIndex: 45,
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

// ── Fonction utilitaire : appel API FedaPay ───────────────────────

async function callFedaPay(pack, userId, email = '') {
  const response = await fetch('/api/fedapay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack, email, sessionId: userId }),
  });
  return response.json();
}

// ── Page ─────────────────────────────────────────────────────────
export default function Credits() {
  const [selected, setSelected]             = useState('allie');
  const [loading, setLoading]               = useState(false);
  const [paymentUrl, setPaymentUrl]         = useState(null);
  const [errorMsg, setErrorMsg]             = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal]   = useState(false);
  const [authLoading, setAuthLoading]       = useState(null);
  const [magicEmail, setMagicEmail]         = useState('');
  const [magicSent, setMagicSent]           = useState(false);
  const [showMagicForm, setShowMagicForm]   = useState(false);
  const [successPack, setSuccessPack]       = useState(null);
  const payButtonRef = useRef(null);

  useEffect(() => {
    window.history.replaceState({}, '', '/credits');

    const pendingPack = getPendingPack();
    if (!pendingPack) return;

    let attempts = 0;
    let timer;

    const tryLaunch = async () => {
      attempts++;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          clearPendingPack();
          setSelected(pendingPack);
          setLoading(true);
          try {
            const result = await callFedaPay(pendingPack, session.user.id, session.user.email || '');
            if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
            else setErrorMsg(matchFedaError(result.error));
          } catch {
            setErrorMsg("Une erreur est survenue. Veuillez reessayer.");
          } finally {
            setLoading(false);
          }
          return;
        }
      } catch {}
      if (attempts < 10) timer = setTimeout(tryLaunch, 500);
    };

    tryLaunch();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const pack = params.get('pack');
      setPaymentSuccess(true);
      setSuccessPack(pack);
      window.history.replaceState({}, '', '/credits');
    }
  }, []);

  useEffect(() => {
    const preloadFp = async () => {
      try {
        const cached = localStorage.getItem('afrotresse_fp');
        if (!cached) {
          const { getFingerprint } = await import('../services/fingerprint.js');
          await getFingerprint();
        }
      } catch {}
    };
    preloadFp();
  }, []);

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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setLoading(false);
        setShowAuthModal(true);
        return;
      }

      const userId = session.user.id;
      const email  = session.user.email || localStorage.getItem('afrotresse_email') || '';

      const result = await callFedaPay(selected, userId, email);

      if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
      else setErrorMsg(matchFedaError(result.error));
    } catch {
      setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {};
  const handleSocialLogin = async () => {};

  if (paymentSuccess) return <div>SUCCESS</div>;

  return (
    <div style={{ background: '#1E1008', minHeight: '100vh' }}>
      <Seo title="Acheter crédits - AfroTresse" />

      <div style={{ padding: 20 }}>
        {Object.entries(PACKS_CONFIG).map(([key, p]) => (
          <div key={key} onClick={() => setSelected(key)}>
            <h3>{p.label}</h3>
            <p>{p.description}</p>
            <strong>{p.price}</strong>
          </div>
        ))}

        <button ref={payButtonRef} onClick={handleBuy}>
          Payer
        </button>
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div>
            <div>
              Connexion requise

              {/* Google button was here in original (cut in paste) */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
        }
