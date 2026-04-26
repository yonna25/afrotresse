import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

const Icons = {
  close: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  search: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  upload: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  plus: <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
};

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cat, setCat] = useState("Tous");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // État du formulaire basé sur tes colonnes Supabase
  const [formData, setFormData] = useState({
    name: "", city: "", category: "Salon", description: "",
    promo: "", promo_code: "", promo_expiry: "",
    verified: false, pinned: false, logo_url: "",
    whatsapp_url: "", facebook_url: "", instagram_url: "", tiktok_url: "",
    active: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      // On vérifie si l'utilisateur est admin (Reine)
      if (user && (user.email === "ton-email@exemple.com" || user.id)) setIsAdmin(true);
    };
    checkAuth();
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").eq("active", true);
    if (data) {
      setPartners(data.sort((a, b) => (b.pinned === a.pinned ? 0 : b.pinned ? -1 : 1)));
    }
    setLoading(false);
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('logos').upload(`partners/${fileName}`, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(`partners/${fileName}`);
      setFormData({ ...formData, logo_url: urlData.publicUrl });
    }
  };

  const handleSave = async () => {
    if (selectedPartner?.id && !selectedPartner.isNew) {
      await supabase.from('partners').update(formData).eq('id', selectedPartner.id);
    } else {
      await supabase.from('partners').insert([formData]);
    }
    setIsEditing(false);
    setSelectedPartner(null);
    fetchPartners();
  };

  const startAdding = () => {
    setFormData({ name: "", city: "", category: "Salon", description: "", promo: "", promo_code: "", promo_expiry: "", verified: false, pinned: false, logo_url: "", whatsapp_url: "", facebook_url: "", instagram_url: "", tiktok_url: "", active: true });
    setSelectedPartner({ isNew: true });
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF4EC] text-[#2C1A0E] pb-32">
      {/* HEADER & RECHERCHE */}
      <div className="pt-20 px-8 pb-14 bg-[#2C1A0E] text-[#FAF4EC] rounded-b-[3.5rem] shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-serif tracking-tight">Nos Partenaires</h1>
            {isAdmin && <button onClick={startAdding} className="bg-[#C9963A] p-3 rounded-full text-[#2C1A0E] shadow-lg">{Icons.plus}</button>}
        </div>
        <div className="bg-white/10 rounded-2xl border border-white/5 flex items-center p-1">
          <input type="text" placeholder="Rechercher un expert..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent p-4 flex-1 text-sm outline-none text-white" />
          <button className="bg-[#C9963A] p-3 rounded-xl text-[#2C1A0E]">{Icons.search}</button>
        </div>
      </div>

      {/* FILTRES */}
      <div className="px-6 -mt-7 mb-8 relative z-20">
        <div className="bg-white p-1 rounded-full shadow-xl border border-black/5 flex justify-around overflow-hidden">
          {["Tous", "Salon", "Formation", "Produits"].map(c => (
            <button key={c} onClick={() => setCat(c)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-full transition-all ${cat === c ? 'bg-[#2C1A0E] text-[#FAF4EC]' : 'text-black/30'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      <div className="px-6 grid gap-5">
        {partners.filter(p => (cat === "Tous" || p.category === cat) && (p.name.toLowerCase().includes(search.toLowerCase()))).map(p => (
          <div key={p.id} onClick={() => setSelectedPartner(p)} className="bg-white p-4 rounded-[2rem] shadow-sm flex items-center gap-4 relative border border-black/[0.02]">
            {p.pinned && <div className="absolute top-0 right-6 bg-[#C9963A] text-[#2C1A0E] px-3 py-0.5 rounded-b-lg text-[8px] font-black">TOP</div>}
            <div className="w-16 h-16 rounded-2xl bg-[#FAF4EC] overflow-hidden border">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20">✨</div>}
            </div>
            <div className="flex-1">
                <h3 className="font-serif text-lg">{p.name} {p.verified && "✔️"}</h3>
                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{p.city}</p>
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER ADMIN / CLIENT */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {setSelectedPartner(null); setIsEditing(false);}} className="fixed inset-0 bg-[#2C1A0E]/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 bg-[#FAF4EC] z-[101] rounded-t-[3rem] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="w-10 h-1 bg-black/5 rounded-full mx-auto mb-6" />

              {isEditing ? (
                /* FORMULAIRE ADMIN */
                <div className="space-y-4">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-white rounded-3xl border-2 border-dashed flex items-center justify-center relative overflow-hidden">
                        {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-cover" /> : Icons.upload}
                        <input type="file" onChange={handleUploadLogo} className="absolute inset-0 opacity-0" />
                    </div>
                    <span className="text-[10px] mt-2 font-bold text-[#C9963A] uppercase">Changer le Logo</span>
                  </div>

                  <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-white rounded-2xl border border-black/5" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Ville" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="p-4 bg-white rounded-2xl border border-black/5" />
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="p-4 bg-white rounded-2xl border border-black/5 font-bold">
                        <option>Salon</option><option>Formation</option><option>Produits</option>
                    </select>
                  </div>
                  <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-white rounded-2xl border border-black/5 h-24 text-sm" />
                  
                  <div className="p-4 bg-white rounded-3xl border border-black/5 space-y-3">
                    <p className="text-[10px] font-black uppercase text-[#C9963A]">Flash Promo</p>
                    <input type="text" placeholder="Offre (ex: -10%)" value={formData.promo} onChange={e => setFormData({...formData, promo: e.target.value})} className="w-full p-3 bg-[#FAF4EC] rounded-xl outline-none" />
                    <input type="date" value={formData.promo_expiry} onChange={e => setFormData({...formData, promo_expiry: e.target.value})} className="w-full p-3 bg-[#FAF4EC] rounded-xl outline-none text-xs" />
                  </div>

                  <div className="p-4 bg-white rounded-3xl border border-black/5 space-y-3">
                    <p className="text-[10px] font-black uppercase text-[#C9963A]">Réseaux & Contact</p>
                    <input type="text" placeholder="Lien WhatsApp" value={formData.whatsapp_url} onChange={e => setFormData({...formData, whatsapp_url: e.target.value})} className="w-full p-3 bg-[#FAF4EC] rounded-xl outline-none text-[10px]" />
                    <input type="text" placeholder="Lien Instagram" value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} className="w-full p-3 bg-[#FAF4EC] rounded-xl outline-none text-[10px]" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setFormData({...formData, verified: !formData.verified})} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold border ${formData.verified ? 'bg-blue-600 text-white' : 'bg-white'}`}>VÉRIFIÉ ✔️</button>
                    <button onClick={() => setFormData({...formData, pinned: !formData.pinned})} className={`flex-1 py-4 rounded-2xl text-[10px] font-bold border ${formData.pinned ? 'bg-[#C9963A] text-white' : 'bg-white'}`}>ÉPINGLER 📍</button>
                  </div>

                  <button onClick={handleSave} className="w-full bg-[#2C1A0E] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Sauvegarder</button>
                </div>
              ) : (
                /* VISION CLIENT */
                <div className="space-y-6">
                    <h2 className="text-3xl font-serif text-center">{selectedPartner.name}</h2>
                    <p className="text-sm text-center opacity-60 px-4">{selectedPartner.description}</p>
                    
                    {selectedPartner.promo && (
                        <div className="bg-[#2C1A0E] text-white p-6 rounded-[2.5rem] text-center border-2 border-[#C9963A]/20">
                            <p className="text-[10px] uppercase font-black text-[#C9963A] mb-2 tracking-widest">Offre Spéciale</p>
                            <p className="text-2xl font-serif italic mb-4">{selectedPartner.promo}</p>
                            {selectedPartner.promo_expiry && <p className="text-[9px] opacity-40 uppercase">Jusqu'au {new Date(selectedPartner.promo_expiry).toLocaleDateString()}</p>}
                        </div>
                    )}

                    <button onClick={() => window.open(selectedPartner.whatsapp_url, "_blank")} className="w-full bg-[#25D366] text-white py-5 rounded-[2.5rem] font-black uppercase tracking-widest flex justify-center gap-3 shadow-lg">Prendre RDV</button>

                    {isAdmin && (
                        <div className="grid grid-cols-2 gap-2 pt-6">
                            <button onClick={() => {setFormData(selectedPartner); setIsEditing(true);}} className="py-4 bg-white rounded-2xl font-bold text-[10px] uppercase border">Modifier ✏️</button>
                            <button onClick={() => { if(window.confirm("Supprimer ?")) { supabase.from('partners').delete().eq('id', selectedPartner.id).then(() => fetchPartners()); setSelectedPartner(null); }}} className="py-4 bg-red-50 text-red-500 rounded-2xl font-bold text-[10px] uppercase border border-red-100">Supprimer 🗑️</button>
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
