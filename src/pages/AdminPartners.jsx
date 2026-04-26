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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `partners-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('actifs').upload(filePath, file);
    if (uploadError) return alert("Erreur upload");

    const { data: { publicUrl } } = supabase.storage.from('actifs').getPublicUrl(filePath);
    setFormData({ ...formData, logo_url: publicUrl });
  };

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
          <h1 className="text-[#C9963A] text-2xl font-black uppercase">Partners Admin</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Management System</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if(showForm) setIsEditing(null); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-all ${showForm ? 'bg-white/10 text-white rotate-45' : 'bg-[#C9963A] text-[#2C1A0E]'}`}
        >
          +
        </button>
      </header>

      <div className="mb-8">
        <input 
          type="text" placeholder="Rechercher..."
          className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm outline-none"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#2C1A0E] border border-[#C9963A]/30 rounded-[2.5rem] p-6 mb-12 space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={formData.name} placeholder="Nom" required className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" value={formData.city} placeholder="Ville" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                onChange={e => setFormData({...formData, city: e.target.value})} />
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

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
               <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-white/40 block w-full" />
               {formData.logo_url && <img src={formData.logo_url} className="w-12 h-12 rounded-lg object-cover" alt="Preview" />}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input type="text" value={formData.whatsapp} placeholder="WhatsApp" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              <input type="text" value={formData.instagram} placeholder="Instagram" className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs"
                onChange={e => setFormData({...formData, instagram: e.target.value})} />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-white/40">Sponsored</span>
                <input type="checkbox" checked={formData.sponsored} onChange={e => setFormData({...formData, sponsored: e.target.checked})} />
              </div>
              <input type="number" value={formData.position} placeholder="Ordre" className="w-20 bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                onChange={e => setFormData({...formData, position: parseInt(e.target.value)})} />
            </div>

            <button type="submit" className="w-full py-5 bg-[#C9963A] text-[#1A0A00] font-black rounded-2xl uppercase tracking-widest shadow-xl">
              {isEditing ? "Mettre à jour" : "Publier"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? <p className="text-center opacity-40">Chargement...</p> : 
          filtered.map(p => (
          <div key={p.id} className="bg-[#2C1A0E] p-5 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <h3 className="font-bold text-sm text-[#FAF4EC]">{p.name}</h3>
                <p className="text-[9px] text-white/30 uppercase">{p.city} • {p.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleBoolean(p.id, 'active', p.active)} className={`px-2 py-1 rounded text-[8px] uppercase font-bold ${p.active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                {p.active ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-sm">✏️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
