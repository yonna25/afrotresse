import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "", city: "", category: "Salon", specialty: "",
    description: "", emoji: "👑", rating: 5.0, badge: "",
    promo: "", promo_code: "", promo_deadline: "",
    phone: "", instagram: "", sponsored: false,
    banner_text: "", active: true
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("partners").insert([formData]);
    if (!error) {
      setShowForm(false);
      fetchPartners();
      setFormData({ name: "", city: "", category: "Salon", emoji: "👑", active: true }); // Reset
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from("partners").update({ active: !currentStatus }).eq("id", id);
    fetchPartners();
  };

  const deletePartner = async (id) => {
    if (window.confirm("Supprimer ce partenaire ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners();
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-6 pb-20">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-[#C9963A] text-2xl font-black uppercase">Admin Partenaires</h1>
          <p className="text-white/40 text-[10px]">Gestion du catalogue AfroTresse</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-2xl flex items-center justify-center text-2xl shadow-lg"
        >
          {showForm ? "✕" : "+"}
        </button>
      </header>

      {/* FORMULAIRE D'AJOUT */}
      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#2C1A0E] border border-[#C9963A]/20 rounded-[2rem] p-6 mb-10 overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nom du salon" required className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm" 
                onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" placeholder="Ville" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <select className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Salon">Salon</option>
                <option value="Produits">Produits</option>
                <option value="Formation">Formation</option>
              </select>
              <input type="text" placeholder="Emoji (ex: ✨)" className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm"
                onChange={e => setFormData({...formData, emoji: e.target.value})} />
            </div>

            <textarea placeholder="Description" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm h-20"
              onChange={e => setFormData({...formData, description: e.target.value})} />

            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <label className="text-[10px] uppercase font-bold text-white/40">Mode Boost (Sponsored)</label>
              <input type="checkbox" onChange={e => setFormData({...formData, sponsored: e.target.checked})} className="accent-[#C9963A]" />
            </div>

            <button type="submit" className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] font-black rounded-xl uppercase tracking-widest shadow-xl">
              Enregistrer le partenaire
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* LISTE DES PARTENAIRES */}
      <div className="space-y-4">
        {loading ? <p className="text-center opacity-40">Chargement...</p> : 
          partners.map(p => (
            <div key={p.id} className="bg-[#2C1A0E] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <p className="text-[10px] opacity-40 uppercase">{p.city} • {p.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleStatus(p.id, p.active)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${p.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                >
                  {p.active ? 'Actif' : 'Masqué'}
                </button>
                <button onClick={() => deletePartner(p.id)} className="p-2 bg-white/5 rounded-lg text-xs">🗑️</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
