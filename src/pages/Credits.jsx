import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
        paddingBottom: 0,
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

function FedaPayModal({ url, onClose, onSuccess }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Polling : détecte le paiement via les crédits, pas via le redirect ──
  useEffect(() => {
    let attempts = 0;
    let timer;
    const creditsBefore = parseInt(localStorage.getItem('afrotresse_credits') || '0', 10);

    const poll = async () => {
      attempts++;
      try {
        const { syncCreditsFromServer } = await import('../services/credits.js');
        const synced = await syncCreditsFromServer();
        if (synced != null && synced > creditsBefore) {
          onSuccess();
          return;
        }
      } catch {}
      if (attempts < 30) timer = setTimeout(poll, 2000);
    };

    // Démarrer immédiatement
    poll();
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)',
        paddingBottom: 0,
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
  let sessionId;

  if (userId) {
    sessionId = userId;
  } else {
    // Lire depuis localStorage d'abord (déjà préchargé au montage)
    const fp = localStorage.getItem('afrotresse_fp')
            || localStorage.getItem('afrotresse_fingerprint');
    if (fp) {
      sessionId = `fp_${fp}`;
    } else {
      // Fallback : charger FingerprintJS si pas encore en cache
      const { getSessionIdWithFp } = await import('../services/fingerprint.js');
      sessionId = await getSessionIdWithFp();
    }
  }

  const response = await fetch('/api/fedapay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack, email, sessionId }),
  });
  return response.json();
}

