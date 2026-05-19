import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.js';
import { motion, AnimatePresence } from 'framer-motion';
import Seo from "../components/Seo.jsx";
import FedaPayModal from "../components/FedaPayModal.jsx"; // Import de notre nouveau modal épuré

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

// ── Loader Premium Tailwind intégré ──────────────────────────────
function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-5 bg-[#2C1A0E]/95 backdrop-blur-md"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-4 border-[#C9963A]/20 border-t-[#C9963A]"
      />
      <div className="text-center">
        <p className="font-black text-base text-white mb-1">Préparation du paiement…</p>
        <p className="text-xs text-white/50">Connexion sécurisée FedaPay en cours</p>
      </div>
    </motion.div>
  );
}

// ── Toast d'Erreur Premium Tailwind ──────────────────────────────
function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 left-6 right-6 z-[200] max-w-sm mx-auto rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-[#3D0E0E] to-[#2A0808] border border-red-500/30 shadow-2xl shadow-red-950/50"
    >
      <span className="text-lg mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="font-black text-xs text-red-300 uppercase tracking-wide mb-0.5">Paiement non abouti</p>
        <p className="text-xs leading-relaxed text-white/80">{message}</p>
      </div>
      <button onClick={onClose} className="text-sm text-white/40 hover:text-white/70">✕</button>
    </motion.div>
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(null);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [showMagicForm, setShowMagicForm] = useState(false);
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

  const handleSocialLogin = async (provider) => {
    setAuthLoading(provider);
    setPendingPack(selected);
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

  return (
    <div className="bg-[#2C1A0E] min-h-[100dvh] text-white font-sans pb-32 overflow-y-auto">
      <Seo title="Acheter des crédits - AfroTresse" />

      {/* ── MODALE AUTH PRESTIGE ── */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#2C1A0E] rounded-t-[2.5rem] p-6 pb-12 border-t border-[#C9963A]/20 shadow-2xl shadow-black"
            >
              <div className="flex justify-center mb-6">
                <div className="w-12 h-1 rounded-full bg-white/10" />
              </div>

              <div className="text-center mb-8">
                <div className="text-4xl mb-3">👑</div>
                <h2 className="text-[#C9963A] text-xl font-black tracking-tight mb-2">Connecte-toi pour payer</h2>
                <p className="text-xs text-white/60 leading-relaxed px-4">
                  Tes crédits seront liés à ton compte — accessibles sur n'importe quel appareil, sans jamais les perdre.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={authLoading !== null}
                  className="w-full py-4 rounded-xl bg-white text-[#2C1A0E] font-black text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{authLoading === 'google' ? 'Connexion…' : 'Continuer avec Google'}</span>
                </button>

                {!magicSent ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowMagicForm(!showMagicForm)}
                      disabled={authLoading !== null}
                      className="w-full p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between text-white/80 font-bold text-sm active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-3">
                        <span>✉️</span>
                        <span>Continuer par email</span>
                      </div>
                      <span className={`text-xs text-white/30 transition-transform ${showMagicForm ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {showMagicForm && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <input
                          type="email"
                          placeholder="Ton adresse email"
                          value={magicEmail}
                          onChange={e => setMagicEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                          className="w-full p-4 rounded-xl border border-[#C9963A]/30 bg-white/5 text-white text-sm outline-none focus:border-[#C9963A]"
                        />
                        <button
                          onClick={handleMagicLink}
                          disabled={authLoading !== null || !magicEmail.trim()}
                          className="w-full p-4 rounded-xl font-black text-sm text-[#2C1A0E] bg-[#C9963A] disabled:opacity-30 transition-all"
                        >
                          {authLoading === 'magic' ? 'Envoi en cours…' : 'Envoyer le lien'}
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#C9963A]/10 border border-[#C9963A]/20 text-center">
                    <div className="text-2xl mb-2">📬</div>
                    <p className="text-[#C9963A] font-black text-sm mb-1">Vérifie ta boîte mail</p>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Lien envoyé à <strong className="text-white/80">{magicEmail}</strong>. Clique dessus pour revenir et payer.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => { setShowAuthModal(false); clearPendingPack(); }}
                  className="w-full py-4 text-xs font-bold text-white/40 tracking-wider uppercase text-center hover:text-white/60"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERFACES ASYNCHRONES ── */}
      <AnimatePresence>
        {loading && <LoadingOverlay key="loader" />}
        {paymentUrl && (
          <FedaPayModal
            key="modal"
            url={paymentUrl}
            onSuccess={() => navigate('/profile')}
          />
        )}
        {errorMsg && (
          <ErrorToast key="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
        )}
      </AnimatePresence>

      {/* ── CONTENU DE LA PAGE ── */}
      <div className="max-w-md mx-auto px-5 pt-8">
        
        {/* Banner Alert */}
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-r from-[#C9963A]/20 to-[#C9963A]/5 border border-[#C9963A]/30 mb-8">
          <span className="text-xl">✨</span>
          <p className="text-xs text-white/80 font-medium leading-relaxed">
            Vos crédits sont épuisés ! Rechargez pour continuer vos analyses capillaires instantanées.
          </p>
        </div>

        <h1 className="text-2xl font-black text-center text-[#C9963A] mb-8 tracking-tight">Choisis ton pack</h1>

        {/* Liste des Packs */}
        <div className="space-y-4 mb-6">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative">
                {pack.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-[#C9963A] text-[#2C1A0E]">
                      ★ Conseillé
                    </span>
                  </div>
                )}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(key)}
                  className={`cursor-pointer rounded-2xl p-4 flex items-center justify-between border-2 transition-all ${
                    isSelected ? 'border-[#C9963A] bg-[#5C3317]/40 shadow-xl shadow-[#C9963A]/5' : 'border-white/5 bg-[#5C3317]/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-[#C9963A]' : 'border-white/20'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#C9963A]" />}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">{pack.label}</p>
                      <p className="text-xs text-white/40 mt-0.5">{pack.description}</p>
                    </div>
                  </div>
                  <div className="text-right pl-2">
                    <div className="flex items-baseline justify-end">
                      <span className="text-xl font-black text-[#C9963A]">{pack.price}</span>
                      <span className="text-[9px] font-black text-[#C9963A] ml-0.5 self-start pt-1">FCFA</span>
                    </div>
                    <p className="text-[9px] text-white/30 font-medium mt-0.5">={pricePerCredit(pack)}F/essai</p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Parrainage Row */}
        <div className="rounded-2xl p-4 flex items-center justify-between border border-white/5 bg-gradient-to-br from-[#2C1A0E] to-[#5C3317]/40 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <p className="text-xs font-black text-white">Programme Parrainage</p>
              <p className="text-[11px] text-white/40 mt-0.5">Invite une amie et gagnez des crédits</p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#C9963A]/10 text-[#C9963A] border border-[#C9963A]/20">
            +2 CRÉDITS
          </span>
        </div>

        {/* Bouton CTA Action */}
        <motion.button
          ref={payButtonRef}
          whileTap={{ scale: 0.98 }}
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase bg-[#C9963A] text-[#2C1A0E] shadow-xl shadow-[#C9963A]/10 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          <span>💳</span>
          <span>Payer avec FedaPay</span>
        </motion.button>

        {/* Footer badges info */}
        <div className="mt-8 space-y-3">
          <div className="rounded-2xl p-4 flex items-center gap-3 border border-white/5 bg-[#5C3317]/10">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-xs font-bold text-white">Crédits offerts à l'inscription</p>
              <p className="text-[11px] text-white/40 mt-0.5">Commencez l'aventure gratuitement dès maintenant.</p>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/5 bg-[#2C1A0E]">
            <p className="text-[9px] uppercase tracking-widest font-black text-white/30 mb-3">Moyens de paiements acceptés</p>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { icon: '📱', label: 'Mobile Money' },
                { icon: '💳', label: 'Carte Bancaire' },
                { icon: '🏦', label: 'Virement' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold bg-white/5 border border-white/5 text-white/60">
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
