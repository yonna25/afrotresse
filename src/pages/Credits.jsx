import { useState, useRef, useEffect } from 'react';
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
        background: 'rgba(30,16,8,0.98)', backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid rgba(194,144,54,0.2)',
          borderTopColor: '#C29036',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>
          Préparation du paiement…
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
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

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        onSuccess();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: '#1E1008',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', flexShrink: 0,
        borderBottom: '1px solid rgba(194,144,54,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto' }}>
          <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🔒 Connexion sécurisée FedaPay
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: 16,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: 'none', color: '#fff', fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {!iframeLoaded && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(194,144,54,0.2)',
              borderTopColor: '#C29036',
            }}
          />
        </div>
      )}

      <iframe
        src={url}
        title="Paiement FedaPay"
        style={{ flex: 1, width: '100%', border: 'none', display: iframeLoaded ? 'block' : 'none' }}
        onLoad={() => setIframeLoaded(true)}
        allow="payment"
      />
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
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed', bottom: 100, left: 16, right: 16, zIndex: 45,
        maxWidth: 400, margin: '0 auto', borderRadius: 16, padding: 16,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(135deg, #3D0E0E, #2A0808)',
        border: '1px solid rgba(255,80,80,0.2)',
      }}
    >
      <span style={{ fontSize: 16 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, lineHeight: 1.5, color: '#fff' }}>{message}</p>
      </div>
      <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
    </motion.div>,
    document.body
  );
}

