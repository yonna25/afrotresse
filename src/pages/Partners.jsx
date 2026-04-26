import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

// ── Icônes réseaux sociaux SVG ───────────────────────────────────────────────
const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
  ),
};

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ p, onClose }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCopy = () => {
    if (!p.promo_code) return;
    navigator.clipboard.writeText(p.promo_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 430, background: "#F7F3EE", borderRadius: "32px 32px 0 0", padding: "24px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
         <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><div style={{ width: 40, height: 4, background: "#DDD", borderRadius: 2 }} /></div>
         
         <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "#FFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #EEE" }}>
               {p.logo_url ? <img src={p.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 40 }}>{p.emoji}</span>}
            </div>
            <div>
               <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1A0F06" }}>{p.name}</h2>
               <p style={{ margin: 0, fontSize: 13, color: "#C9963A", fontWeight: 700 }}>{p.city}</p>
            </div>
         </div>

         <p style={{ fontSize: 14, lineHeight: 1.6, color: "#555" }}>{p.description || "Aucune description disponible."}</p>
         
         {p.promo && (
           <div style={{ background: "#FFF", padding: 20, borderRadius: 20, border: "1px dashed #C9963A", marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#C9963A", textTransform: "uppercase" }}>Offre Spéciale</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{p.promo}</p>
              </div>
              <button onClick={handleCopy} style={{ background: copied ? "#4CAF50" : "#1A0F06", color: "#FFF", border: "none", padding: "10px 15px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                {copied ? "COPIÉ !" : "COPIER"}
              </button>
           </div>
         )}

         {p.whatsapp && (
           <button onClick={() => window.open(`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`, "_blank")} style={{ width: "100%", marginTop: 20, padding: 18, background: "#25D366", color: "#FFF", border: "none", borderRadius: 20, fontWeight: 900, fontSize: 15 }}>
             CONTACTER SUR WHATSAPP
           </button>
         )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    console.log("Tentative de récupération des partenaires...");
    
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) {
      console.error("Erreur Supabase lors de la lecture :", error.message);
    } else {
      console.log("Données reçues :", data);
      setPartners(data || []);
    }
    setLoading(false);
  };

  const filtered = partners.filter(p => {
    const matchCat = cat === "Tous" || p.category === cat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EE", maxWidth: 430, margin: "0 auto", paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: "60px 24px 20px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#1A0F06", fontFamily: "Georgia, serif", margin: 0 }}>Partenaires</h1>
        <p style={{ color: "#8A7060", fontSize: 14, margin: "8px 0 0" }}>Les meilleurs experts pour vos cheveux.</p>
      </div>

      {/* Filtres */}
      <div style={{ padding: "0 24px 24px" }}>
        <input 
          type="text" placeholder="Rechercher un salon..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "16px 20px", borderRadius: 20, border: "none", background: "#FFF", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", outline: "none" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16, overflowX: "auto", paddingBottom: 5 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "10px 20px", borderRadius: 99, border: "none", whiteSpace: "nowrap",
              background: cat === c ? "#C9963A" : "#FFF", color: cat === c ? "#FFF" : "#1A0F06", fontWeight: 700, fontSize: 13
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: "0 20px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#C9963A", fontWeight: 700, padding: 40 }}>Chargement des pépites...</p>
        ) : filtered.length > 0 ? (
          <div style={{ display: "grid", gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelected(p)} style={{ background: "#FFF", borderRadius: 28, padding: 16, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.02)", cursor: "pointer" }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, overflow: "hidden", background: "#F7F3EE", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.logo_url ? <img src={p.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28 }}>{p.emoji}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#C9963A", textTransform: "uppercase", marginBottom: 2 }}>{p.category}</div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#1A0F06" }}>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#8A7060" }}>{p.city}</p>
                </div>
                <div style={{ fontSize: 18 }}>→</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 40 }}>
             <p style={{ color: "#8A7060", fontSize: 14 }}>Aucun partenaire trouvé dans cette catégorie.</p>
          </div>
        )}
      </div>

      {selected && <Modal p={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
