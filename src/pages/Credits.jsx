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

const PENDING_KEY = 'afrotresse_pending_pack';
const PENDING_TS = 'afrotresse_pending_pack_ts';
const TTL = 15 * 60 * 1000;

function setPendingPack(pack) {
  localStorage.setItem(PENDING_KEY, pack);
  localStorage.setItem(PENDING_TS, Date.now().toString());
}

function getPendingPack() {
  const pack = localStorage.getItem(PENDING_KEY);
  const ts = localStorage.getItem(PENDING_TS);
  if (!pack || !ts) return null;

  if (Date.now() - parseInt(ts, 10) > TTL) {
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem(PENDING_TS);
    return null;
  }

  return pack;
}

function clearPendingPack() {
  localStorage.removeItem(PENDING_KEY);
  localStorage.removeItem(PENDING_TS);
}

function matchFedaError(msg = '') {
  const lower = msg.toLowerCase();
  if (lower.includes('fonds') || lower.includes('balance') || lower.includes('suffis')) {
    return 'Fonds insuffisants. Recharge ton compte et réessaie.';
  }
  if (lower.includes('failed') || lower.includes('échou')) {
    return 'Transaction échouée. Réessaie.';
  }
  return msg || 'Erreur inconnue.';
}

async function callFedaPay(pack, userId, email = '') {
  const res = await fetch('/api/fedapay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack, sessionId: userId, email }),
  });

  return res.json();
}

export default function Credits() {
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const payButtonRef = useRef(null);

  // ── AUTO-RESUME APRÈS OAUTH (SOURCE UNIQUE) ──
  useEffect(() => {
    const pendingPack = getPendingPack();
    if (!pendingPack) return;

    let attempts = 0;
    let timer;

    const run = async () => {
      attempts++;

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.id) {
        try {
          const result = await callFedaPay(
            pendingPack,
            session.user.id,
            session.user.email || ''
          );

          clearPendingPack();

          if (result.paymentUrl) {
            setPaymentUrl(result.paymentUrl);
          } else {
            setErrorMsg(matchFedaError(result.error));
          }
        } catch (e) {
          setErrorMsg('Erreur paiement. Réessaie.');
        }
        return;
      }

      if (attempts < 10) {
        timer = setTimeout(run, 600);
      }
    };

    run();
    return () => clearTimeout(timer);
  }, []);

  // ── SELECT PACK ──
  const handleSelect = (key) => {
    setSelected(key);
    setErrorMsg(null);
    setTimeout(() => {
      payButtonRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  // ── PAYMENT ENTRY POINT ──
  const handleBuy = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setPendingPack(selected);
        setLoading(false);
        setShowAuthModal(true);
        return;
      }

      const result = await callFedaPay(
        selected,
        session.user.id,
        session.user.email || ''
      );

      if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setErrorMsg(matchFedaError(result.error));
      }

    } catch (e) {
      setErrorMsg('Erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ── GOOGLE OAUTH ──
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setPendingPack(selected);

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      clearPendingPack();
      setLoading(false);
    }
  };

  // ── UI PAYMENT MODAL ──
  if (paymentUrl) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 999 }}>
        <iframe
          src={paymentUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>,
      document.body
    );
  }

  return (
    <div style={{ background: '#1E1008', minHeight: '100vh', color: '#fff' }}>
      <Seo title="Acheter crédits - AfroTresse" />

      {/* PACKS */}
      <div style={{ padding: 20 }}>
        {Object.entries(PACKS_CONFIG).map(([key, p]) => (
          <div
            key={key}
            onClick={() => handleSelect(key)}
            style={{
              padding: 16,
              marginBottom: 10,
              border: selected === key ? '2px solid #C29036' : '1px solid #333',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            <h3>{p.label}</h3>
            <p>{p.description}</p>
            <strong>{p.price} {p.currency}</strong>
          </div>
        ))}

        <button
          ref={payButtonRef}
          onClick={handleBuy}
          disabled={loading}
          style={{
            width: '100%',
            padding: 16,
            marginTop: 20,
            background: '#C29036',
            border: 'none',
            borderRadius: 12,
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Traitement...' : 'Payer'}
        </button>

        {errorMsg && (
          <p style={{ color: 'red', marginTop: 10 }}>{errorMsg}</p>
        )}
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ background: '#2a1208', padding: 24, borderRadius: 16 }}>
              <h3>Connexion requise</h3>

              <button
                onClick={handleGoogleAuth}
                style={{
                  marginTop: 12,
                  padding: 12,
                  width: '100%',
                  background: '#fff',
                  color: '#000',
                  borderRadius: 10,
                  border: 'none',
                }}
              >
                Continuer avec Google
              </button>

              <button
                onClick={() => setShowAuthModal(false)}
                style={{ marginTop: 10, color: '#aaa' }}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
