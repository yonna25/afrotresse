import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

// ── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  instagram: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  close: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

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
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Hero */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative">
        <h1 className="text-4xl font-serif mb-6 leading-tight">L'élite de <br/><span className="text-[#C9963A] italic">la coiffure Afro</span></h1>
        <input 
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/10 border-none p-5 rounded-2xl text-sm outline-none placeholder:text-white/30 focus:bg-white/20 transition-all"
        />
      </div>

      {/* Menu Catégories Responsive (Scroll horizontal fluide) */}
      <div className="sticky top-0 z-40 bg-[#FAF4EC]/80 backdrop-blur-md py-6">
        <div className="flex gap-3 px-8 overflow-x-auto hide-scrollbar">
          {["Tous", "Salon", "Produits", "Formation"].map(c => (
            <button 
              key={c} onClick={() => setCat(c)} 
              className={`px-7 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${cat === c ? 'bg-[#2C1A0E] text-[#FAF4EC] border-[#2C1A0E] shadow-xl scale-105' : 'bg-white text-[#2C1A0E]/40 border-black/5'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Partners List */}
      <div className="px-6 space-y-6">
        {loading ? <div className="py-20 text-center font-serif italic opacity-30">Chargement de la sélection...</div> : 
          filtered.map((p, idx) => (
            <motion.div 
              key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5 flex gap-5 items-center group active:scale-[0.98] transition-transform"
              onClick={() => setSelectedPartner(p)}
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FAF4EC] flex-shrink-0 border border-black/5 flex items-center justify-center">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl">{p.emoji}</span>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <span className="text-[#C9963A] text-[9px] font-black uppercase tracking-widest">{p.category}</span>
                   {p.rating && <span className="text-[10px] font-bold">⭐ {p.rating}</span>}
                </div>
                <h3 className="text-lg font-serif text-[#2C1A0E] leading-tight">{p.name}</h3>
                <p className="text-[10px] text-black/40 font-medium">{p.city} • {p.specialty}</p>
                {p.promo && <div className="mt-2 text-[10px] font-black text-[#C9963A] uppercase tracking-tighter">Offre Spéciale Disponible</div>}
              </div>
            </motion.div>
        ))}
      </div>

      {/* Premium Drawer (Affichage de l'offre) */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPartner(null)}
              className="fixed inset-0 bg-[#2C1A0E]/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[3rem] px-8 pt-4 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              {/* Handle */}
              <div className="w-12 h-1.5 bg-[#2C1A0E]/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="bg-[#C9963A]/10 text-[#C9963A] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedPartner.badge || "Partenaire Vérifié"}</span>
                  <h2 className="text-3xl font-serif mt-4 text-[#2C1A0E]">{selectedPartner.name}</h2>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="p-3 bg-white rounded-full shadow-sm text-[#2C1A0E]/20">{Icons.close}</button>
              </div>

              <div className="space-y-8">
                {/* Description */}
                <div className="bg-white/50 p-6 rounded-3xl border border-black/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#C9963A] mb-3">À propos</h4>
                  <p className="text-sm leading-relaxed text-[#2C1A0E]/70">{selectedPartner.description || "Une expérience capillaire unique pour sublimer votre beauté naturelle avec expertise et soin."}</p>
                </div>

                {/* Promo Card */}
                {selectedPartner.promo && (
                  <div className="bg-[#2C1A0E] text-[#FAF4EC] p-7 rounded-[2rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C9963A]/20 blur-3xl rounded-full" />
                    <span className="text-[10px] font-bold text-[#C9963A] uppercase tracking-[0.2em]">Offre AfroTresse</span>
                    <p className="text-xl font-serif mt-2 mb-4">{selectedPartner.promo}</p>
                    <div className="bg-white/10 p-4 rounded-xl flex justify-between items-center border border-white/5">
                       <span className="font-mono text-lg tracking-widest text-[#C9963A]">{selectedPartner.promo_code}</span>
                       <span className="text-[9px] font-black uppercase opacity-40">Code Promo</span>
                    </div>
                  </div>
                )}

                {/* Socials & Contact */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedPartner.instagram && (
                    <a href={`https://instagram.com/${selectedPartner.instagram}`} target="_blank" className="bg-white p-5 rounded-2xl border border-black/5 flex flex-col items-center gap-3">
                      <div className="text-[#E1306C]">{Icons.instagram}</div>
                      <span className="text-[10px] font-black uppercase opacity-60">Instagram</span>
                    </a>
                  )}
                  {selectedPartner.whatsapp && (
                    <a href={`https://wa.me/${selectedPartner.whatsapp.replace(/\D/g, "")}`} target="_blank" className="bg-[#25D366]/5 p-5 rounded-2xl border border-[#25D366]/10 flex flex-col items-center gap-3">
                      <div className="text-[#25D366]">{Icons.whatsapp}</div>
                      <span className="text-[10px] font-black uppercase text-[#25D366]">WhatsApp</span>
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/${selectedPartner.whatsapp?.replace(/\D/g, "")}`, "_blank")}
                  className="w-full bg-[#2C1A0E] text-white py-6 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-transform"
                >
                  Prendre rendez-vous
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
