import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

const SocialIcons = {
  instagram: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
};

// ── MODAL COMPONENT ──
function Modal({ p, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!p) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(p.promo_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-[430px] bg-[#FAF4EC] rounded-t-[3rem] p-8 pb-12 overflow-y-auto max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-[#2C1A0E]/10 rounded-full mx-auto mb-8" />
        
        <div className="flex gap-6 mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-[#2C1A0E]/5">
            {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <span className="text-4xl">{p.emoji}</span>}
          </div>
          <div>
            <span className="text-[#C9963A] text-[10px] font-black uppercase tracking-widest">{p.category}</span>
            <h2 className="text-2xl font-serif text-[#2C1A0E]">{p.name}</h2>
            <p className="text-sm text-[#2C1A0E]/60 italic">{p.specialty}</p>
          </div>
        </div>

        <p className="text-[#2C1A0E]/80 leading-relaxed mb-8 text-sm">{p.description}</p>

        {p.promo && (
          <div className="bg-white border-2 border-dashed border-[#C9963A]/30 rounded-3xl p-6 mb-8">
            <span className="text-[10px] font-black uppercase text-[#C9963A] block mb-2">Offre Exclusive</span>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#2C1A0E]">{p.promo}</span>
              <button onClick={handleCopy} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[#2C1A0E] text-white'}`}>
                {copied ? "COPIÉ" : "COPIER CODE"}
              </button>
            </div>
            <p className="mt-3 font-mono text-[#C9963A] font-bold tracking-widest">{p.promo_code}</p>
          </div>
        )}

        <button 
          onClick={() => window.open(`https://wa.me/${p.whatsapp?.replace(/\D/g, "")}`, "_blank")}
          className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-green-500/20 active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          {SocialIcons.whatsapp} Contacter l'expert
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── PAGE PRINCIPALE ──
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").eq("active", true).order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  const filtered = partners.filter(p => (cat === "Tous" || p.category === cat) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#2C1A0E] pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative">
        <h1 className="text-5xl font-serif mb-6 leading-tight">Nos <br/><span className="italic">Partenaires</span></h1>
        <input 
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-sm outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
        />
      </div>

      {/* Navigation des catégories Responsive & Sticky */}
      <div className="sticky top-0 z-50 bg-[#FAF4EC]/80 backdrop-blur-md py-4">
        <div className="flex gap-3 px-8 overflow-x-auto no-scrollbar scroll-smooth">
          {["Tous", "Salon", "Produits", "Formation"].map(c => (
            <button 
              key={c} onClick={() => setCat(c)} 
              className={`px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${cat === c ? 'bg-[#C9963A] text-white border-[#C9963A] scale-105' : 'bg-white text-[#2C1A0E]/40 border-transparent'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List */}
      <div className="px-6 space-y-6 mt-4">
        {loading ? <div className="text-center py-20 opacity-20 uppercase tracking-widest text-[10px] font-bold">Chargement de l'univers...</div> : 
          filtered.map((p, idx) => (
            <motion.div 
              key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#2C1A0E]/5 relative overflow-hidden"
            >
              {p.sponsored && <div className="absolute top-0 right-0 bg-[#C9963A] text-white text-[8px] font-black px-4 py-1 rounded-bl-2xl uppercase">Premium</div>}

              <div className="flex gap-5 items-start">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#FAF4EC] flex-shrink-0 border border-[#2C1A0E]/5">
                  {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">{p.emoji}</div>}
                </div>

                <div className="flex-1">
                  <span className="text-[#C9963A] text-[9px] font-black uppercase tracking-widest block">{p.category}</span>
                  <h3 className="text-lg font-serif text-[#2C1A0E] mb-1">{p.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-[#2C1A0E]/40 uppercase tracking-tighter">📍 {p.city}</span>
                    <span className="w-1 h-1 bg-[#2C1A0E]/10 rounded-full"></span>
                    <span className="text-[10px] font-bold text-[#C9963A]">⭐ {p.rating}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelected(p)}
                      className="flex-1 bg-[#2C1A0E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest py-3 active:scale-95 transition-transform"
                    >
                      Voir l'offre
                    </button>
                    {p.whatsapp && (
                      <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`} target="_blank" className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] border border-[#25D366]/10 transition-colors">
                        {SocialIcons.whatsapp}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
        ))}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {selected && <Modal p={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
