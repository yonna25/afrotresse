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

  // Structure initiale avec tous les champs nécessaires
  const initialForm = {
    name: "",
    city: "",
    description: "",
    emoji: "👑",
    whatsapp: "",
    instagram_url: "",
    tiktok_url: "",
    is_featured: false,
    promo_text: "",
    promo_end_date: "",
    active: true,
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
    const { data } = await supabase
      .from("partners")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  const handleEdit = (p) => {
    setFormData({ ...initialForm, ...p });
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBoolean = async (id, field, currentVal) => {
    const { error } = await supabase
      .from("partners")
      .update({ [field]: !currentVal })
      .eq("id", id);
    if (!error) fetchPartners();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, created_at, updated_at, ...dataToSave } = formData;

    // Nettoyage de la date pour Supabase
    if (dataToSave.promo_end_date === "") dataToSave.promo_end_date = null;

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
      alert("Erreur : " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce partenaire ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners();
    }
  };

  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white p-4 pb-40">
      {/* Barre de navigation Admin */}
      <div className="fixed top-0 left-0 w-full z-[1000] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest">Admin Panel</span>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} 
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase"
        >
          Déconnexion
        </button>
      </div>

      <div className="mt-20 px-2">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Partenaires</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest">Gestion de la base de données</p>
          </div>
          <button 
            onClick={() => { 
              if(showForm) { setShowForm(false); setIsEditing(null); } 
              else { setFormData(initialForm); setIsEditing(null); setShowForm(true); }
            }} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-xl ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}
          >
            {showForm ? "✕" : "+"}
          </button>
        </header>

        {/* Barre de recherche */}
        <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="Rechercher un salon ou une ville..."
            className="w-full bg-zinc-900 border border-white/5 p-5 rounded-2xl text-sm outline-none focus:border-[#C9963A]/50 transition-all"
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              onSubmit={handleSubmit} 
              className="bg-zinc-900 border border-white/5 p-6 rounded-[2.5rem] mb-10 space-y-4 shadow-3xl"
            >
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, is_featured: !formData.is_featured})} 
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${formData.is_featured ? 'bg-[#C9963A] text-black border-[#C9963A]' : 'bg-transparent text-white/40 border-white/10'}`}
                >
                  📌 {formData.is_featured ? 'ÉPINGLÉ' : 'ÉPINGLER'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, active: !formData.active})} 
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${formData.active ? 'bg-green-600 text-white border-green-600' : 'bg-transparent text-white/40 border-white/10'}`}
                >
                  {formData.active ? 'VISIBLE' : 'MASQUÉ'}
                </button>
              </div>

              <input type="text" value={formData.name} placeholder="Nom du Salon *" required className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" value={formData.city} placeholder="Ville *" required className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm" onChange={e => setFormData({...formData, city: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formData.whatsapp} placeholder="WhatsApp (ex: 336...)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]" onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                <input type="text" value={formData.emoji} placeholder="Emoji (ex: 👑)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-center text-lg" onChange={e => setFormData({...formData, emoji: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formData.instagram_url} placeholder="Instagram (User)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]" onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                <input type="text" value={formData.tiktok_url} placeholder="TikTok (User)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]" onChange={e => setFormData({...formData, tiktok_url: e.target.value})} />
              </div>

              <div className="bg-black/20 p-4 rounded-2xl border border-[#C9963A]/10 space-y-3">
                <p className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest">Offre Flash</p>
                <input type="text" value={formData.promo_text} placeholder="Texte promo (ex: -15% sur RDV)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm" onChange={e => setFormData({...formData, promo_text: e.target.value})} />
                <input type="datetime-local" value={formData.promo_end_date} className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm text-white/50" onChange={e => setFormData({...formData, promo_end_date: e.target.value})} />
              </div>

              <textarea value={formData.description} placeholder="Description..." className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm h-24 resize-none" onChange={e => setFormData({...formData, description: e.target.value})} />

              <button type="submit" className="w-full py-5 bg-[#C9963A] text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                {isEditing ? "Mettre à jour" : "Ajouter le partenaire"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center opacity-20 text-[10px] uppercase tracking-widest pt-10">Chargement...</p>
          ) : (
            filtered.map(p => (
              <div key={p.id} className={`bg-zinc-900/40 p-4 rounded-[2rem] border flex items-center justify-between shadow-xl transition-all ${p.is_featured ? 'border-[#C9963A]/40' : 'border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-2xl relative">
                    {p.emoji || "👑"}
                    {p.is_featured && <span className="absolute -top-1 -right-1 text-[10px]">📌</span>}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.city}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {p.promo_text && <span className="w-1.5 h-1.5 rounded-full bg-[#C9963A] animate-pulse"></span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleBoolean(p.id, 'active', p.active)} className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-black ${p.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {p.active ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => handleEdit(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-xs">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="w-9 h-9 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-xs">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
