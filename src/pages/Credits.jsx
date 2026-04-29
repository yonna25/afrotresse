import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Seo from "../components/Seo.jsx";

const PACKS_CONFIG = {
  decouverte: {
    label: 'Découverte',
    description: '3 essais pour découvrir ton style unique',
    credits: 3,
    price: 300,
    currency: 'FCFA',
    cta: 'Je teste maintenant',
  },
  allie: {
    label: '🤝 Allié',
    description: '10 essais + 2 bonus exclusifs',
    credits: 10,
    price: 900,
    currency: 'FCFA',
    cta: "Je rejoins l'aventure",
    popular: true,
  },
  vip: {
    label: '🚀 Accès VIP',
    description: '50 essais + 10 crédits / mois',
    credits: 50,
    price: 2500,
    currency: 'FCFA',
    cta: 'Je passe VIP',
  },
};

export default function Credits() {
  const [selected, setSelected] = useState('allie');
  const [loading, setLoading] = useState(false);
  const payButtonRef = useRef(null);

  const handleSelect = (key) => {
    setSelected(key);
    setTimeout(() => {
      payButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const supabaseAuth = localStorage.getItem('sb-fowatshrtuzyyqsvvpxu-auth-token'); 
      let userId = null;
      if (supabaseAuth) {
        try {
          const parsed = JSON.parse(supabaseAuth);
          userId = parsed?.user?.id;
        } catch (e) { console.error(e); }
      }

      const sessionId = userId || localStorage.getItem('afrotresse_session_id') || 'guest_user';

      const response = await fetch('/api/fedapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: selected,
          email: localStorage.getItem('afrotresse_email') || '',
          sessionId: sessionId
        }),
      });

      const result = await response.json();
      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank');
      } else {
        alert(result.error || "Erreur de connexion");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white font-sans pb-32"
      style={{ backgroundColor: '#1E1008' }}
    >
      <Seo title="Acheter des crédits - AfroTresse" />

      <div className="max-w-lg mx-auto px-4 pt-10">

        {/* ── Titre ── */}
        <h1
          className="text-4xl font-extrabold text-center mb-10"
          style={{ color: '#C29036' }}
        >
          Choisis ton pack
        </h1>

        {/* ── Liste des packs ── */}
        <div className="flex flex-col gap-5 mb-10">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => {
            const isSelected = selected === key;
            return (
              <div key={key} className="relative">

                {/* Badge CONSEILLÉ / POPULAIRE centré au-dessus */}
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-4 py-1 rounded-full"
                      style={{
                        backgroundColor: '#C29036',
                        color: '#1E1008',
                      }}
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
                    border: isSelected
                      ? '2px solid #C29036'
                      : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: isSelected
                      ? '0 0 18px rgba(194,144,54,0.18)'
                      : 'none',
                  }}
                >
                  {/* Gauche : radio + infos */}
                  <div className="flex items-center gap-4">
                    {/* Radio animé */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        border: isSelected ? '2px solid #C29036' : '2px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'transparent',
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

                    {/* Texte */}
                    <div>
                      <p className="font-bold text-base text-white leading-tight">
                        {pack.label}
                      </p>
                      <p
                        className="text-xs mt-0.5 italic"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  {/* Droite : prix */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <span
                      className="text-3xl font-black leading-none"
                      style={{ color: '#C29036' }}
                    >
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
          className="w-full font-extrabold py-5 rounded-2xl text-base tracking-wide transition-all disabled:opacity-50"
          style={{
            backgroundColor: '#C29036',
            color: '#1E1008',
          }}
        >
          {loading ? 'Traitement…' : 'Payer avec FedaPay 💳'}
        </button>

        {/* ── Crédits offerts & paiements acceptés ── */}
        <div
          className="mt-10 rounded-2xl px-5 py-5 text-sm space-y-2"
          style={{
            backgroundColor: '#2C1A0E',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            🎁 <span className="font-semibold text-white">Crédits offerts à l'inscription</span>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            👥 Parrainage : <span className="font-semibold text-white">+2 crédits</span>
          </p>
          <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          <p
            className="text-xs uppercase tracking-widest font-bold"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Paiements acceptés
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            📱 Mobile Money &nbsp;·&nbsp; 💳 Carte bancaire &nbsp;·&nbsp; 🏦 Virement
          </p>
        </div>

      </div>
    </div>
  );
}