async function callFedaPay(pack, userId, email = '') {
  let sessionId;
  if (userId) {
    sessionId = userId;
  } else {
    const fp = localStorage.getItem('afrotresse_fp') || localStorage.getItem('afrotresse_fingerprint');
    if (fp) {
      sessionId = `fp_${fp}`;
    } else {
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

export default function Credits() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(null);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [showMagicForm, setShowMagicForm] = useState(false);
  const [successPack, setSuccessPack] = useState(null);
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
          setErrorMsg(null);
          try {
            const result = await callFedaPay(pendingPack, session?.user?.id || null, session?.user?.email || '');
            if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
            else setErrorMsg(matchFedaError(result.error));
          } catch {
            setErrorMsg("Une erreur est survenue. Veuillez réessayer.");
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
      setSuccessPack(params.get('pack'));
      setPaymentSuccess(true);
      window.history.replaceState({}, '', '/credits');
    }
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
      const userId = session?.user?.id || null;
      const email  = session?.user?.email || localStorage.getItem('afrotresse_email') || '';
      const result = await callFedaPay(selected, userId, email);

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

  const handleMagicLink = async () => {
    if (!magicEmail.trim()) return;
    setAuthLoading('magic');
    setPendingPack(selected);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: { emailRedirectTo: `${window.location.origin}/credits?pending=true` },
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

  const handleSocialLogin = async (provider) => {
    setAuthLoading(provider);
    setPendingPack(selected);
    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/credits?pending=true` },
      });
    } catch {
      setAuthLoading(null);
      clearPendingPack();
    }
  };

  if (paymentSuccess) {
    const packInfo = PACKS_CONFIG[successPack];
    return (
      <div className="text-white font-sans flex flex-col items-center justify-center" style={{ backgroundColor: '#1E1008', height: '100dvh', padding: '0 24px' }}>
        <Seo title="Paiement réussi - AfroTresse" />
        <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>✨</div>
          <h1 style={{ color: '#C29036', fontSize: 24, fontWeight: 800, marginBottom: 8, tracking: '-0.02em' }}>
            Paiement réussi !
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, marginBottom: 32 }}>
            {packInfo ? `Ton pack ${packInfo.label} (${packInfo.credits} crédits) a bien été activé.` : 'Tes crédits ont bien été ajoutés à ton compte.'}
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            style={{
              width: '100%', padding: '16px', borderRadius: 16, border: 'none',
              background: '#C29036', color: '#1E1008',
              fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: 'pointer', boxShadow: '0 10px 20px rgba(194,144,54,0.15)'
            }}
          >
            Voir mon solde →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white font-sans" style={{ backgroundColor: '#1E1008', height: '100dvh', overflowY: 'auto', paddingBottom: '100px' }}>
      <Seo title="Acheter des crédits - AfroTresse" />

      {/* Modale d'Authentification */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 460, background: '#1E1008', borderRadius: '28px 28px 0 0', padding: '32px 24px 48px', border: '1px solid rgba(194,144,54,0.3)', borderBottom: 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(194,144,54,0.3)' }}/>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👑</div>
                <h2 style={{ color: '#C29036', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connecte-toi pour payer</h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6 }}>Tes crédits seront liés à ton compte — accessibles partout.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => handleSocialLogin('google')} disabled={authLoading !== null}
                  style={{ width: '100%', padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}
                >
                  <span style={{ color: '#333', fontSize: 14, fontWeight: 600 }}>{authLoading === 'google' ? 'Connexion…' : 'Continuer avec Google'}</span>
                </button>

                {!magicSent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={() => setShowMagicForm(v => !v)} disabled={authLoading !== null}
                      style={{ width: '100%', padding: '15px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 16 }}>✉️</span>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500 }}>Continuer par email</span>
                      </div>
                      <span style={{ transform: showMagicForm ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                    {showMagicForm && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          type="email" placeholder="Ton adresse email" value={magicEmail}
                          onChange={e => setMagicEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                          style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid rgba(194,144,54,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, outline: 'none' }}
                        />
                        <button
                          onClick={handleMagicLink} disabled={authLoading !== null || !magicEmail.trim()}
                          style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: magicEmail.trim() ? '#C29036' : 'rgba(194,144,54,0.25)', color: magicEmail.trim() ? '#1E1008' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                        >
                          {authLoading === 'magic' ? 'Envoi en cours…' : 'Envoyer le lien'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '18px 16px', borderRadius: 14, background: 'rgba(194,144,54,0.1)', border: '1px solid rgba(194,144,54,0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
                    <p style={{ color: '#C29036', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Vérifie ta boîte mail</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Lien envoyé à {magicEmail}.</p>
                  </div>
                )}
                <button onClick={() => { setShowAuthModal(false); clearPendingPack(); }} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-10">
        <div className="rounded-2xl px-5 py-3 flex items-center gap-3 mb-6" style={{ background: 'linear-gradient(135deg, rgba(194,144,54,0.15), rgba(194,144,54,0.05))', border: '1px solid rgba(194,144,54,0.3)' }}>
          <span className="text-lg flex-shrink-0">✨</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>Tes crédits sont épuisés ! Recharge pour continuer tes analyses.</p>
        </div>

        <h1 className="text-3xl font-bold text-center mb-10" style={{ color: '#C29036' }}>Choisis ton pack</h1>

        <div className="flex flex-col gap-5 mb-8">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative">
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[10px] font-semibold tracking-widest uppercase px-4 py-1 rounded-full" style={{ backgroundColor: '#C29036', color: '#1E1008' }}>★ Conseillé</span>
                  </div>
                )}
                <motion.div
                  whileTap={{ scale: 0.98 }} onClick={() => handleSelect(key)}
                  className="cursor-pointer rounded-3xl px-6 py-5 flex items-center justify-between"
                  style={{ backgroundColor: '#2C1A0E', border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.07)', boxShadow: isSelected ? '0 0 16px rgba(194,144,54,0.15)' : 'none' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.25)' }}>
                      {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C29036' }} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white leading-tight">{pack.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{pack.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div>
                      <span className="text-2xl font-bold leading-none" style={{ color: '#C29036' }}>{pack.price}</span>
                      <span className="text-[10px] font-medium ml-1" style={{ color: '#C29036', verticalAlign: 'super' }}>FCFA</span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>= {pricePerCredit(pack)} FCFA/analyse</p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        <button
          ref={payButtonRef} onClick={handleBuy} disabled={loading}
          className="w-full font-semibold py-4 rounded-2xl text-sm tracking-wide transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C29036', color: '#1E1008' }}
        >
          <span>💳</span>
          <span>Payer avec FedaPay</span>
        </button>
      </div>
    </div>
  );
}
