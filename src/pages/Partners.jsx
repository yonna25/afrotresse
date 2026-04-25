import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPartners } from "../services/useSupabasePartners.js";

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("Tous");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getPartners().then(data => {
      setPartners(data || []);
      setFiltered(data || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (activeCat === "Tous") setFiltered(partners);
    else setFiltered(partners.filter(p => p.category === activeCat));
  }, [activeCat, partners]);

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] px-6 pt-12 pb-32 font-sans">
      {/* HEADER MINIMALISTE */}
      <header className="mb-10">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-[32px] font-light tracking-tight leading-none"
        >
          Nos <span className="text-[#C9963A] font-serif italic italic font-normal">Partenaires</span>
        </motion.h1>
        <p className="text-white/30 text-[11px] uppercase tracking-[0.2em] mt-3 font-medium">
          L'excellence sélectionnée pour vous
        </p>
      </header>

      {/* FILTRES SOFT */}
      <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`text-xs font-medium transition-all duration-300 whitespace-nowrap relative pb-2 ${
              activeCat === cat ? "text-[#C9963A]" : "text-white/20 hover:text-white/50"
            }`}
          >
            {cat}
            {activeCat === cat && (
              <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C9963A]" />
            )}
          </button>
        ))}
      </div>

      {/* LISTE ÉPURÉE */}
      <div className="space-y-12">
        {loading ? (
          <p className="text-white/10 text-[10px] uppercase tracking-widest">Initialisation...</p>
        ) : (
          filtered.map((p) => (
            <PartnerRow key={p.id} p={p} onClick={() => setSelected(p)} />
          ))
        )}
      </div>

      {/* MODAL DÉTAIL DANS LE MÊME STYLE */}
      <AnimatePresence>
        {selected && <PartnerDetail p={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPOSANT LIGNE (SOFT MINIMAL) ──────────────────────────────────────────
function PartnerRow({ p, onClick }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="flex items-center gap-6">
        {/* Logo / Icone avec effet discret */}
        <div className="w-14 h-14 flex items-center justify-center text-3xl bg-white/[0.02] border border-white/5 rounded-full group-hover:border-[#C9963A]/30 transition-colors duration-500">
          <span className="grayscale group-hover:grayscale-0 transition-all">{p.emoji || "👑"}</span>
        </div>

        <div className="flex-1 border-b border-white/5 pb-8 group-last:border-0">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-light tracking-wide text-white/90 group-hover:text-[#C9963A] transition-colors">
              {p.name}
            </h2>
            <span className="text-[10px] text-[#C9963A] font-bold">★ {p.rating || "5.0"}</span>
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <p className="text-white/30 text-[10px] uppercase tracking-widest">{p.city}</p>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <p className="text-white/30 text-[10px] uppercase tracking-widest">{p.specialty}</p>
          </div>

          {p.promo && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-[#C9963A]/5 border border-[#C9963A]/10 rounded-full">
              <span className="text-[9px] font-bold text-[#C9963A] uppercase tracking-tighter italic">Offre exclusive</span>
              <span className="text-[10px] text-white/80 font-medium">{p.promo}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── MODAL DÉTAIL (PREMIUM SLIDE) ───────────────────────────────────────────
function PartnerDetail({ p, onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#1A0A00]/95 backdrop-blur-md flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-[#2C1A0E] rounded-t-[3rem] p-10 border-t border-white/10 shadow-2xl"
      >
        <div className="w-12 h-[2px] bg-white/10 mx-auto mb-10" />
        
        <div className="text-center mb-8">
          <div className="text-6xl mb-6">{p.emoji}</div>
          <h2 className="text-3xl font-light text-white mb-2">{p.name}</h2>
          <p className="text-[#C9963A] text-xs uppercase tracking-[0.3em]">{p.category}</p>
        </div>

        <p className="text-white/50 text-sm text-center leading-relaxed font-light mb-10 px-4">
          {p.description || "Un établissement d'exception sélectionné par AfroTresse pour la qualité de ses prestations."}
        </p>

        <div className="space-y-4">
          <a href={`tel:${p.phone}`} className="block w-full py-5 rounded-2xl border border-white/5 bg-white/5 text-center text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-all">
            Contacter le salon
          </a>
          <button 
            onClick={onClose}
            className="block w-full py-5 rounded-2xl bg-[#C9963A] text-[#1A0A00] text-center text-[10px] uppercase tracking-[0.2em] font-black"
          >
            Retour à la liste
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
