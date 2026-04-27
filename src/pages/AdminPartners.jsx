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
  const [sessionActive, setSessionActive] = useState(false);

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
    // Vérification de session ultra-robuste
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionActive(true);
        fetchPartners();
      } else {
        // Si vraiment pas de session, retour au login
        window.location.href = "/login"; 
      }
    };
    checkSession();

    // Écoute les changements d'état pour éviter les sauts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionActive(!!session);
    });

    return () => subscription.unsubscribe();
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
      alert("Enregistré");
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

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners();
    }
  };

  const toggleBoolean = async (id, field, currentValue) => {
    await supabase.from("partners").update({ [field]: !currentValue }).eq("id", id);
    fetchPartners();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">
      
      {/* BARRE DE DÉCONNEXION FIXE - NE DÉPEND PAS DE L'ÉTAT LOCAL */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Admin Mode</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg"
        >
          Se Déconnecter
        </button>
      </div>

      <div className="mt-16">
        <header className="flex justify-between items-center mb-8 px-2">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase">Partners Admin</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest">Gestion des partenaires</p>
          </div>
          <button 
            onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}
          >
            {showForm ? "✕" : "+"}
          </button>
        </header>

        <div className="mb-6">
          <input 
            type="text" placeholder="Rechercher..."
            className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-[#C9963A]"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 mb-8 space-y-4"
            >
              <input type="text" value={formData.name || ""} placeholder="Nom" required className="w-full bg-black/40 p-4 rounded-xl border border-white/5" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-[#C9963A] text-black font-black rounded-2xl uppercase tracking-widest">
                Sauvegarder
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {loading ? <p className="text-center opacity-20 text-[10px] uppercase">Chargement...</p> : 
            filtered.map(p => (
            <div key={p.id} className="bg-zinc-900/50 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">{p.name}</h3>
                  <p className="text-[9px] text-white/30 uppercase mt-1">{p.city}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleBoolean(p.id, 'active', p.active)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${p.active ? 'text-green-500' : 'text-red-500'}`}>
                  {p.active ? 'On' : 'Off'}
                </button>
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
