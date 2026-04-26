import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

// ── Icons ───────────────────────────────────────────────────────────────────
const Icons = {
  instagram: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  search: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  close: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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

  // ── ACTION : Suppression ──────────────────────────────────────────────────
  const deletePartner = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce partenaire ?")) {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (!error) {
        setPartners(prev => prev.filter(p => p.id !== id));
        setSelectedPartner(null);
      }
    }
  };

  const filtered = partners.filter(p => 
    (cat === "Tous" || p.category === cat) && 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#2C1A0E] pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* Hero Header */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[4rem] shadow-2xl relative overflow-hidden">
        <h1 className="text-5xl font-serif mb-8 leading-tight">Nos <br/><span className="text-[#C9963A] italic text-4xl">partenaires</span></h1>
        
        <div className="relative flex items-center bg-white/10 rounded-2xl border border-white/5 overflow-hidden focus-within:bg-white/15 transition-all">
          <input 
            type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent p-5 text-sm outline-none placeholder:text-white/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-2 text-white/30">{Icons.close}</button>
          )}
          <button className="bg-[#C9963A] p-4 m-1 rounded-xl text-[#2C1A0E]">{Icons.search}</button>
        </div>
      </div>

      {/* Menu Navigation Responsive (Fixe) */}
      <div className="px-6 -mt-7 mb-10 relative z-20">
        <div className="bg-white p-1.5 rounded-[2rem] shadow-xl border border-black/5 grid grid-cols-4 gap-1">
          {["Tous", "Salon", "Produits", "Form."].map(c => {
            const label = c === "Form." ? "Formation" : c;
            return (
              <button 
                key={c} onClick={() => setCat(label)} 
                className={`py-3.5 rounded-[1.6rem] text-[9px] font-black uppercase tracking-tighter transition-all ${cat === label ? 'bg-[#2C1A0E] text-[#FAF4EC] shadow-lg' : 'text-[#2C1A0E]/30'}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des Partenaires */}
      <div className="px-6 space-y-6">
        {loading ? <p className="text-center py-20 font-serif italic opacity-30">Chargement...</p> : 
          filtered.map((p) => (
            <motion.div 
              key={p.id} onClick={() => setSelectedPartner(p)}
              className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-black/[0.02] flex gap-5 items-center active:scale-[0.98] transition-all"
            >
              <div className="w-20 h-20 rounded-3xl overflow-hidden bg-[#FAF4EC] flex-shrink-0 flex items-center justify-center">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <span className="text-3xl">{p.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#C9963A] text-[9px] font-black uppercase tracking-widest">{p.category}</span>
                <h3 className="text-xl font-serif text-[#2C1A0E] leading-tight truncate">{p.name}</h3>
                <p className="text-[10px] text-black/30 font-medium italic">{p.city}</p>
              </div>
            </motion.div>
        ))}
      </div>

      {/* Drawer : Détails & Suppression */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPartner(null)} className="fixed inset-0 bg-[#2C1A0E]/70 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[4rem] px-8 pt-4 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="w-16 h-1.5 bg-[#2C1A0E]/10 rounded-full mx-auto mb-10" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="bg-[#C9963A] text-[#2C1A0E] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Partenaire Certifié</span>
                  <h2 className="text-4xl font-serif text-[#2C1A0E] mt-4 leading-tight">{selectedPartner.name}</h2>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="p-3 bg-white rounded-2xl text-[#2C1A0E]/20">{Icons.close}</button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/40 p-6 rounded-[2.5rem] border border-black/5 text-sm leading-relaxed text-[#2C1A0E]/70">
                  {selectedPartner.description || "Expert en beauté Afro."}
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/${selectedPartner.whatsapp}`, "_blank")}
                  className="w-full bg-[#25D366] text-white py-6 rounded-[2.2rem] flex items-center justify-center gap-4 text-sm font-black uppercase tracking-[0.2em]"
                >
                  {Icons.whatsapp} Prendre rendez-vous
                </button>

                {/* BOUTON SUPPRIMER (Admin) */}
                <button 
                  onClick={() => deletePartner(selectedPartner.id)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-50/50 rounded-2xl border border-red-100/50 mt-10"
                >
                  Supprimer la fiche partenaire
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
