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
  const [isAdmin, setIsAdmin] = useState(false);

  const initialForm = {
    name: "", city: "", category: "Salon", specialty: "",
    description: "", emoji: "👑", rating: 5.0, badge: "",
    promo: "", promo_code: "", promo_deadline: "",
    phone: "", whatsapp: "", instagram: "", website: "",
    sponsored: false, banner_text: "", active: true,
    logo_url: "", tags: "", position: 0
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
      } else {
        setIsAdmin(true);
        fetchPartners();
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const res = partners.filter(p => 
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.city?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
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

  const handleEdit = (p) => {
    setFormData({ ...initialForm, ...p }); 
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    } else {
      alert("Erreur API : " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners();
    }
  };

  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">
      <div className="fixed top-0 left-0 w-full z-[999] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest">Admin Mode</span>
        <button onClick={handleLogout} className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg">Déconnexion</button>
      </div>

      <div className="mt-20 px-2">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase">Dashboard</h1>
          <button onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}>
            {showForm ? "✕" : "+"}
          </button>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 mb-10 space-y-4">
              
              <input type="text" value={formData.name} placeholder="Nom du Salon" required className="w-full bg-black/40 p-4 rounded-xl border border-white/5" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.city} placeholder="Ville" className="bg-black/40 p-4 rounded-xl border border-white/5"
                  onChange={e => setFormData({...formData, city: e.target.value})} />
                <input type="text" value={formData.specialty} placeholder="Spécialité" className="bg-black/40 p-4 rounded-xl border border-white/5"
                  onChange={e => setFormData({...formData, specialty: e.target.value})} />
              </div>

              <textarea value={formData.description} placeholder="Description" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 h-24"
                onChange={e => setFormData({...formData, description: e.target.value})} />

              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.phone} placeholder="Téléphone" className="bg-black/40 p-4 rounded-xl border border-white/5"
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input type="text" value={formData.whatsapp} placeholder="WhatsApp" className="bg-black/40 p-4 rounded-xl border border-white/5"
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-center">
                 <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-[10px] mb-2" />
                 {formData.logo_url && <img src={formData.logo_url} className="w-16 h-16 mx-auto rounded-lg object-cover border border-[#C9963A]" alt="" />}
              </div>

              <button type="submit" className="w-full py-5 bg-[#C9963A] text-black font-black rounded-2xl uppercase tracking-widest shadow-lg">
                {isEditing ? "Mettre à jour" : "Publier"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {loading ? <p className="text-center opacity-20 text-[10px] uppercase">Sync...</p> : 
            filtered.map(p => (
            <div key={p.id} className="bg-zinc-900/50 p-4 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                  {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{p.name}</h3>
                  <p className="text-[9px] text-white/30 uppercase">{p.city}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-xs">✏️</button>
                <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
