import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(null); // ID du partenaire en édition

  // État du formulaire enrichi
  const initialForm = {
    name: "", city: "", category: "Salon", specialty: "",
    description: "", emoji: "👑", rating: 5.0, badge: "",
    promo: "", promo_code: "", promo_deadline: "",
    phone: "", whatsapp: "", instagram: "", website: "",
    sponsored: false, banner_text: "", active: true,
    logo_url: "", tags: "", position: 0
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchPartners(); }, []);

  useEffect(() => {
    const res = partners.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.city.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  // --- LOGIQUE UPLOAD LOGO ---
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `partners-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
    if (uploadError) return alert("Erreur upload");

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);
    setFormData({ ...formData, logo_url: publicUrl });
  };

  // --- SAUVEGARDE (AJOUT OU EDITION) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isEditing 
      ? supabase.from("partners").update(formData).eq("id", isEditing)
      : supabase.from("partners").insert([formData]);

    const { error } = await action;
    if (!error) {
      setShowForm(false);
      setIsEditing(null);
      setFormData(initialForm);
      fetchPartners();
    }
  };

  const handleEdit = (p) => {
    setFormData(p);
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBoolean = async (id, field, currentValue) => {
    await supabase.from("partners").update({ [field]: !currentValue }).eq("id", id);
    fetchPartners();
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Partners Dashboard</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Management System v2.0</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if(showForm) setIsEditing(null); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all ${showForm ? 'bg-white/10 text-white rotate-45' : 'bg-[#C9963A] text-[#2C1A0E]'}`}
        >
          +
        </button>
      </header>

      {/* RECHERCHE & FILTRES */}
      <div className="mb-8">
        <input 
          type="text" placeholder="Rechercher un partenaire ou une ville..."
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm focus:border-[#C9963A]/50 outline-none transition-all"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* FORMULAIRE DYNAMIQUE */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#2C1A0E] border border-[#C9963A]/30 rounded-[2.5rem] p-6 mb-12 overflow-hidden space-y-6 shadow-2xl"
          >
            <h2 className="text-[#C9963A] text-xs font-black uppercase tracking-widest border-b border-white/5 pb-4">
              {isEditing ? "Modifier le partenaire" : "Nouveau Partenaire"}
            </h2>

            {/* Section Identité */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-white/40 ml-2">Nom</label>
                  <input type="text" value={formData.name} required className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-white/40 ml-2">Ville</label>
                  <input type="text" value={formData.city} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                    onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <select value={formData.category} className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm col-span-2"
                  onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Salon">Salon</option>
                  <option value="Produits">Produits</option>
                  <option value="Formation">Formation</option>
                </select>
                <input type="text" value={formData.emoji} placeholder="Emoji" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                  onChange={e => setFormData({...formData, emoji: e.target.value})} />
              </div>
            </div>

            {/* Section Media */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
               <label className="text-[9px] uppercase text-[#C9963A] font-black">Logo & Branding</label>
               <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-white/40 block w-full" />
               {formData.logo_url && <img src={formData.logo_url} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="Preview" />}
               <input type="text" value={formData.banner_text} placeholder="Texte de bannière (si actif)" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, banner_text: e.target.value})} />
            </div>

            {/* Section Social & Contact */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={formData.whatsapp} placeholder="WhatsApp (229...)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              <input type="text" value={formData.instagram} placeholder="Instagram (User)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, instagram: e.target.value})} />
            </div>

            {/* Section Promo */}
            <div className="p-4 bg-[#C9963A]/5 rounded-2xl border border-[#C9963A]/20 space-y-4">
              <label className="text-[9px] uppercase text-[#C9963A] font-black">Offre Promotionnelle</label>
              <input type="text" value={formData.promo} placeholder="Ex: -20% sur la pose" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, promo: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.promo_code} placeholder="Code Promo" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                  onChange={e => setFormData({...formData, promo_code: e.target.value})} />
                <input type="date" value={formData.promo_deadline} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                  onChange={e => setFormData({...formData, promo_deadline: e.target.value})} />
              </div>
            </div>

            {/* Paramètres d'affichage */}
            <div className="flex gap-4">
              <div className="flex-1 flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40">Sponsored</span>
                <input type="checkbox" checked={formData.sponsored} onChange={e => setFormData({...formData, sponsored: e.target.checked})} className="accent-[#C9963A] h-4 w-4" />
              </div>
              <div className="w-24 space-y-1">
                 <label className="text-[9px] uppercase text-white/40 ml-2">Ordre</label>
                 <input type="number" value={formData.position} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                  onChange={e => setFormData({...formData, position: parseInt(e.target.value)})} />
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#C9963A] text-[#1A0A00] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {isEditing ? "Mettre à jour" : "Publier le partenaire"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* LISTE DES PARTENAIRES */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-4xl">⏳</motion.div></div>
        ) : filtered.map(p => (
          <motion.div layout key={p.id} className={`bg-[#2C1A0E] p-5 rounded-[2.5rem] border ${p.sponsored ? 'border-[#C9963A]/40' : 'border-white/5'} flex items-center justify-between shadow-xl`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="text-3xl">{p.emoji}</span>
                {p.sponsored && <span className="absolute -top-1 -right-1 text-[8px] bg-[#C9963A] text-[#1A0A00] px-1 rounded-full font-bold">VIP</span>}
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#FAF4EC]">{p.name}</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.city} • {p.category}</p>
                <div className="flex gap-2 mt-1">
                   {p.whatsapp && <span className="text-[8px] opacity-40">📱 WA</span>}
                   {p.instagram && <span className="text-[8px] opacity-40">📸 IG</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                 <button 
                  onClick={() => toggleBoolean(p.id, 'active', p.active)}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all ${p.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                >
                  {p.active ? 'Visible' : 'Masqué'}
                </button>
                <button 
                  onClick={() => toggleBoolean(p.id, 'sponsored', p.sponsored)}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${p.sponsored ? 'bg-[#C9963A]/20 text-[#C9963A] border-[#C9963A]/30' : 'bg-white/5 text-white/20 border-white/5'}`}
                >
                  Boost
                </button>
              </div>
              <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-sm border border-white/5">✏️</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
