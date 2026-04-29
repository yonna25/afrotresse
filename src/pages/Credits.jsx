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
        window.location.href = result.paymentUrl;
      } else {
        alert(result.error || "Erreur lors de la création du paiement");
        setLoading(false);
      }
    } catch (err) {
      alert("Connexion impossible au service.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white py-12 px-4 font-sans text-center">
      <Seo title="Acheter des crédits - AfroTresse" />
      
      <h1 className="text-[#C29036] text-3xl font-bold mb-10 italic uppercase tracking-widest">Choisis ton pack</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 px-2">
        {Object.entries(PACKS_CONFIG).map(([key, pack]) => (
          <motion.div
            key={key}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(key)}
            className={`relative p-8 rounded-[40px] border-2 cursor-pointer transition-all duration-300 ${
              selected === key ? 'border-[#C29036] bg-[#C29036]/10' : 'border-white/10 bg-white/5'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C29036] text-[#2C1A0E] text-[10px] font-black px-4 py-1 rounded-full uppercase">
                Le plus prisé
              </div>
            )}
            <h3 className="text-xl font-bold mb-2 italic">{pack.label}</h3>
            <div className="text-4xl font-black text-[#C29036] mb-2">{pack.price} <span className="text-sm">FCFA</span></div>
            <p className="text-sm opacity-60 italic leading-tight">{pack.description}</p>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className={`w-full max-w-sm mx-auto py-5 rounded-2xl font-black text-lg transition-all shadow-xl ${
          loading ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-[#C29036] text-[#2C1A0E] active:scale-95'
        }`}
      >
        {loading ? 'Lancement...' : 'Payer avec FedaPay 💳'}
      </button>
    </div>
  );
}
