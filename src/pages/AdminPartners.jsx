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
  const [user, setUser] = useState(null);

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
    // Vérifier la session au chargement
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchPartners();
    };
    getUser();
  }, []);

  useEffect(() => {
    const res = partners.filter(p => 
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.city?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("position", { ascending: true });
    
    if (error) {
      console.error("Erreur fetch:", error.message);
    } else {
      setPartners(data || []);
    }
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
      alert("✅ Enregistré avec succès");
    } else {
      alert("❌ Erreur : " + error.message);
    }
  };

  const handleEdit = (p) => {
    setFormData(p);
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce partenaire ?")) {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (!error) fetchPartners();
    }
  };

  const toggleBoolean = async (id, field, currentValue) => {
    await supabase.from("partners").update({ [field]: !currentValue }).eq("id", id);
    fetchPartners();
  };

  return (
    <div className="min-h-screen bg-[#0F0500] text-[#FAF4EC] p-4 pb-32">
      
      {/* BARRE DE DÉCONNEXION D'URGENCE (TOUJOURS VISIBLE) */}
      <div className="fixed top-0 left-0 w-full z-50 bg-red-600 p-2 flex justify-between items-center shadow-xl">
         <span className="text-[10px] font-black uppercase tracking-widest pl-2">Session Admin Active</span>
         <button onClick={handleLogout} className="bg-white text-red-600 px-4 py-1 rounded-lg font-black text-[10px] uppercase">
            Quitter / Déconnexion
         </button>
      </div>

      <div className="mt-12">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase">Partners Admin</h1>
            <p className="text-white/40 text-[10px] uppercase">Status: {user ? "Connecté ✅" : "Déconnecté ❌"}</p>
          </div>
          <button 
            onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-[#1A0A00]'}`}
          >
            +
          </button>
        </header>

        <div className="mb-6">
          <input 
            type="text" placeholder="Filtrer par nom ou ville..."
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#C9963A]"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="bg-[#1A0A00] border-2 border-[#C9963A] rounded-[2.5rem] p-6 mb-8 space-y-4"
            >
              <h2 className="text-[#C9963A] font-bold uppercase text-center text-xs tracking-[0.2em]">
                  {isEditing ? "Modifier Partenaire" : "Nouveau Partenaire"}
              </h2>

              <input type="text" value={formData.name || ""} placeholder="Nom du Salon" required className="w-full bg-white/5 p-4 rounded-2xl text-sm border border-white/10" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.city || ""} placeholder="Ville" className="bg-white/5 p-4 rounded-2xl text-sm border border-white/10"
                  onChange={e => setFormData({...formData, city: e.target.value})} />
                <input type="text" value={formData.emoji || "👑"} placeholder="Emoji" className="bg-white/5 p-4 rounded-2xl text-center border border-white/10"
                  onChange={e => setFormData({...formData, emoji: e.target.value})} />
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                 <p className="text-[10px] uppercase text-white/30 mb-2">Image du logo</p>
                 <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-[10px] mb-2 block mx-auto" />
                 {formData.logo_url && <img src={formData.logo_url} className="w-16 h-16 mx-auto rounded-xl object-cover border border-[#C9963A]" alt="" />}
              </div>

              <button type="submit" className="w-full py-4 bg-[#C9963A] text-[#1A0A00] font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">
                Sauvegarder
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 animate-pulse text-[10px] uppercase tracking-[0.3em]">Synchro en cours...</div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="bg-[#1A0A00] p-4 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl overflow-hidden border border-white/10">
                    {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-none">{p.name}</h3>
                    <p className="text-[9px] text-white/30 uppercase mt-1">{p.city} • {p.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleBoolean(p.id, 'active', p.active)} className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase ${p.active ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {p.active ? 'On' : 'Off'}
                  </button>
                  <button onClick={() => handleEdit(p)} className="p-2 bg-white/5 rounded-lg text-xs">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg text-xs">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
