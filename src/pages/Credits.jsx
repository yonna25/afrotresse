import { useState, useEffect } from 'react';
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
      // Récupération sécurisée du sessionId (Priorité Supabase)
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
        alert(result.error || "Erreur de connexion");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white py-12 px-4 font-sans">
      <Seo title="Acheter des crédits - AfroTresse" />
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-10 text-[#C29036]">Choisis ton pack</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(PACKS_CONFIG).map(([key, pack]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelected(key)}
              className={`relative cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all ${
                selected === key ? 'border-[#C29036] bg-[#C29036]/10' : 'border-white/10 bg-white/5'
              }`}
            >
              {pack.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C29036] text-[#2C1A0E] text-[10px] font-bold px-3 py-1 rounded-full uppercase">Conseillé</span>}
              <h3 className="text-xl font-bold mb-2">{pack.label}</h3>
              <div className="text-3xl font-black text-[#C29036] mb-2">{pack.price} FCFA</div>
              <p className="text-sm opacity-70 italic">{pack.description}</p>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full md:w-80 bg-[#C29036] hover:bg-[#d4a045] text-[#2C1A0E] font-extrabold py-5 rounded-2xl transition-all disabled:opacity-50"
        >
          {loading ? 'Traitement...' : 'Payer avec FedaPay 💳'}
        </button>
      </div>
    </div>
  );
}
