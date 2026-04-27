import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { id: "all",       label: "Tous",      emoji: "✺" },
  { id: "salon",     label: "Salon",     emoji: "💇🏾‍♀️" },
  { id: "produits",  label: "Produits",  emoji: "🧴" },
  { id: "formation", label: "Formation", emoji: "🎓" },
];

export default function AdminPartners() {
  const [partners, setPartners]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [search, setSearch]         = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isEditing, setIsEditing]   = useState(null);
  const [isAdmin, setIsAdmin]       = useState(false);

  const initialForm = {
    name: "",
    city: "",
    category: "salon",
    description: "",
    emoji: "👑",
    badge: "",
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
      if (!session) { window.location.href = "/login"; }
      else { setIsAdmin(true); fetchPartners(); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    let res = partners;
    if (activeFilter !== "all") res = res.filter(p => p.category === activeFilter);
    if (search.trim()) res = res.filter(p =>
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.city?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners, activeFilter]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBoolean = async (id, field, currentVal) => {
    const { error } = await supabase.from("partners").update({ [field]: !currentVal }).eq("id", id);
    if (!error) fetchPartners();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, created_at, updated_at, ...dataToSave } = formData;
    if (dataToSave.promo_end_date === "") dataToSave.promo_end_date = null;
    const action = isEditing
      ? supabase.from("partners").update(dataToSave).eq("id", isEditing)
      : supabase.from("partners").insert([dataToSave]);
    const { error } = await action;
    if (!error) {
      setShowForm(false); setIsEditing(null); setFormData(initialForm); fetchPartners();
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

  const counts = {
    all:       partners.length,
    salon:     partners.filter(p => p.category === "salon").length,
    produits:  partners.filter(p => p.category === "produits").length,
    formation: partners.filter(p => p.category === "formation").length,
  };

  const CATEGORY_COLORS = {
    salon:     { bg: "rgba(201,150,58,0.15)",  border: "rgba(201,150,58,0.4)",  text: "#C9963A" },
    produits:  { bg: "rgba(100,180,100,0.15)", border: "rgba(100,180,100,0.4)", text: "#64B464" },
    formation: { bg: "rgba(100,140,220,0.15)", border: "rgba(100,140,220,0.4)", text: "#6496DC" },
  };

  if (!isAdmin) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white p-4 pb-40">

      {/* Navbar Admin */}
      <div className="fixed top-0 left-0 w-full z-[1000] bg-red-600 text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest">Admin Panel · AfroTresse</span>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href = "/login")}
          className="bg-white text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">
          Déconnexion
        </button>
      </div>

      <div className="mt-20 px-2">

        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Partenaires</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
              {partners.length} partenaire{partners.length > 1 ? "s" : ""} enregistré{partners.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => {
              if (showForm) { setShowForm(false); setIsEditing(null); }
              else { setFormData(initialForm); setIsEditing(null); setShowForm(true); }
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-xl ${showForm ? "bg-white/10 rotate-45" : "bg-[#C9963A] text-black"}`}>
            {showForm ? "✕" : "+"}
          </button>
        </header>

        {/* Recherche */}
        <div className="mb-5">
          <input type="text" placeholder="Rechercher un partenaire ou une ville..."
            className="w-full bg-zinc-900 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-[#C9963A]/50 transition-all"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Filtres catégorie */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeFilter === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveFilter(cat.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? "#C9963A" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isActive ? "#C9963A" : "rgba(255,255,255,0.08)"}`,
                  color: isActive ? "#0A0602" : "rgba(255,255,255,0.4)",
                  boxShadow: isActive ? "0 4px 16px rgba(201,150,58,0.3)" : "none",
                }}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px]"
                  style={{ background: isActive ? "rgba(0,0,0,0.2)" : "rgba(201,150,58,0.12)", color: isActive ? "#0A0602" : "#C9963A" }}>
                  {counts[cat.id]}
                </span>
              </button>
            );
          })}
          {activeFilter !== "all" && (
            <button onClick={() => setActiveFilter("all")}
              className="flex-shrink-0 px-3 py-2 rounded-full text-[10px] font-black"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
              ✕ Reset
            </button>
          )}
        </div>

        {/* Formulaire */}
        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              onSubmit={handleSubmit}
              className="bg-zinc-900 border border-white/5 p-6 rounded-[2.5rem] mb-10 space-y-4 shadow-2xl">

              <p className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest mb-2">
                {isEditing ? "Modifier le partenaire" : "Nouveau partenaire"}
              </p>

              {/* Statuts */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${formData.is_featured ? "bg-[#C9963A] text-black border-[#C9963A]" : "bg-transparent text-white/40 border-white/10"}`}>
                  📌 {formData.is_featured ? "ÉPINGLÉ" : "ÉPINGLER"}
                </button>
                <button type="button" onClick={() => setFormData({...formData, active: !formData.active})}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black border transition-all ${formData.active ? "bg-green-600 text-white border-green-600" : "bg-transparent text-white/40 border-white/10"}`}>
                  {formData.active ? "✓ VISIBLE" : "✕ MASQUÉ"}
                </button>
              </div>

              {/* Catégorie */}
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Catégorie *</p>
                <div className="flex gap-2">
                  {CATEGORIES.filter(c => c.id !== "all").map(cat => {
                    const isActive = formData.category === cat.id;
                    const col = CATEGORY_COLORS[cat.id];
                    return (
                      <button key={cat.id} type="button" onClick={() => setFormData({...formData, category: cat.id})}
                        className="flex-1 py-3 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-1"
                        style={{
                          background: isActive ? col.bg : "transparent",
                          borderColor: isActive ? col.border : "rgba(255,255,255,0.08)",
                          color: isActive ? col.text : "rgba(255,255,255,0.3)",
                        }}>
                        {cat.emoji} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champs principaux */}
              <div className="grid grid-cols-4 gap-3">
                <input type="text" value={formData.name} placeholder="Nom *" required
                  className="col-span-3 bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm"
                  onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="text" value={formData.emoji} placeholder="👑"
                  className="col-span-1 bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-center text-lg"
                  onChange={e => setFormData({...formData, emoji: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formData.city} placeholder="Ville *" required
                  className="bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm"
                  onChange={e => setFormData({...formData, city: e.target.value})} />
                <input type="text" value={formData.badge} placeholder="Badge (ex: Top Partenaire)"
                  className="bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm"
                  onChange={e => setFormData({...formData, badge: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formData.whatsapp} placeholder="WhatsApp (ex: +336…)"
                  className="bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]"
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
                <input type="text" value={formData.instagram_url} placeholder="Instagram (username)"
                  className="bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]"
                  onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
              </div>

              <input type="text" value={formData.tiktok_url} placeholder="TikTok (username)"
                className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-[10px]"
                onChange={e => setFormData({...formData, tiktok_url: e.target.value})} />

              {/* Offre Flash */}
              <div className="bg-black/20 p-4 rounded-2xl border border-[#C9963A]/10 space-y-3">
                <p className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest">Offre Flash</p>
                <input type="text" value={formData.promo_text} placeholder="Texte promo (ex: -15% sur RDV)"
                  className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm"
                  onChange={e => setFormData({...formData, promo_text: e.target.value})} />
                <input type="datetime-local" value={formData.promo_end_date}
                  className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm text-white/50"
                  onChange={e => setFormData({...formData, promo_end_date: e.target.value})} />
              </div>

              <textarea value={formData.description} placeholder="Description..."
                className="w-full bg-black/40 p-4 rounded-xl border border-white/5 outline-none text-sm h-24 resize-none"
                onChange={e => setFormData({...formData, description: e.target.value})} />

              <button type="submit"
                className="w-full py-5 bg-[#C9963A] text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                {isEditing ? "Mettre à jour" : "Ajouter le partenaire"}
              </button>

              {isEditing && (
                <button type="button" onClick={() => { setShowForm(false); setIsEditing(null); setFormData(initialForm); }}
                  className="w-full py-4 bg-transparent border border-white/10 text-white/30 font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all">
                  Annuler
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Liste */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center opacity-20 text-[10px] uppercase tracking-widest pt-10">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center opacity-20 text-[10px] uppercase tracking-widest pt-10">Aucun partenaire trouvé</p>
          ) : (
            filtered.map(p => {
              const col = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.salon;
              return (
                <div key={p.id}
                  className={`bg-zinc-900/40 p-4 rounded-[2rem] border flex items-center justify-between shadow-xl transition-all ${p.is_featured ? "border-[#C9963A]/40" : "border-white/5"}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-2xl relative flex-shrink-0">
                      {p.emoji || "👑"}
                      {p.is_featured && <span className="absolute -top-1 -right-1 text-[10px]">📌</span>}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{p.name}</h3>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.city}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Badge catégorie */}
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}>
                          {CATEGORIES.find(c => c.id === p.category)?.emoji} {CATEGORIES.find(c => c.id === p.category)?.label}
                        </span>
                        {/* Indicateurs */}
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? "bg-green-500" : "bg-red-500"}`} />
                        {p.promo_text && <span className="w-1.5 h-1.5 rounded-full bg-[#C9963A] animate-pulse" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleBoolean(p.id, "active", p.active)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-[9px] font-black ${p.active ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                      {p.active ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => handleEdit(p)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-xs">✏️</button>
                    <button onClick={() => handleDelete(p.id)} className="w-9 h-9 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center text-xs">🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
