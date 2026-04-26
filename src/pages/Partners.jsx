import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

// ─── ICONS SVG ───────────────────────────────────────────────────────────────
const Icons = {
  close: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  search: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  clear: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  whatsapp: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  facebook: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.06-1.4-.13-.08-.24-.17-.36-.26v7.24c.01 2.35-.78 4.65-2.39 6.32-1.62 1.67-3.89 2.51-6.13 2.51-2.24 0-4.51-.84-6.13-2.51-1.61-1.67-2.4-3.97-2.39-6.32 0-2.35.79-4.65 2.39-6.32 1.62-1.67 3.89-2.51 6.13-2.51.52 0 1.03.05 1.54.14v4.03c-.5-.13-1.02-.2-1.54-.2-1.12 0-2.25.42-3.06 1.26-.81.84-1.21 1.99-1.21 3.16 0 1.17.4 2.32 1.21 3.16.81.84 1.94 1.26 3.06 1.26s2.25-.42 3.06-1.26c.81-.84 1.21-1.99 1.21-3.16V.02z"/></svg>,
};

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cat, setCat] = useState("Tous");

  useEffect(() => {
    checkUser();
    fetchPartners();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // Remplace par ton email admin réel
    if (user && user.email === "ton-email@exemple.com") setIsAdmin(true);
  };

  const fetchPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      .order("pinned", { ascending: false }) // Les épinglés en premier
      .order("position", { ascending: true });
    setPartners(data || []);
  };

  // Actions Admin
  const handleDelete = async (id) => {
    if (window.confirm("🗑️ Supprimer définitivement ce partenaire ?")) {
      await supabase.from('partners').delete().eq('id', id);
      fetchPartners();
      setSelectedPartner(null);
    }
  };

  const handlePin = async (id, currentStatus) => {
    await supabase.from('partners').update({ pinned: !currentStatus }).eq('id', id);
    fetchPartners();
    setSelectedPartner(prev => ({ ...prev, pinned: !currentStatus }));
  };

  // Filtrage intelligent
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

      {/* ─── HEADER ─── */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <h1 className="text-4xl font-serif mb-2 leading-tight">Nos partenaires</h1>
        <p className="text-[11px] font-bold text-[#C9963A] uppercase tracking-[0.2em] mb-8 italic opacity-90">
          "L'excellence capillaire, sélectionnée pour vous."
        </p>
        
        {/* Moteur de recherche avec Reset */}
        <div className="relative flex items-center bg-white/10 rounded-2xl border border-white/5 overflow-hidden focus-within:ring-2 ring-[#C9963A]/50 transition-all">
          <input 
            type="text" placeholder="Rechercher un salon..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent p-5 text-sm outline-none placeholder:text-white/20 text-white"
          />
          
          {search && (
            <button onClick={() => setSearch("")} className="p-2 text-white/40 hover:text-[#C9963A] transition-colors">
              {Icons.clear}
            </button>
          )}

          <button className="bg-[#C9963A] p-4 m-1.5 rounded-xl text-[#2C1A0E] shadow-lg active:scale-90 transition-transform">
            {Icons.search}
          </button>
        </div>
      </div>

      {/* ─── NAVIGATION CATÉGORIES ─── */}
      <div className="px-6 -mt-7 mb-10 relative z-20">
        <div className="bg-white p-1.5 rounded-[2rem] shadow-xl border border-black/5 grid grid-cols-4 gap-1 text-center">
          {["Tous", "Salon", "Formation", "Produits"].map(c => (
            <button 
              key={c} onClick={() => setCat(c)} 
              className={`py-3.5 rounded-[1.6rem] text-[9px] font-black uppercase transition-all ${cat === c ? 'bg-[#2C1A0E] text-[#FAF4EC]' : 'text-[#2C1A0E]/30'}`}
            >
              {c === "Formation" ? "Form." : c}
            </button>
          ))}
        </div>
      </div>

      {/* ─── LISTE DES PARTENAIRES ─── */}
      <div className="px-6 space-y-6">
        {filtered.map(p => (
          <div 
            key={p.id} onClick={() => setSelectedPartner(p)} 
            className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-black/[0.03] flex gap-5 items-center relative overflow-hidden active:scale-95 transition-transform"
          >
            {p.pinned && <div className="absolute top-0 right-8 bg-[#C9963A] px-3 py-1 rounded-b-xl text-[8px] font-black uppercase text-[#2C1A0E]">Favori</div>}
            
            <div className="w-20 h-20 rounded-3xl bg-[#FAF4EC] flex items-center justify-center overflow-hidden border border-black/5 shadow-inner">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">✨</span>}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-serif text-[#2C1A0E]">{p.name}</h3>
                    {p.verified && <span className="text-blue-500 text-xs">✔️</span>}
                </div>
                <p className="text-[10px] text-black/30 font-bold uppercase tracking-widest">{p.city}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-10 opacity-30 text-sm italic font-medium">Aucun partenaire ne correspond...</p>}
      </div>

      {/* ─── FICHE DÉTAIL (DRAWER) ─── */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPartner(null)} className="fixed inset-0 bg-[#2C1A0E]/80 backdrop-blur-md z-[100]" />
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[3rem] px-6 pt-4 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-[#2C1A0E]/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-4xl font-serif text-[#2C1A0E] leading-tight flex items-center gap-3">
                        {selectedPartner.name}
                        {selectedPartner.verified && <span className="text-blue-500 text-lg">✔️</span>}
                    </h2>
                    <p className="text-[10px] font-black text-[#C9963A] uppercase tracking-[0.2em] mt-2">Partenaire d'excellence</p>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="p-3 bg-white rounded-full shadow-sm text-[#2C1A0E]/20">{Icons.close}</button>
              </div>

              {/* À PROPOS & RÉSEAUX */}
              <div className="bg-white rounded-[2.5rem] p-8 mb-6 shadow-sm border border-black/[0.02]">
                <h4 className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest mb-6">L'histoire du partenaire</h4>
                <p className="text-sm text-[#2C1A0E]/70 font-medium leading-relaxed mb-8">
                  {selectedPartner.description || "Une expertise reconnue dans le soin des textures afro et bouclées."}
                </p>
                <div className="flex gap-4 border-t border-black/5 pt-6">
                    <button className="w-12 h-12 bg-[#FAF4EC] rounded-2xl flex items-center justify-center text-[#2C1A0E]/60 hover:bg-[#2C1A0E] hover:text-white transition-all shadow-sm">{Icons.facebook}</button>
                    <button className="w-12 h-12 bg-[#FAF4EC] rounded-2xl flex items-center justify-center text-[#2C1A0E]/60 hover:bg-[#2C1A0E] hover:text-white transition-all shadow-sm">{Icons.instagram}</button>
                    <button className="w-12 h-12 bg-[#FAF4EC] rounded-2xl flex items-center justify-center text-[#2C1A0E]/60 hover:bg-[#2C1A0E] hover:text-white transition-all shadow-sm">{Icons.tiktok}</button>
                </div>
              </div>

              {/* FLASH PROMO */}
              <div className="bg-[#2C1A0E] text-[#FAF4EC] p-8 rounded-[2.5rem] mb-10 relative overflow-hidden shadow-2xl">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#C9963A] opacity-20 rounded-full blur-2xl"></div>
                <span className="text-[10px] font-black text-[#C9963A] uppercase tracking-[0.3em]">Flash Promo ✨</span>
                <p className="text-xl font-serif mt-4 mb-6 italic leading-relaxed">{selectedPartner.promo || "Bénéficiez de soins offerts"}</p>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group active:scale-95 transition-all cursor-pointer">
                    <span className="text-2xl font-mono tracking-[0.3em] text-[#C9963A] uppercase font-black">{selectedPartner.promo_code || "AFRO24"}</span>
                    <span className="text-[9px] font-black uppercase opacity-30">Copier</span>
                </div>
              </div>

              {/* BOUTON WHATSAPP */}
              <button className="w-full bg-[#25D366] text-white py-6 rounded-[2.5rem] flex items-center justify-center gap-4 text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                {Icons.whatsapp} Prendre rendez-vous
              </button>

              {/* ZONE ADMIN MANAGEMENT */}
              {isAdmin && (
                <div className="mt-12 pt-8 border-t-2 border-dashed border-black/5">
                   <p className="text-[9px] font-black text-[#C9963A] text-center uppercase tracking-[0.3em] mb-6">Management Partner</p>
                   <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handlePin(selectedPartner.id, selectedPartner.pinned)} className={`py-4 border rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${selectedPartner.pinned ? 'bg-[#C9963A] text-[#2C1A0E] border-[#C9963A]' : 'bg-white border-black/5'}`}>
                            {selectedPartner.pinned ? "Épinglé 📍" : "Épingler 📍"}
                        </button>
                        <button onClick={() => handleDelete(selectedPartner.id)} className="py-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                            Supprimer 🗑️
                        </button>
                        <button className="col-span-2 py-4 bg-white border border-black/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest opacity-50">
                            Programmer Flash Promo ⚡ (Bientôt)
                        </button>
                   </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
