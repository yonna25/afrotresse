import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPartners() {
  // --- ÉTATS (STATES) ---
  const [partners, setPartners] = useState([]); // Stocke tous les partenaires
  const [filtered, setFiltered] = useState([]); // Stocke les partenaires filtrés par la recherche
  const [loading, setLoading] = useState(true); // Gère l'état de chargement
  const [showForm, setShowForm] = useState(false); // Affiche/masque le formulaire
  const [search, setSearch] = useState(""); // Stocke la valeur de la recherche
  const [isEditing, setIsEditing] = useState(null); // Stocke l'ID du partenaire en cours d'édition (null si création)
  const [isAdmin, setIsAdmin] = useState(false); // Vérifie si l'utilisateur est admin

  // Structure initiale du formulaire vide
  const initialForm = {
    name: "",
    city: "",
    description: "",
    emoji: "👑",
    active: true, // Par défaut, un nouveau partenaire est 'en ligne'
  };
  const [formData, setFormData] = useState(initialForm); // Stocke les données du formulaire

  // --- EFFETS (EFFECTS) ---
  
  // 1. Vérification de l'authentification au chargement
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // SOLUTION : Redirection si non connecté
      if (!session) {
        window.location.href = "/login"; // Renvoie vers la page de login
      } else {
        setIsAdmin(true);
        fetchPartners(); // Charge les données si admin
      }
    };
    checkUser();
  }, []);

  // 2. Gestion de la recherche (filtrage)
  useEffect(() => {
    // SOLUTION : Recherche sur le nom OU la ville
    const res = partners.filter(p => 
      (p.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.city?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [search, partners]); // S'exécute quand 'search' ou 'partners' change

  // --- FONCTIONS ACTIONS (DÉCONNEXION, CHARGEMENT) ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login"; // Redirige après déconnexion
  };

  const fetchPartners = async () => {
    setLoading(true);
    // SOLUTION : Requête simple pour récupérer tous les champs
    const { data } = await supabase.from("partners").select("*").order("name", { ascending: true });
    setPartners(data || []);
    setLoading(false);
  };

  // --- FONCTIONS CRUD (FORMULAIRE & ÉDITION) ---

  // SOLUTION : Ouvrir le formulaire en mode édition
  const handleEdit = (p) => {
    setFormData(p); // Remplit le formulaire avec les données du partenaire 'p'
    setIsEditing(p.id); // Mémorise l'ID pour savoir qu'on édite
    setShowForm(true); // Ouvre le formulaire
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Remonte en haut de page doucement
  };

  // SOLUTION : Ouvrir le formulaire en mode création (vide)
  const openNewForm = () => {
    setFormData(initialForm); // Vide le formulaire
    setIsEditing(null); // Pas d'ID = création
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // SOLUTION : Sécurité des données avant envoi
    const { id, created_at, updated_at, ...dataToSave } = formData; 
    
    // SOLUTION : Choix de l'action Supabase (Update ou Insert)
    const action = isEditing 
      ? supabase.from("partners").update(dataToSave).eq("id", isEditing) // UPDATE
      : supabase.from("partners").insert([dataToSave]); // INSERT

    const { error } = await action;

    if (!error) {
      // SOLUTION : Reset complet après succès
      setShowForm(false);
      setIsEditing(null);
      setFormData(initialForm);
      fetchPartners(); // Recharge la liste mise à jour
      alert(isEditing ? "Fiche mise à jour" : "Partenaire ajouté");
    } else {
      alert("Erreur Supabase : " + error.message);
    }
  };

  // SOLUTION : Suppression
  const handleDelete = async (id) => {
    if (window.confirm("Supprimer définitivement ce partenaire ?")) {
      await supabase.from("partners").delete().eq("id", id);
      fetchPartners(); // Recharge la liste
    }
  };

  // SOLUTION : Basculer le statut ON/OFF rapidement
  const toggleStatus = async (id, currentStatus) => {
    await supabase.from("partners").update({ active: !currentStatus }).eq("id", id);
    fetchPartners(); // Recharge la liste
  };

  // --- RENDU (UI) ---

  // Si l'auth est en cours ou non admin, on n'affiche rien (évite le flash)
  if (!isAdmin) return <div className="min-h-screen bg-black"></div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-40">
      
      {/* 1. BARRE DE DÉCONNEXION (Fixed top) */}
      <div className="fixed top-0 left-0 w-full z-[100] bg-[#8B0000] text-white p-4 flex justify-between items-center shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Console Admin</span>
        <button 
          onClick={handleLogout} 
          className="bg-white text-[#8B0000] px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all"
        >
          Déconnexion
        </button>
      </div>

      <div className="mt-20 px-2">
        {/* 2. EN-TÊTE (Header) */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[#C9963A] text-2xl font-serif">Partenaires</h1>
            <p className="text-white/30 text-[9px] uppercase tracking-widest">Base de données</p>
          </div>
          {/* SOLUTION : Bouton '+' qui gère l'ouverture/fermeture */}
          <button 
            onClick={showForm ? () => setShowForm(false) : openNewForm}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all ${showForm ? 'bg-white/10 rotate-45' : 'bg-[#C9963A] text-black'}`}
          >
            {showForm ? "✕" : "+"}
          </button>
        </header>

        {/* 3. RECHERCHE */}
        <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="Rechercher (Nom ou Ville)..."
            className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl text-sm outline-none focus:border-[#C9963A] transition-all"
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#C9963A]"
            >
              EFFACER
            </button>
          )}
        </div>

        {/* 4. FORMULAIRE (Mode création ou édition) */}
        <AnimatePresence>
          {showForm && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 mb-10 space-y-4 shadow-3xl"
            >
              <h2 className="text-[#C9963A] text-center font-bold text-xs uppercase mb-2">
                {isEditing ? `Modifier : ${formData.name}` : "Nouveau Partenaire"}
              </h2>

              {/* SOLUTION : Inputs liés à formData */}
              <input 
                type="text" 
                value={formData.name || ""} 
                placeholder="Nom du Salon/Marque" 
                required 
                className="w-full bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={formData.city || ""} 
                  placeholder="Ville" 
                  className="w-full bg-black/40 p-4 rounded-xl border border-white/5"
                  onChange={e => setFormData({...formData, city: e.target.value})} 
                />
                <input 
                  type="text" 
                  value={formData.emoji || "👑"} 
                  placeholder="Emoji" 
                  className="w-full bg-black/40 p-4 rounded-xl border border-white/5 text-center text-xl"
                  onChange={e => setFormData({...formData, emoji: e.target.value})} 
                />
              </div>

              <textarea 
                value={formData.description || ""} 
                placeholder="Description (pour la modale)..." 
                className="w-full bg-black/40 p-4 rounded-xl border border-white/5 h-28 text-sm resize-none"
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />

              <button 
                type="submit" 
                className="w-full py-5 bg-[#C9963A] text-black font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                {isEditing ? "Mettre à jour" : "Publier"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 5. LISTE DES PARTENAIRES */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center opacity-20 text-[10px] uppercase tracking-widest pt-10">Synchronisation...</p>
          ) : partners.length === 0 ? (
            <p className="text-center opacity-40 text-xs pt-10">Aucun partenaire dans la base.</p>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="bg-zinc-900/50 p-4 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  {/* SOLUTION : Design Logo minimaliste */}
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shadow-inner text-2xl">
                    {p.emoji || "👑"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-white">{p.name}</h3>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.city}</p>
                    {/* SOLUTION : Indicateur de statut visuel */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[8px] text-white/50 uppercase tracking-tight">{p.active ? 'En ligne' : 'Masqué'}</span>
                    </div>
                  </div>
                </div>
                
                {/* SOLUTION : Boutons d'action clairs */}
                <div className="flex items-center gap-2">
                  {/* Bouton rapide ON/OFF */}
                  <button 
                    onClick={() => toggleStatus(p.id, p.active)} 
                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${p.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                  >
                    {p.active ? 'OFF' : 'ON'}
                  </button>
                  {/* Bouton Éditer (Crayon) */}
                  <button onClick={() => handleEdit(p)} className="p-3 bg-white/5 rounded-xl text-xs hover:bg-white/10 transition-colors">✏️</button>
                  {/* Bouton Supprimer (Poubelle) */}
                  <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl text-xs hover:bg-red-500/20 transition-colors">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
