import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(null);

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
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.city?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = "/";
    }
  };

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `partners-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('actifs').upload(filePath, file);
    if (uploadError) return alert("Erreur upload : " + uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from('actifs').getPublicUrl(filePath);
    setFormData({ ...formData, logo_url: publicUrl });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, created_at, updated_at, ...dataToSave } = formData; 

    const action = isEditing 
      ? supabase.from("partners").update(dataToSave).eq("id", isEditing)
      : supabase.from("partners").insert([dataToSave]);

    const { error } = await action;
    
    if (!error) {
      setShowForm(false);
      setIsEditing(null);
      setFormData(initialForm);
      fetchPartners();
      alert("Enregistré avec succès");
    } else {
      alert("Erreur : " + error.message);
    }
  };

  const handleEdit = (p) => {
    setFormData(p);
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetAndOpen = () => {
    setFormData(initialForm);
    setIsEditing(null);
    setShowForm(!showForm);
  };

  const toggleBoolean = async (id, field, currentValue) => {
    await supabase.from("partners").update({ [field]: !currentValue }).eq("id", id);
    fetchPartners();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce partenaire ?")) {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (!error) fetchPartners();
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-6 pb-32">
      <header className="flex justify-between items-start mb-8 bg-white/5 p-5 rounded-[2rem] border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Partners Admin</h1>
          <button 
            onClick={handleLogout}
            className="mt-3 px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Déconnexion
          </button>
        </div>

        <button 
          onClick={resetAndOpen}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all ${showForm ? 'bg-white/10 text-white rotate-45' : 'bg-[#C9963A] text-[#2C1A0E]'}`}
        >
          {showForm ? "✕" : "+"}
        </button>
      </header>

      <div className="mb-8">
        <input 
          type="text" placeholder="Rechercher un partenaire..."
          className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-sm outline-none focus:border-[#C9963A]/50 transition-colors"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#2C1A0E] border border-[#C9963A]/30 rounded-[2.5rem] p-6 mb-12 space-y-4 overflow-hidden shadow-2xl"
          >
            <h2 className="text-[#C9963A] font-bold uppercase text-xs tracking-widest mb-2 text-center">
                {isEditing ? "Mode Édition" : "Nouveau Partenaire"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={formData.name || ""} placeholder="Nom" required className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" value={formData.city || ""} placeholder="Ville" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm"
                onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <select value={formData.category || "Salon"} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm col-span-2 text-white"
                onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Salon" className="bg-[#2C1A0E]">Salon</option>
                <option value="Produits" className="bg-[#2C1A0E]">Produits</option>
                <option value="Formation" className="bg-[#2C1A0E]">Formation</option>
              </select>
              <input type="text" value={formData.emoji || ""} placeholder="Emoji" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center"
                onChange={e => setFormData({...formData, emoji: e.target.value})} />
            </div>

            <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4 text-center">
               <label className="text-[10px] uppercase text-white/40 font-bold block">Logo du partenaire</label>
               <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-white/40 mx-auto" />
               {formData.logo_url && (
                 <img src={formData.logo_url} className="w-20 h-20 mx-auto rounded-2xl object-cover border-2 border-[#C9963A]/50" alt="" />
               )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <label className="text-[9px] uppercase text-white/40 font-bold block mb-1">Promo Expiration</label>
                <input type="date" value={formData.promo_deadline || ""} className="w-full bg-transparent text-xs text-[#FAF4EC] outline-none"
                  onChange={e => setFormData({...formData, promo_deadline: e.target.value})} />
              </div>
              <input type="number" value={formData.position || 0} placeholder="Ordre" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm"
                onChange={e => setFormData({...formData, position: parseInt(e.target.value) || 0})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={formData.whatsapp || ""} placeholder="WhatsApp Number" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs"
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              <input type="text" value={formData.instagram || ""} placeholder="Instagram Link" className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs"
                onChange={e => setFormData({...formData, instagram: e.target.value})} />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40">Mettre en avant (Sponsorisé)</span>
                <input type="checkbox" checked={formData.sponsored || false} onChange={e => setFormData({...formData, sponsored: e.target.checked})} className="accent-[#C9963A] w-6 h-6" />
            </div>

            <button type="submit" className="w-full py-5 bg-[#C9963A] text-[#1A0A00] font-black rounded-[2rem] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {isEditing ? "Sauvegarder les modifications" : "Publier maintenant"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? <p className="text-center opacity-40 py-10 tracking-widest text-[10px] uppercase">Chargement des partenaires...</p> : 
          filtered.map(p => (
          <div key={p.id} className="bg-[#2C1A0E] p-5 rounded-[2.5rem] border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              {p.logo_url ? 
                <img src={p.logo_url} className="w-14 h-14 rounded-2xl object-cover border border-[#C9963A]/20" alt="" /> : 
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">{p.emoji}</div>
              }
              <div>
                <h3 className="font-bold text-sm text-[#FAF4EC] leading-tight">{p.name}</h3>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.city} • {p.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleBoolean(p.id, 'active', p.active)} 
                className={`px-3 py-1.5 rounded-full text-[8px] uppercase font-black ${p.active ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}
              >
                {p.active ? 'Actif' : 'Masqué'}
              </button>
              <button onClick={() => handleEdit(p)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xs">✏️</button>
              <button onClick={() => handleDelete(p.id)} className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-xs">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
