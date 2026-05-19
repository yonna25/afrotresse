import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.js';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Seo from "../components/Seo.jsx";

const PACKS_CONFIG = {
  decouverte: { label: 'Découverte', description: '3 essais pour découvrir ton style unique', credits: 3, price: 300, currency: 'FCFA' },
  allie: { label: '🤝 Allié', description: '10 essais + 2 bonus exclusifs', credits: 10, price: 900, currency: 'FCFA', popular: true },
  vip: { label: '🚀 Accès VIP', description: '50 essais + 10 crédits / mois', credits: 50, price: 2500, currency: 'FCFA' },
};

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

function LoadingOverlay() {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: 'rgba(30,16,8,0.98)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(194,144,54,0.2)', borderTopColor: '#C29036' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>Préparation du paiement…</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Connexion sécurisée FedaPay en cours</p>
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
    let attempts = 0;
    let timer;
    const creditsBefore = parseInt(localStorage.getItem('afrotresse_credits') || '0', 10);

    const poll = async () => {
      attempts++;
      try {
        const { syncCreditsFromServer } = await import('../services/credits.js');
        const synced = await syncCreditsFromServer();
        if (synced !== null && synced > creditsBefore) {
          onSuccess();
          return;
        }
      } catch {}
      if (attempts < 45) timer = setTimeout(poll, 2000);
    };

    poll();
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', background: '#1E1008' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0, borderBottom: '1px solid rgba(194,144,54,0.1)' }}>
        <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 auto' }}>🔒 Connexion sécurisée FedaPay</p>
        <button onClick={onClose} style={{ position: 'absolute', right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {!iframeLoaded && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(194,144,54,0.2)', borderTopColor: '#C29036' }} />
        </div>
      )}

      <iframe src={url} title="Paiement FedaPay" style={{ flex: 1, width: '100%', border: 'none', display: iframeLoaded ? 'block' : 'none' }} onLoad={() => setIframeLoaded(true)} allow="payment" />
    </motion.div>,
    document.body
  );
}

async function callFedaPay(pack, userId, email = '', fromPath = '/profile') {
  let sessionId = userId;
  if (!sessionId) {
    const fp = localStorage.getItem('afrotresse_fp') || localStorage.getItem('afrotresse_fingerprint');
    if (fp) sessionId = `fp_${fp}`;
    else {
      const { getSessionIdWithFp } = await import('../services/fingerprint.js');
      sessionId = await getSessionIdWithFp();
    }
  }

  const response = await fetch('/api/fedapay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack, email, sessionId, fromPath }),
  });
  return response.json();
}

export default function Credits() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const payButtonRef = useRef(null);

  // Déterminer la page de retour cible par défaut
  const targetRedirect = localStorage.getItem('afrotresse_payment_origin') || '/profile';

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
            const originPath = localStorage.getItem('afrotresse_payment_origin') || '/profile';
            const result = await callFedaPay(pendingPack, session.user.id, session.user.email || '', originPath);
            if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
          } catch {
            setErrorMsg("Une erreur est survenue lors de la reprise du paiement.");
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

  const handleSelect = (key) => {
    setSelected(key);
    setTimeout(() => { payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
  };

  const handleBuy = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;
      const email  = session?.user?.email || localStorage.getItem('afrotresse_email') || '';
      
      // Récupère la page d'origine stockée ou utilise l'historique
      const originPath = localStorage.getItem('afrotresse_payment_origin') || '/profile';
      const result = await callFedaPay(selected, userId, email, originPath);

      if (result.paymentUrl) setPaymentUrl(result.paymentUrl);
      else setErrorMsg(result.error || 'Erreur lors de l\'initialisation du paiement.');
    } catch {
      setErrorMsg('Une erreur de connexion est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white font-sans" style={{ backgroundColor: '#1E1008', minHeight: '100dvh', paddingBottom: '120px' }}>
      <Seo title="Acheter des crédits - AfroTresse" />

      <AnimatePresence>
        {loading && <LoadingOverlay />}
        {paymentUrl && (
          <FedaPayModal url={paymentUrl} onClose={() => setPaymentUrl(null)} onSuccess={() => {
            localStorage.removeItem('afrotresse_payment_origin');
            navigate(targetRedirect);
          }} />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-10">
        <div className="rounded-2xl px-5 py-3 flex items-center gap-3 mb-6" style={{ background: 'linear-gradient(135deg, rgba(194,144,54,0.15), rgba(194,144,54,0.05))', border: '1px solid rgba(194,144,54,0.3)' }}>
          <span className="text-lg">✨</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Tes crédits sont épuisés ! Recharge pour continuer tes analyses.</p>
        </div>

        <h1 className="text-3xl font-bold text-center mb-10" style={{ color: '#C29036' }}>Choisis ton pack</h1>

        <div className="flex flex-col gap-5 mb-8">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative" onClick={() => handleSelect(key)}>
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[10px] font-semibold tracking-widest uppercase px-4 py-1 rounded-full" style={{ backgroundColor: '#C29036', color: '#1E1008' }}>★ Conseillé</span>
                  </div>
                )}
                <div className="cursor-pointer rounded-3xl px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#2C1A0E', border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.25)' }}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C29036' }} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{pack.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{pack.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold" style={{ color: '#C29036' }}>{pack.price}</span>
                    <span className="text-[10px] ml-1" style={{ color: '#C29036' }}>FCFA</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {errorMsg && <p className="text-red-400 text-center text-xs mb-4">{errorMsg}</p>}

        <button
          ref={payButtonRef} onClick={handleBuy} disabled={loading}
          className="w-full font-semibold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 mb-8"
          style={{ backgroundColor: '#C29036', color: '#1E1008', cursor: 'pointer' }}
        >
          <span>💳</span>
          <span>Payer avec FedaPay</span>
        </button>

        <div className="space-y-4">
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#2C1A0E', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-xl">🎁</span>
            <div>
              <p className="text-xs font-semibold text-white">Crédits offerts à l'inscription</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Commence gratuitement dès ton arrivée</p>
            </div>
          </div>

          <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: '#2C1A0E', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] uppercase tracking-widest font-medium mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Paiements acceptés</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[{ icon: '📱', label: 'Mobile Money' }, { icon: '💳', label: 'Carte bancaire' }, { icon: '🏦', label: 'Virement' }].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.05)' }}>
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