// ── Page ─────────────────────────────────────────────────────────
export default function Credits() {
  const navigate = useNavigate();
  const [selected, setSelected]             = useState('allie');
  const [loading, setLoading]               = useState(false);
  const [paymentUrl, setPaymentUrl]         = useState(null);
  const [errorMsg, setErrorMsg]             = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal]   = useState(false);
  const [authLoading, setAuthLoading]       = useState(null); // 'google' | 'magic' | null
  const [magicEmail, setMagicEmail]           = useState('');
  const [magicSent, setMagicSent]             = useState(false);
  const [showMagicForm, setShowMagicForm]     = useState(false);
  const [successPack, setSuccessPack]       = useState(null);
  const payButtonRef = useRef(null);

  // Au montage : si un pack est en attente + session disponible → lancer FedaPay
  // Ne dépend pas de ?pending=true dans l'URL (trop fragile)
  useEffect(() => {
    window.history.replaceState({}, '', '/credits'); // Nettoyer l'URL quoi qu'il arrive

    const pendingPack = getPendingPack();
    if (!pendingPack) return; // Rien en attente → sortir

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
          setErrorMsg(null);
          try {
            const result = await callFedaPay(pendingPack, session?.user?.id || null, session?.user?.email || '');
            if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
            else setErrorMsg(matchFedaError(result.error));
          } catch {
            setErrorMsg("Une erreur est survenue. Veuillez reessayer.");
          } finally {
            setLoading(false);
          }
          return; // Session trouvée → stop
        }
      } catch {}
      if (attempts < 10) timer = setTimeout(tryLaunch, 500); // Réessayer dans 500ms
    };

    tryLaunch();
    return () => clearTimeout(timer);
  }, []);

  // ── Détecter ?payment=success dans l'URL + sync crédits ─────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    const pack = params.get('pack');
    setPaymentSuccess(true);
    setSuccessPack(pack);
    window.history.replaceState({}, '', '/credits');

    const startPolling = async () => {
      const { syncCreditsFromServer, getCredits } = await import('../services/credits.js');
      const creditAvantPaiement = getCredits();
      let attempts = 0;

      const poll = async () => {
        attempts++;
        try {
          const synced = await syncCreditsFromServer();
          if (synced != null && synced > creditAvantPaiement) return;
        } catch {}
        if (attempts < 10) setTimeout(poll, 3000);
      };

      setTimeout(poll, 2000);
    };

    startPolling();
  }, []);

  // ── Pré-charger le fingerprint ───────────────────────────────────
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

  // ── Nettoyage à la navigation ────────────────────────────────────
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
      // Pas besoin d'être connectée pour payer
      // callFedaPay utilise getSessionIdWithFp() si pas de session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const email  = session?.user?.email || localStorage.getItem('afrotresse_email') || '';

      const result = await callFedaPay(selected, userId, email);

      if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setErrorMsg(matchFedaError(result.error));
      }
    } catch {
      setErrorMsg('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!magicEmail.trim()) return;
    setAuthLoading('magic');
    setPendingPack(selected);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/credits?pending=true`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch {
      clearPendingPack();
      setErrorMsg("Impossible d'envoyer le lien. Vérifie ton adresse email.");
    } finally {
      setAuthLoading(null);
    }
  };

  // ── FIX : sauvegarder le pack dans localStorage (résiste aux redirections OAuth)
  const handleSocialLogin = async (provider) => {
    setAuthLoading(provider);
    setPendingPack(selected); // localStorage + timestamp
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/credits?pending=true`,
        },
      });
    } catch {
      setAuthLoading(null);
      clearPendingPack();
    }
  };

  // ── Écran de succès ──────────────────────────────────────────────
  if (paymentSuccess) {
    const packInfo = PACKS_CONFIG[successPack];
    return (
      <div
        className="text-white font-sans flex flex-col items-center justify-center"
        style={{ backgroundColor: '#1E1008', height: '100dvh', padding: '0 24px' }}
      >
        <Seo title="Paiement réussi - AfroTresse" />
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ color: '#C29036', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Paiement réussi !
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
            {packInfo
              ? `Ton pack ${packInfo.label} (${packInfo.credits} crédits) a été activé.`
              : 'Tes crédits ont été ajoutés à ton compte.'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 32 }}>
            Si tes crédits ne s'affichent pas encore, patiente quelques secondes et rafraîchis la page Profil.
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            style={{
              width: '100%', padding: '16px',
              borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, #C29036, #8B4513)',
              color: '#fff',
              fontSize: 13, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Voir mon solde →
          </button>

          <div style={{
            padding: '14px 16px',
            borderRadius: 14,
            border: '1px solid rgba(194,144,54,0.3)',
            background: 'rgba(194,144,54,0.08)',
            textAlign: 'left',
          }}>
            <p style={{ color: '#C29036', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              🔐 Sécurise tes crédits
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.6, marginBottom: 10 }}>
              Sans compte, tes crédits sont liés à cet appareil. Si tu changes de téléphone ou vides ton cache, ils disparaissent.
            </p>
            <button
              onClick={() => window.location.href = '/magic-link'}
              style={{
                width: '100%', padding: '10px',
                borderRadius: 10, border: 'none',
                background: 'rgba(194,144,54,0.2)',
                color: '#C29036',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Sécuriser mes crédits →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="text-white font-sans"
      style={{ backgroundColor: '#1E1008', height: '100dvh', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '100px', WebkitOverflowScrolling: 'touch' }}
    >
      <Seo title="Acheter des crédits - AfroTresse" />

      {/* ── MODALE AUTH ── */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 460,
                background: '#1E1008',
                borderRadius: '28px 28px 0 0',
                padding: '32px 24px 48px',
                border: '1px solid rgba(194,144,54,0.3)',
                borderBottom: 'none',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(194,144,54,0.3)' }}/>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👑</div>
                <h2 style={{ color: '#C29036', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                  Connecte-toi pour payer
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>
                  Tes crédits seront liés à ton compte — accessibles sur n'importe quel appareil, sans jamais les perdre.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Google */}
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={authLoading !== null}
                  style={{
                    width: '100%', padding: '16px',
                    borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)',
                    background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    opacity: authLoading === 'facebook' ? 0.5 : 1,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span style={{ color: '#333', fontSize: 14, fontWeight: 600 }}>
                    {authLoading === 'google' ? 'Connexion…' : 'Continuer avec Google'}
                  </span>
                </button>

                {/* Magic Link — accordéon */}
                {!magicSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Bouton accordéon */}
                    <button
                      onClick={() => setShowMagicForm(v => !v)}
                      disabled={authLoading !== null}
                      style={{
                        width: '100%', padding: '15px',
                        borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer',
                        opacity: authLoading === 'google' ? 0.5 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>✉️</span>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500 }}>
                          Continuer par email
                        </span>
                      </div>
                      <span style={{
                        color: 'rgba(255,255,255,0.35)', fontSize: 12,
                        transform: showMagicForm ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                      }}>▼</span>
                    </button>

                    {/* Formulaire dépliable */}
                    {showMagicForm && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="email"
                            placeholder="Ton adresse email"
                            value={magicEmail}
                            onChange={e => setMagicEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                            autoFocus
                            style={{
                              width: '100%', padding: '14px',
                              borderRadius: 12, border: '1px solid rgba(194,144,54,0.3)',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#fff', fontSize: 14, outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <button
                          onClick={handleMagicLink}
                          disabled={authLoading !== null || !magicEmail.trim()}
                          style={{
                            width: '100%', padding: '14px',
                            borderRadius: 12, border: 'none',
                            background: magicEmail.trim() ? '#C29036' : 'rgba(194,144,54,0.25)',
                            color: magicEmail.trim() ? '#1E1008' : 'rgba(255,255,255,0.3)',
                            fontSize: 14, fontWeight: 700,
                            cursor: (!magicEmail.trim() || authLoading) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {authLoading === 'magic' ? 'Envoi en cours…' : 'Envoyer le lien'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '18px 16px', borderRadius: 14,
                    background: 'rgba(194,144,54,0.1)',
                    border: '1px solid rgba(194,144,54,0.3)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                    <p style={{ color: '#C29036', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      Vérifie ta boîte mail
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.5 }}>
                      Lien envoyé à <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{magicEmail}</strong>.
                      Clique dessus pour revenir et payer.
                    </p>
                  </div>
                )}

                {/* Annuler */}
                <button
                  onClick={() => {
                    setShowAuthModal(false);
                    clearPendingPack(); // Nettoyer si elle annule
                  }}
                  style={{
                    width: '100%', padding: '14px',
                    borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
        {paymentUrl && (
          <FedaPayModal
            key="modal"
            url={paymentUrl}
            onClose={() => setPaymentUrl(null)}
            onSuccess={() => {
              setPaymentUrl(null);
              navigate('/profile');
            }}
          />
        )}
        {errorMsg && (
          <ErrorToast key="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-10">

        {/* Bandeau contextuel */}
        <div
          className="rounded-2xl px-5 py-3 flex items-center gap-3 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(194,144,54,0.15), rgba(194,144,54,0.05))',
            border: '1px solid rgba(194,144,54,0.3)',
          }}
        >
          <span className="text-lg flex-shrink-0">✨</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
            Tes crédits sont épuisés! Recharge pour continuer tes analyses
          </p>
        </div>

        {/* Titre */}
        <h1
          className="text-3xl font-bold text-center mb-10"
          style={{ color: '#C29036' }}
        >
          Choisis ton pack
        </h1>

        {/* Packs */}
        <div className="flex flex-col gap-5 mb-8">
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
                  <div className="text-right flex-shrink-0 ml-4">
                    <div>
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
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      = {pricePerCredit(pack)} FCFA/analyse
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Parrainage */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4 mb-6"
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
