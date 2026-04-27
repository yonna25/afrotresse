import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";

const CATEGORIES = [
  { id: "all",       label: "Tous",      emoji: "✦" },
  { id: "salon",     label: "Salon",     emoji: "💇🏾‍♀️" },
  { id: "produits",  label: "Produits",  emoji: "🧴" },
  { id: "formation", label: "Formation", emoji: "🎓" },
];

function mapPartner(row) {
  return {
    ...row,
    categoryLabel:  row.category_label || "",
    promo:          row.promo_text || row.promo || null,
    promo_deadline: row.promo_end_date || row.promo_deadline || null,
    socials: {
      instagram: row.instagram_url || row.instagram || null,
      tiktok:    row.tiktok_url    || null,
    },
  };
}

function useCountdown(deadline) {
  const [t, setT] = useState({ h:"00", m:"00", s:"00", expired:false });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setT({ h:"00", m:"00", s:"00", expired:true }); return; }
      setT({
        h: String(Math.floor(diff/3600000)).padStart(2,"0"),
        m: String(Math.floor((diff%3600000)/60000)).padStart(2,"0"),
        s: String(Math.floor((diff%60000)/1000)).padStart(2,"0"),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return t;
}

const IGIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const TKIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);
const WAIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

// ── Modal détail partenaire ───────────────────────────────────────────────────
function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 380); };
  const wa = () => window.open(
    `https://wa.me/${(partner.whatsapp || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`,
    "_blank"
  );

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      background: vis ? "rgba(10,6,2,0.75)" : "transparent",
      backdropFilter: vis ? "blur(20px)" : "none",
      transition: "all 0.35s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto",
        background: "linear-gradient(160deg, #FDFAF5 0%, #F5EDD8 100%)",
        borderRadius:"32px 32px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1)",
        position:"relative", overflow:"hidden",
        border: "1px solid rgba(201,150,58,0.35)",
        borderBottom: "none",
        boxShadow: "0 -20px 60px rgba(201,150,58,0.15)",
      }}>
        {/* Ligne d'accroche top */}
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"50%", height:1, background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.7),transparent)", zIndex:1 }}/>
        {/* Poignée */}
        <div style={{ display:"flex", justifyContent:"center", padding:"16px 0 8px", position:"relative", zIndex:2 }}>
          <div style={{ width:36, height:3, borderRadius:99, background:"rgba(201,150,58,0.3)" }}/>
        </div>
        {/* Bouton fermer */}
        <button onClick={close} style={{
          position:"absolute", top:14, right:18, zIndex:10,
          width:34, height:34, borderRadius:99,
          background:"rgba(201,150,58,0.1)", border:"1px solid rgba(201,150,58,0.25)",
          cursor:"pointer", color:"rgba(140,90,20,0.7)", fontSize:13, fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>

        <div style={{ padding:"4px 26px 56px", position:"relative", zIndex:2 }}>

          {/* Identité */}
          <div style={{ marginBottom:28, paddingTop:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
              <div style={{
                width:72, height:72, borderRadius:20, flexShrink:0,
                background:"linear-gradient(145deg,#FFF8EC,#F5EDD8)",
                border:"1.5px solid rgba(201,150,58,0.3)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:32,
                boxShadow:"0 4px 20px rgba(201,150,58,0.15)",
              }}>{partner.emoji}</div>
              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(140,90,20,0.6)", marginBottom:6, fontFamily:"sans-serif" }}>{partner.categoryLabel}</div>
                <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:26, fontWeight:700, color:"#1A0E04", lineHeight:1.0 }}>{partner.name}</div>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"#C9963A", marginTop:7, fontFamily:"sans-serif" }}>{partner.city}</div>
              </div>
            </div>

            {(partner.rating || partner.reviews) && (
              <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:14, borderTop:"1px solid rgba(201,150,58,0.15)" }}>
                {partner.rating && (
                  <div style={{ display:"flex", gap:3 }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                        fill={i<=Math.round(partner.rating)?"#C9963A":"none"}
                        stroke={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.3)"}
                        strokeWidth="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    ))}
                  </div>
                )}
                <span style={{ fontSize:12, color:"rgba(30,15,2,0.45)", fontFamily:"sans-serif" }}>
                  {partner.rating ? `${partner.rating}` : ""}{partner.reviews ? ` · ${partner.reviews} avis` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Badge */}
          {partner.badge && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:99, background:"rgba(201,150,58,0.1)", border:"1px solid rgba(201,150,58,0.25)", marginBottom:24 }}>
              <span style={{ width:5, height:5, borderRadius:99, background:"#C9963A", display:"inline-block" }}/>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase", color:"#A07020", fontFamily:"sans-serif" }}>{partner.badge}</span>
            </div>
          )}

          {/* Offre flash */}
          {hasPromo && (
            <div style={{
              background:"linear-gradient(135deg,rgba(201,150,58,0.12),rgba(201,150,58,0.04))",
              border:"1px solid rgba(201,150,58,0.3)", borderRadius:20,
              padding:"18px 20px", marginBottom:24, position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:0, right:0, width:80, height:80, borderRadius:"0 0 0 80px", background:"rgba(201,150,58,0.07)", pointerEvents:"none" }}/>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(140,90,20,0.6)", marginBottom:8, fontFamily:"sans-serif" }}>Offre flash</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#1A0E04", fontFamily:"sans-serif", marginBottom:14 }}>{partner.promo}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(140,90,20,0.5)", fontFamily:"sans-serif" }}>Expire dans</div>
                {[cd.h, cd.m, cd.s].map((v, i) => (
                  <span key={i} style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#C9963A", background:"rgba(201,150,58,0.12)", padding:"3px 7px", borderRadius:7, letterSpacing:2 }}>
                    {v}{i<2?"h":"s"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {partner.description && (
            <p style={{ fontSize:13, color:"rgba(30,15,2,0.55)", fontFamily:"sans-serif", lineHeight:1.75, marginBottom:28 }}>{partner.description}</p>
          )}

          {/* Contacts */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
            {partner.whatsapp && (
              <button onClick={wa} style={{
                display:"flex", alignItems:"center", gap:12, padding:"16px 22px",
                borderRadius:18, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.2)",
                cursor:"pointer", width:"100%", textAlign:"left",
              }}>
                <span style={{ color:"#25D366", flexShrink:0 }}><WAIcon /></span>
                <span style={{ fontSize:11, fontWeight:800, color:"#1a7a3a", fontFamily:"sans-serif", letterSpacing:"0.1em", textTransform:"uppercase" }}>Contacter sur WhatsApp</span>
              </button>
            )}
            {partner.socials?.instagram && (
              <a href={`https://instagram.com/${partner.socials.instagram}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 22px", borderRadius:18, background:"rgba(225,48,108,0.07)", border:"1px solid rgba(225,48,108,0.2)", textDecoration:"none" }}>
                <span style={{ color:"#E1306C", flexShrink:0 }}><IGIcon /></span>
                <span style={{ fontSize:11, fontWeight:800, color:"#a02050", fontFamily:"sans-serif", letterSpacing:"0.1em", textTransform:"uppercase" }}>@{partner.socials.instagram}</span>
              </a>
            )}
            {partner.socials?.tiktok && (
              <a href={`https://tiktok.com/@${partner.socials.tiktok}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 22px", borderRadius:18, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.1)", textDecoration:"none" }}>
                <span style={{ color:"#1A0E04", flexShrink:0 }}><TKIcon /></span>
                <span style={{ fontSize:11, fontWeight:800, color:"rgba(30,15,2,0.6)", fontFamily:"sans-serif", letterSpacing:"0.1em", textTransform:"uppercase" }}>@{partner.socials.tiktok}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte partenaire ──────────────────────────────────────────────────────────
function PartnerCard({ partner, onClick }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;

  return (
    <div onClick={onClick} style={{
      background: "linear-gradient(145deg, #FFFFFF, #FAF5EB)",
      border: `1px solid ${partner.is_featured ? "rgba(201,150,58,0.5)" : "rgba(201,150,58,0.15)"}`,
      borderRadius:24, padding:"20px 18px", cursor:"pointer",
      position:"relative", overflow:"hidden",
      transition:"all 0.25s",
      boxShadow: partner.is_featured
        ? "0 8px 40px rgba(201,150,58,0.18), 0 2px 8px rgba(0,0,0,0.04)"
        : "0 2px 16px rgba(0,0,0,0.05)",
    }}>
      {partner.is_featured && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.8),transparent)" }}/>
      )}
      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
        <div style={{
          width:56, height:56, borderRadius:16, flexShrink:0,
          background:"linear-gradient(145deg,#FFF8EC,#F5EDD8)",
          border:"1px solid rgba(201,150,58,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:26,
          boxShadow:"0 2px 12px rgba(201,150,58,0.1)",
        }}>{partner.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
            <span style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:18, fontWeight:700, color:"#1A0E04", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{partner.name}</span>
            {partner.is_featured && <span style={{ fontSize:9 }}>📌</span>}
          </div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(140,90,20,0.6)", marginBottom:8, fontFamily:"sans-serif" }}>{partner.city}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            {partner.categoryLabel && (
              <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(140,90,20,0.7)", background:"rgba(201,150,58,0.1)", border:"1px solid rgba(201,150,58,0.2)", borderRadius:99, padding:"2px 8px", fontFamily:"sans-serif" }}>{partner.categoryLabel}</span>
            )}
            {partner.badge && (
              <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(140,90,20,0.8)", background:"rgba(201,150,58,0.08)", border:"1px solid rgba(201,150,58,0.2)", borderRadius:99, padding:"2px 8px", fontFamily:"sans-serif" }}>{partner.badge}</span>
            )}
            {partner.rating && (
              <span style={{ fontSize:9, color:"#B8821E", fontFamily:"sans-serif", fontWeight:700 }}>★ {partner.rating}{partner.reviews ? ` (${partner.reviews})` : ""}</span>
            )}
          </div>
        </div>
      </div>
      {hasPromo && (
        <div style={{ marginTop:14, padding:"10px 14px", borderRadius:14, background:"rgba(201,150,58,0.08)", border:"1px solid rgba(201,150,58,0.2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"#A07020", fontWeight:700, fontFamily:"sans-serif" }}>{partner.promo}</span>
          <span style={{ fontSize:10, color:"rgba(160,112,32,0.6)", fontFamily:"monospace", letterSpacing:1 }}>{cd.h}h{cd.m}m</span>
        </div>
      )}
    </div>
  );
}

// ── Page principale Partners ──────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("partners_search_history") || "[]"); }
    catch { return []; }
  });
  const [showHistory, setShowHistory]   = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (!error) setPartners((data || []).map(mapPartner));
      setLoading(false);
    };
    fetchPartners();
  }, []);

  const counts = {
    all:       partners.length,
    salon:     partners.filter(p => p.category === "salon").length,
    produits:  partners.filter(p => p.category === "produits").length,
    formation: partners.filter(p => p.category === "formation").length,
  };

  const filtered = partners.filter(p => {
    const matchCat = activeFilter === "all" || p.category === activeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      (p.name?.toLowerCase() || "").includes(q) ||
      (p.city?.toLowerCase() || "").includes(q) ||
      (p.categoryLabel?.toLowerCase() || "").includes(q);
    return matchCat && matchSearch;
  });

  const handleSearchSubmit = (val) => {
    const q = val.trim();
    if (!q) return;
    const updated = [q, ...searchHistory.filter(h => h !== q)].slice(0, 8);
    setSearchHistory(updated);
    localStorage.setItem("partners_search_history", JSON.stringify(updated));
    setSearch(q);
    setShowHistory(false);
  };

  const removeHistoryItem = (item, e) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem("partners_search_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("partners_search_history");
  };

  const clearSearch = () => {
    setSearch("");
    setShowHistory(false);
    searchRef.current?.focus();
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg, #FDFAF5 0%, #F5EDD8 100%)", display:"flex", justifyContent:"center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { display:none; }
        .partner-search-input::placeholder { color: rgba(140,90,20,0.4); }
        .partner-search-input:focus { outline: none; }
        .filter-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ width:"100%", maxWidth:430, paddingBottom:80 }}>

        {/* Hero Header */}
        <div style={{ padding:"44px 24px 28px", position:"relative", overflow:"hidden" }}>
          {/* Déco fond */}
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,150,58,0.12),transparent 70%)", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.3),transparent)" }}/>

          <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.5em", textTransform:"uppercase", color:"rgba(140,90,20,0.5)", marginBottom:12, fontFamily:"sans-serif" }}>AfroTresse · Partenaires</div>
          <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:34, fontWeight:700, color:"#1A0E04", lineHeight:1.1, marginBottom:10 }}>
            Nos partenaires<br/><span style={{ color:"#C9963A" }}>de confiance</span>
          </div>
          <p style={{ fontSize:13, color:"rgba(30,15,2,0.45)", fontFamily:"sans-serif", lineHeight:1.65 }}>
            Des professionnelles sélectionnées par AfroTresse pour vous accompagner.
          </p>
        </div>

        {/* Barre de recherche */}
        <div style={{ padding:"16px 20px 0", position:"relative" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:"#FFFFFF",
            border:"1.5px solid rgba(201,150,58,0.3)",
            borderRadius:18, padding:"12px 16px",
            boxShadow:"0 4px 24px rgba(201,150,58,0.1)",
          }}>
            <span style={{ color:"rgba(140,90,20,0.5)", fontSize:14, flexShrink:0 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher un salon, une ville..."
              value={search}
              className="partner-search-input"
              style={{ flex:1, background:"transparent", border:"none", fontSize:13, color:"#1A0E04", fontFamily:"sans-serif" }}
              onChange={e => { setSearch(e.target.value); setShowHistory(false); }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(search); }}
            />
            {search ? (
              <button onClick={clearSearch} style={{ flexShrink:0, color:"rgba(140,90,20,0.5)", fontSize:14, cursor:"pointer", background:"none", border:"none", padding:"0 2px" }}>✕</button>
            ) : (
              <span style={{ color:"rgba(140,90,20,0.3)", fontSize:11 }}>↵</span>
            )}
          </div>

          {/* Dropdown historique */}
          {showHistory && searchHistory.length > 0 && !search && (
            <div style={{
              position:"absolute", top:"100%", left:20, right:20, zIndex:50,
              background:"#FFFFFF", border:"1.5px solid rgba(201,150,58,0.2)",
              borderRadius:16, boxShadow:"0 12px 40px rgba(0,0,0,0.1)",
              overflow:"hidden", marginTop:4,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px 6px" }}>
                <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(140,90,20,0.4)", fontFamily:"sans-serif" }}>Recherches récentes</span>
                <button onClick={clearHistory} style={{ fontSize:9, color:"rgba(201,150,58,0.7)", fontWeight:700, cursor:"pointer", background:"none", border:"none", fontFamily:"sans-serif" }}>Tout effacer</button>
              </div>
              {searchHistory.map(item => (
                <div key={item}
                  onMouseDown={() => { setSearch(item); handleSearchSubmit(item); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", cursor:"pointer", borderTop:"1px solid rgba(201,150,58,0.07)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color:"rgba(140,90,20,0.4)", fontSize:11 }}>🕐</span>
                    <span style={{ fontSize:13, color:"#1A0E04", fontFamily:"sans-serif" }}>{item}</span>
                  </div>
                  <button
                    onMouseDown={e => removeHistoryItem(item, e)}
                    style={{ fontSize:11, color:"rgba(140,90,20,0.4)", cursor:"pointer", background:"none", border:"none", padding:"0 4px", fontWeight:700 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtres catégorie */}
        <div style={{ padding:"18px 16px 16px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} className="filter-btn" onClick={() => setActiveFilter(cat.id)} style={{
                  flexShrink:0, display:"flex", alignItems:"center", gap:6,
                  padding:"9px 16px", borderRadius:99, cursor:"pointer",
                  fontFamily:"sans-serif", fontSize:11, fontWeight:800, letterSpacing:"0.04em",
                  transition:"all 0.2s",
                  background: isActive ? "#C9963A" : "#FFFFFF",
                  border: isActive ? "1.5px solid #C9963A" : "1.5px solid rgba(201,150,58,0.25)",
                  color: isActive ? "#FFFFFF" : "rgba(140,90,20,0.7)",
                  boxShadow: isActive ? "0 4px 16px rgba(201,150,58,0.35)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span style={{
                    fontSize:9, fontWeight:900,
                    background: isActive ? "rgba(255,255,255,0.25)" : "rgba(201,150,58,0.12)",
                    color: isActive ? "#FFF" : "#C9963A",
                    borderRadius:99, padding:"1px 6px", marginLeft:2,
                  }}>{counts[cat.id]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:12, fontSize:10, color:"rgba(30,15,2,0.3)", fontFamily:"sans-serif", letterSpacing:"0.1em" }}>
            {loading
              ? "Chargement..."
              : `${filtered.length} partenaire${filtered.length > 1 ? "s" : ""}${activeFilter !== "all" ? ` · ${CATEGORIES.find(c=>c.id===activeFilter)?.label}` : ""}${search ? ` · "${search}"` : ""}`
            }
          </div>
        </div>

        {/* Liste */}
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
          {loading ? (
            <div style={{ textAlign:"center", color:"rgba(201,150,58,0.4)", fontSize:10, fontFamily:"sans-serif", letterSpacing:"0.3em", textTransform:"uppercase", paddingTop:40 }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", paddingTop:40 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
              <div style={{ color:"rgba(30,15,2,0.3)", fontSize:12, fontFamily:"sans-serif" }}>Aucun partenaire trouvé</div>
              {search && (
                <button onClick={clearSearch} style={{ marginTop:12, fontSize:11, color:"#C9963A", fontWeight:700, cursor:"pointer", background:"none", border:"none", fontFamily:"sans-serif" }}>
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            filtered.map(p => <PartnerCard key={p.id} partner={p} onClick={() => { handleSearchSubmit(p.name); setSelected(p); }} />)
          )}
        </div>
      </div>

      {selected && <Modal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
