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
    logo_url: "", active: true, position: 0
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; } 
      else { setIsAdmin(true); fetchPartners(); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const res = partners.filter(p => (p.name?.toLowerCase() || "").includes(search.toLowerCase()));
    setFiltered(res);
  }, [search, partners]);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from("partners").select("*").order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  const handleEdit = (p) => {
    setFormData({ ...initialForm, ...p });
    setIsEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase.from("partners").update({ active: !currentStatus }).eq("id", id);
    if (!error) fetchPartners();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, created_at, updated_at, ...dataToSave } = formData;
    const action = isEditing 
      ? supabase.from("partners").update(dataToSave).eq("id", isEditing)
      : supabase.from("partners").insert([dataToSave]);

    const { error } = await action;
    if (!error) {
      setShowForm(false); setIsEditing(null); setFormData(initialForm); fetchPartners();
    }
  };

  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white p-4 pb-40">
      <div className="fixed top-0 left-0 w-full z-[1000] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest">Admin : Reine</span>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">Déconnexion</button>
      </div>

      <div className="mt-20">
        <header className="flex justify-between items-center mb-8 px-2">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Partenaires</h1>
          <button onClick={() => { setFormData(initialForm); setIsEditing(null); setShowForm(!showForm); }} className="w-12 h-12 rounded-2xl bg-[#C9963A] text-black text-2xl font-light">
            {showForm ? "✕" : "+"}
          </button>
        </header>

        <div className="relative mb-8">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un partenaire..." className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-[#C9963A]/50 transition-all text-sm" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#C9963A] bg-black/40 px-2 py-1 rounded-md">Effacer</button>
          )}
        </div>

        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-zinc-900/40 p-4 rounded-[2.5rem] border border-white/5 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shadow-inner">
                  {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" alt="" /> : p.emoji || "👑"}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{p.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.active ? 'En ligne' : 'Masqué'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStatus(p.id, p.active)} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${p.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {p.active ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-xs hover:bg-white/10">✏️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
