import { useState, useRef } from 'react';
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

// ── Mapping erreurs FedaPay ───────────────────────────────────────
function matchFedaError(msg = '') {
  if (!msg) return 'Une erreur est survenue. Veuillez réessayer.';
  const lower = msg.toLowerCase();
  if (lower.includes('fonds') || lower.includes('funds') || lower.includes('balance') || lower.includes('suffis'))
    return 'Fonds insuffisants sur votre compte. Veuillez créditer votre balance et réessayer.';
  if (lower.includes('échou') || lower.includes('failed'))
    return 'Transaction échouée. Veuillez réessayer.';
  return msg;
}

// ── Overlay chargement ────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center gap-5 px-8"
      style={{ background: 'rgba(20,8,0,0.92)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-14 h-14 rounded-full border-4"
        style={{ borderColor: 'rgba(194,144,54,0.2)', borderTopColor: '#C29036' }}
      />
      <div className="text-center">
        <p className="font-black text-lg text-white mb-1">Préparation du paiement…</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Connexion sécurisée FedaPay en cours
        </p>
      </div>
    </motion.div>
  );
}

// ── Modal FedaPay (iframe intégré) ────────────────────────────────
function FedaPayModal({ url, onClose }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(194,144,54,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-base"
            style={{ backgroundColor: '#C29036' }}
          >
            💳
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Paiement sécurisé</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>FedaPay · Crypté SSL</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          ✕
        </button>
      </div>

      {/* Loader iframe */}
      {!iframeLoaded && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4"
            style={{ borderColor: 'rgba(194,144,54,0.2)', borderTopColor: '#C29036' }}
          />
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Chargement du paiement…
          </p>
        </div>
      )}

      {/* iFrame */}
      <iframe
        src={url}
        title="Paiement FedaPay"
        className="flex-1 w-full border-0"
        style={{ display: iframeLoaded ? 'block' : 'none' }}
        onLoad={() => setIframeLoaded(true)}
        allow="payment"
      />

      {/* Footer sécurité */}
      <div
        className="flex items-center justify-center gap-2 py-3 flex-shrink-0 text-xs"
        style={{ color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        🔒 Paiement 100 % sécurisé · Ne jamais partager vos codes
      </div>
    </motion.div>
  );
}

// ── Toast erreur stylisé ──────────────────────────────────────────
function ErrorToast({ message, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="fixed bottom-28 left-4 right-4 z-[400] max-w-sm mx-auto rounded-2xl px-5 py-4 flex items-start gap-3"
      style={{
        background: 'linear-gradient(135deg, #3D0E0E, #2A0808)',
        border: '1.5px solid rgba(255,80,80,0.35)',
        boxShadow: '0 4px 30px rgba(255,60,60,0.2)',
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="font-bold text-sm mb-0.5" style={{ color: '#ff9090' }}>
          Paiement non abouti
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,200,200,0.75)' }}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-lg leading-none flex-shrink-0 mt-0.5"
        style={{ color: 'rgba(255,150,150,0.7)' }}
      >
        ✕
      </button>
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────────
export default function Credits() {
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const payButtonRef = useRef(null);

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
    <div className="min-h-screen text-white font-sans pb-32" style={{ backgroundColor: '#1E1008' }}>
      <Seo title="Acheter des crédits - AfroTresse" />

      {/* ── Overlays ── */}
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

        {/* ── Titre ── */}
        <h1 className="text-4xl font-extrabold text-center mb-10" style={{ color: '#C29036' }}>
          Choisis ton pack
        </h1>

        {/* ── Packs ── */}
        <div className="flex flex-col gap-5 mb-10">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative">
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-4 py-1 rounded-full"
                      style={{ backgroundColor: '#C29036', color: '#1E1008' }}
                    >
                      ★ Conseillé
                    </span>
                  </div>
                )}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(key)}
                  className="cursor-pointer rounded-3xl px-6 py-6 flex items-center justify-between transition-all"
                  style={{
                    backgroundColor: '#2C1A0E',
                    border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: isSelected ? '0 0 18px rgba(194,144,54,0.18)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="radio-dot"
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: '#C29036' }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-base text-white leading-tight">{pack.label}</p>
                      <p className="text-xs mt-0.5 italic" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {pack.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <span className="text-3xl font-black leading-none" style={{ color: '#C29036' }}>
                      {pack.price}
                    </span>
                    <span
                      className="text-xs font-semibold ml-1"
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

        {/* ── Bouton paiement ── */}
        <button
          ref={payButtonRef}
          onClick={handleBuy}
          disabled={loading}
          className="w-full font-extrabold py-5 rounded-2xl text-base tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#C29036', color: '#1E1008' }}
        >
          <span>💳</span>
          <span>Payer avec FedaPay</span>
        </button>

        {/* ── Section bas ── */}
        <div className="mt-8 space-y-3 mb-4">

          {/* Crédits offerts */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, #2C1A0E, #3a2010)',
              border: '1px solid rgba(194,144,54,0.2)',
            }}
          >
            <span className="text-2xl flex-shrink-0">🎁</span>
            <div>
              <p className="font-bold text-white text-sm">Crédits offerts à l'inscription</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Commence gratuitement dès ton arrivée
              </p>
            </div>
          </div>

          {/* Parrainage */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, #2C1A0E, #3a2010)',
              border: '1px solid rgba(194,144,54,0.2)',
            }}
          >
            <span className="text-2xl flex-shrink-0">👥</span>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">Parrainage</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Invite une amie et gagne des crédits
              </p>
            </div>
            <span
              className="font-black text-sm px-3 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'rgba(194,144,54,0.18)', color: '#C29036' }}
            >
              +2 crédits
            </span>
          </div>

          {/* Paiements acceptés */}
          <div
            className="rounded-2xl px-5 py-4"
            style={{
              backgroundColor: '#2C1A0E',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-bold mb-3"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
