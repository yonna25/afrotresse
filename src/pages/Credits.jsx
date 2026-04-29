import { useState } from 'react';
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

  const handleBuy = async () => {
    setLoading(true);
    try {
      const supabaseAuth = localStorage.getItem('sb-fowatshrtuzyyqsvvpxu-auth-token'); 
      let userId = null;
      if (supabaseAuth) {
        const parsed = JSON.parse(supabaseAuth);
        userId = parsed?.user?.id;
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
        window.location.href = result.paymentUrl;
      } else {
        // Notification en cas d'échec
        alert("Désolé, impossible de lancer le paiement : " + (result.error || "Erreur inconnue"));
        setLoading(false);
      }
    } catch (err) {
      alert("Erreur de connexion au service de paiement.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white py-12 px-4 font-sans text-center">
      <Seo title="Crédits - AfroTresse" />
      
      <h1 className="text-[#C29036] text-3xl font-bold mb-10">Choisis ton pack</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
        {Object.entries(PACKS_CONFIG).map(([key, pack]) => (
          <motion.div
            key={key}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(key)}
            className={`relative p-8 rounded-[40px] border-2 cursor-pointer transition-all duration-300 ${
              selected === key ? 'border-[#C29036] bg-[#C29036]/5' : 'border-white/10 bg-white/5'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C29036] text-[#2C1A0E] text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter">
                Le plus prisé
              </div>
            )}
            <h3 className="text-xl font-bold mb-2 italic">{pack.label}</h3>
            <div className="text-4xl font-black text-[#C29036] mb-2">{pack.price} FCFA</div>
            <p className="text-sm opacity-60 italic leading-tight">{pack.description}</p>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className={`w-full max-w-sm mx-auto py-5 rounded-2xl font-black text-lg transition-all ${
          loading ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-[#C29036] text-[#2C1A0E] active:scale-95'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Lancement...
          </span>
        ) : (
          'Payer avec FedaPay 💳'
        )}
      </button>

      {/* Message discret si échec précédent */}
      <p className="mt-4 text-[10px] opacity-40">Sécurisé par FedaPay. En cas de problème, contactez le support.</p>
    </div>
  );
}
