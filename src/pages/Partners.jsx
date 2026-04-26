import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isAdmin = true; // À lier à ton système de rôle

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("partners").select("*").eq("active", true).order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  // 1. Action : Supprimer
  const deletePartner = async (id) => {
    if (window.confirm("Supprimer définitivement ce partenaire ?")) {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (!error) {
        setPartners(prev => prev.filter(p => p.id !== id));
        setSelectedPartner(null);
      }
    }
  };

  // 2. Action : Enregistrer les modifications (Édition)
  const saveEdition = async () => {
    const { error } = await supabase
      .from('partners')
      .update(editForm)
      .eq('id', selectedPartner.id);

    if (!error) {
      setIsEditing(false);
      fetchPartners(); // Rafraîchir la liste
      setSelectedPartner({...selectedPartner, ...editForm});
    }
  };

  const filtered = partners.filter(p => (cat === "Tous" || p.category === cat) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#2C1A0E] pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* Header Sombre */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative">
        <h1 className="text-4xl font-serif mb-2 leading-tight">Nos partenaires</h1>
        <p className="text-[11px] uppercase tracking-widest opacity-50 mb-8">L'élite de la coiffure Afro</p>
        
        <div className="relative flex items-center bg-white/10 rounded-2xl border border-white/5 overflow-hidden focus-within:bg-white/20 transition-all">
          <input 
            type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent p-5 text-sm outline-none placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Navigation Catégories */}
      <div className="px-6 -mt-7 mb-10 relative z-20">
        <div className="bg-white p-1.5 rounded-[2rem] shadow-xl border border-black/5 grid grid-cols-4 gap-1">
          {["Tous", "Salon", "Formation", "Produits"].map(c => (
            <button key={c} onClick={() => setCat(c)} className={`py-3.5 rounded-[1.6rem] text-[9px] font-black uppercase transition-all ${cat === c ? 'bg-[#2C1A0E] text-[#FAF4EC]' : 'text-[#2C1A0E]/30'}`}>
              {c === "Formation" ? "Form." : c}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des partenaires */}
      <div className="px-6 space-y-6">
        {filtered.map(p => (
          <div key={p.id} onClick={() => { setSelectedPartner(p); setEditForm(p); setIsEditing(false); }} className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-black/[0.03] flex gap-5 items-center active:scale-95 transition-transform">
            <div className="w-20 h-20 rounded-3xl bg-[#FAF4EC] flex items-center justify-center overflow-hidden font-bold">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.emoji}
            </div>
            <div className="flex-1">
                <span className="text-[#C9963A] text-[9px] font-black uppercase tracking-widest">{p.category}</span>
                <h3 className="text-xl font-serif text-[#2C1A0E]">{p.name}</h3>
                <p className="text-[10px] text-black/30 font-medium italic">{p.city}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer : Détails / Édition / Suppression */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPartner(null)} className="fixed inset-0 bg-[#2C1A0E]/70 backdrop-blur-md z-[100]" />
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[3rem] px-6 pt-4 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-[#2C1A0E]/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="bg-[#FAF4EC] border border-[#C9963A]/20 px-4 py-2 rounded-full flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#C9963A] uppercase tracking-widest">
                        {isEditing ? "Mode Édition" : "Partenaire Certifié"}
                    </span>
                </div>
                <button onClick={() => setSelectedPartner(null)} className="p-2 bg-white rounded-full text-black/20">✕</button>
              </div>

              {/* Titre : Texte ou Input selon le mode */}
              {isEditing ? (
                <input 
                    className="text-3xl font-serif text-[#2C1A0E] mb-8 bg-white border border-black/5 rounded-xl p-2 w-full outline-none"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              ) : (
                <h2 className="text-4xl font-serif text-[#2C1A0E] mb-10 leading-tight">{selectedPartner.name}</h2>
              )}

              {/* Bloc À PROPOS */}
              <div className="bg-white rounded-[2rem] p-6 mb-6 shadow-sm border border-black/[0.02]">
                <h4 className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest mb-4">À propos</h4>
                {isEditing ? (
                    <textarea 
                        className="w-full text-sm text-[#2C1A0E]/70 font-medium bg-[#FAF4EC] rounded-xl p-4 outline-none min-h-[100px]"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    />
                ) : (
                    <p className="text-sm text-[#2C1A0E]/70 font-medium leading-relaxed">{selectedPartner.description}</p>
                )}
              </div>

              {/* Actions Admin : Édition & Suppression */}
              {isAdmin && (
                <div className="space-y-4 pt-4 border-t border-black/5">
                    {isEditing ? (
                        <button onClick={saveEdition} className="w-full py-5 bg-[#C9963A] text-[#2C1A0E] rounded-[2rem] font-black uppercase tracking-widest shadow-xl">
                            Enregistrer les changements
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button onClick={() => setIsEditing(true)} className="flex-1 py-4 bg-white text-[#C9963A] rounded-2xl text-[10px] font-black uppercase border border-black/5">
                                Modifier la fiche
                            </button>
                            <button onClick={() => deletePartner(selectedPartner.id)} className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase border border-red-100">
                                Supprimer
                            </button>
                        </div>
                    )}
                </div>
              )}

              {!isEditing && (
                <button className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl mt-8">
                    Prendre rendez-vous
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
