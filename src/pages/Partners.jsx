import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

const Icons = {
  close: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  search: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  clear: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  upload: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  plus: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
};

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cat, setCat] = useState("Tous");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // État pour le formulaire (Ajout/Modif)
  const [formData, setFormData] = useState({
    name: "", city: "", category: "Salon", description: "", promo: "", promo_code: "", verified: false, pinned: false, logo_url: ""
  });

  useEffect(() => {
    checkUser();
    fetchPartners();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === "ton-email@exemple.com") setIsAdmin(true);
  };

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").eq("active", true);
    if (data) {
      setPartners(data.sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? -1 : 1)));
    }
    setLoading(false);
  };

  // ─── LOGIQUE UPLOAD LOGO ──────────────────────────────────────────
  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `partners-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file);

    if (!uploadError) {
      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      setFormData({ ...formData, logo_url: data.publicUrl });
    }
  };

  // ─── SAUVEGARDE (CREATE / UPDATE) ────────────────────────────────
  const handleSave = async () => {
    if (selectedPartner?.id) {
      // UPDATE
      await supabase.from('partners').update(formData).eq('id', selectedPartner.id);
    } else {
      // CREATE
      await supabase.from('partners').insert([{ ...formData, active: true }]);
    }
    setIsEditing(false);
    setSelectedPartner(null);
    fetchPartners();
  };

  const startAdding = () => {
    setFormData({ name: "", city: "", category: "Salon", description: "", promo: "", promo_code: "", verified: false, pinned: false, logo_url: "" });
    setSelectedPartner({ isNew: true });
    setIsEditing(true);
  };

  const startEditing = (p) => {
    setFormData(p);
    setIsEditing(true);
  };

  const filtered = partners.filter(p => 
    (cat === "Tous" || p.category === cat) &&
    (p.name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#2C1A0E] pb-32">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap'); .font-serif { font-family: 'Playfair Display', serif; }`}</style>

      {/* HEADER */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-serif">Nos partenaires</h1>
            {isAdmin && (
                <button onClick={startAdding} className="bg-[#C9963A] p-3 rounded-full text-[#2C1A0E] shadow-xl active:scale-90 transition-all">
                    {Icons.plus}
                </button>
            )}
        </div>
        
        <div className="relative flex items-center bg-white/10 rounded-2xl border border-white/5 overflow-hidden ring-[#C9963A]/50 focus-within:ring-2 transition-all">
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent p-5 text-sm outline-none text-white" />
          {search && <button onClick={() => setSearch("")} className="p-2 text-white/40">{Icons.clear}</button>}
          <button className="bg-[#C9963A] p-4 m-1.5 rounded-xl text-[#2C1A0E]">{Icons.search}</button>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="px-6 -mt-7 mb-10 relative z-20">
        <div className="bg-white p-1.5 rounded-[2rem] shadow-xl border border-black/5 grid grid-cols-4 gap-1">
          {["Tous", "Salon", "Formation", "Produits"].map(c => (
            <button key={c} onClick={() => setCat(c)} className={`py-3.5 rounded-[1.6rem] text-[9px] font-black uppercase transition-all ${cat === c ? 'bg-[#2C1A0E] text-[#FAF4EC]' : 'text-[#2C1A0E]/30'}`}>{c === "Formation" ? "Form." : c}</button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      <div className="px-6 space-y-6">
        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelectedPartner(p)} className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-black/[0.03] flex gap-5 items-center relative active:scale-95 transition-all">
            {p.pinned && <div className="absolute top-0 right-8 bg-[#C9963A] px-3 py-1 rounded-b-xl text-[8px] font-black uppercase text-[#2C1A0E]">Favori</div>}
            <div className="w-20 h-20 rounded-3xl bg-[#FAF4EC] overflow-hidden border border-black/5 flex items-center justify-center">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">✨</span>}
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-serif">{p.name} {p.verified && "✔️"}</h3>
                <p className="text-[10px] text-black/30 font-bold uppercase">{p.city}</p>
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER EDITION / VISION */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {setSelectedPartner(null); setIsEditing(false);}} className="fixed inset-0 bg-[#2C1A0E]/80 backdrop-blur-md z-[100]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[3rem] px-6 pt-4 pb-12 shadow-2xl max-h-[95vh] overflow-y-auto text-[#2C1A0E]">
              <div className="w-12 h-1 bg-[#2C1A0E]/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl font-serif">{isEditing ? "Configuration" : selectedPartner.name}</h2>
                <button onClick={() => {setSelectedPartner(null); setIsEditing(false);}} className="p-3 bg-white rounded-full text-[#2C1A0E]/20">{Icons.close}</button>
              </div>

              {isEditing ? (
                // FORMULAIRE D'EDITION
                <div className="space-y-4">
                  <div className="flex gap-4 items-center bg-white p-4 rounded-3xl border border-black/5">
                    <div className="w-16 h-16 bg-[#FAF4EC] rounded-2xl flex items-center justify-center relative overflow-hidden border">
                        {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-cover" /> : Icons.upload}
                        <input type="file" onChange={handleUploadLogo} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <p className="text-[10px] font-bold uppercase opacity-40 italic">Cliquez pour le logo</p>
                  </div>
                  
                  <input type="text" placeholder="Nom du partenaire" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white p-5 rounded-2xl border border-black/5 outline-none" />
                  <input type="text" placeholder="Ville" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white p-5 rounded-2xl border border-black/5 outline-none" />
                  
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white p-5 rounded-2xl border border-black/5 outline-none">
                    <option>Salon</option><option>Formation</option><option>Produits</option>
                  </select>

                  <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white p-5 rounded-2xl border border-black/5 outline-none h-32" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Promo (ex: -20%)" value={formData.promo} onChange={e => setFormData({...formData, promo: e.target.value})} className="bg-white p-5 rounded-2xl border border-black/5 outline-none" />
                    <input type="text" placeholder="Code Promo" value={formData.promo_code} onChange={e => setFormData({...formData, promo_code: e.target.value})} className="bg-white p-5 rounded-2xl border border-black/5 outline-none" />
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setFormData({...formData, verified: !formData.verified})} className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase border ${formData.verified ? 'bg-blue-500 text-white' : 'bg-white'}`}>Badge Vérifié {formData.verified ? '✔️' : ''}</button>
                    <button onClick={() => setFormData({...formData, pinned: !formData.pinned})} className={`flex-1 py-4 rounded-2xl font-bold text-[10px] uppercase border ${formData.pinned ? 'bg-[#C9963A] text-white' : 'bg-white'}`}>Épingler 📍</button>
                  </div>

                  <button onClick={handleSave} className="w-full bg-[#2C1A0E] text-[#FAF4EC] py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl">Enregistrer les modifications</button>
                </div>
              ) : (
                // VISION CLIENT
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-black/[0.02]">
                        <p className="text-sm opacity-70 leading-relaxed">{selectedPartner.description || "Expertise afro premium."}</p>
                    </div>

                    <div className="bg-[#2C1A0E] text-[#FAF4EC] p-8 rounded-[2.5rem]">
                        <span className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest">Offre Spéciale</span>
                        <p className="text-xl font-serif mt-2">{selectedPartner.promo || "Soins offerts"}</p>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-4 flex justify-between items-center">
                            <span className="font-mono text-[#C9963A] text-xl uppercase">{selectedPartner.promo_code || "AFRO"}</span>
                            <span className="text-[8px] opacity-30">COPIER</span>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-dashed">
                            <button onClick={() => startEditing(selectedPartner)} className="py-4 bg-white border border-black/5 rounded-2xl font-bold text-[10px] uppercase">Modifier l'annonce ✏️</button>
                            <button onClick={() => { if(window.confirm("Supprimer ?")) { supabase.from('partners').delete().eq('id', selectedPartner.id).then(() => fetchPartners()); setSelectedPartner(null); }}} className="py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] uppercase">Supprimer 🗑️</button>
                        </div>
                    )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
