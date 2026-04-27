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

  const initialForm = { name: "", city: "", category: "Salon", emoji: "👑", active: true, logo_url: "", position: 0 };
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("position", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, created_at, updated_at, ...dataToSave } = formData;
    const action = isEditing ? supabase.from("partners").update(dataToSave).eq("id", isEditing) : supabase.from("partners").insert([dataToSave]);
    const { error } = await action;
    if (!error) { setShowForm(false); setIsEditing(null); setFormData(initialForm); fetchPartners(); }
  };

  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">
      {/* LA BARRE ROUGE QUE TU CHERCHES */}
      <div className="fixed top-0 left-0 w-full z-[999] bg-red-600 text-white p-4 flex justify-between items-center shadow-[0_4px_30px_rgba(220,38,38,0.5)]">
        <span className="text-[10px] font-black uppercase tracking-tighter">Connectée en tant que Reine</span>
        <button onClick={handleLogout} className="bg-white text-red-600 px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl">Déconnexion</button>
      </div>

      <div className="mt-24 px-2">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase">Admin Console</h1>
          <button onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}>
            {showForm ? "✕" : "+"}
          </button>
        </header>

        <input type="text" placeholder="Rechercher..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-sm mb-8"
          value={search} onChange={e => setSearch(e.target.value)} />

        <div className="space-y-4">
          {loading ? <p className="text-center opacity-20 text-[10px] uppercase">Chargement...</p> : 
            filtered.map(p => (
              <div key={p.id} className="bg-zinc-900 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl overflow-hidden border border-white/10">
                    {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" /> : p.emoji}
                  </div>
                  <h3 className="font-bold text-sm">{p.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFormData(p) || setIsEditing(p.id) || setShowForm(true)} className="p-3 bg-white/5 rounded-xl">✏️</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
