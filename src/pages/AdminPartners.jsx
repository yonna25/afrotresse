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
    description: "", emoji: "👑", phone: "", whatsapp: "", 
    logo_url: "", active: true
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
    const res = partners.filter(p => (p.name?.toLowerCase() || "").includes(search.toLowerCase()));
    setFiltered(res);
  }, [search, partners]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    if (!error) setPartners(data || []);
    setLoading(false);
  };

  const handleEdit = (p) => {
    setFormData({ ...initialForm, ...p });
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // NETTOYAGE DES DONNÉES : On n'envoie que ce qui est rempli
    const dataToSave = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== "" && formData[key] !== null) {
        dataToSave[key] = formData[key];
      }
    });

    const action = isEditing 
      ? supabase.from("partners").update(dataToSave).eq("id", isEditing)
      : supabase.from("partners").insert([dataToSave]);

    const { error } = await action;
    if (!error) {
      setShowForm(false);
      setIsEditing(null);
      setFormData(initialForm);
      fetchPartners();
      alert("✅ Opération réussie !");
    } else {
      alert("Erreur API : " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce partenaire ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners();
    }
  };

  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white p-4 pb-40">
      {/* Barre de déconnexion fixe */}
      <div className="fixed top-0 left-0 w-full z-[1000] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest">Admin : Reine</span>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">
          Déconnexion
        </button>
      </div>

      <div className="mt-20">
        <header className="flex justify-between items-center mb-8 px-2">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase">Dashboard</h1>
          <button onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}>
            {showForm ? "✕" : "+"}
          </button>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit} className="bg-zinc-900 border border-white/5 p-6 rounded-[2.5rem] mb-10 space-y-4">
              
              <input type="text" value={formData.name} placeholder="Nom du Salon" required className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none focus:border-[#C9963A]" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              
              <input type="text" value={formData.city} placeholder="Ville" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none"
                onChange={e => setFormData({...formData, city: e.target.value})} />

              <input type="text" value={formData.whatsapp} placeholder="WhatsApp (ex: +229...)" className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none"
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} />

              <button type="submit" className="w-full py-5 bg-[#C9963A] text-black font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-xl">
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {loading ? <p className="text-center py-10 opacity-20 text-[10px] uppercase">Chargement...</p> : 
            filtered.map(p => (
              <div key={p.id} className="bg-zinc-900/40 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">{p.emoji || "👑"}</div>
                  <div>
                    <h3 className="font-bold text-sm">{p.name}</h3>
                    <p className="text-[9px] opacity-30 uppercase">{p.city}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-xs hover:bg-white/10 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs">🗑️</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
