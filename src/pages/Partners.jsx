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
      facebook:  row.facebook_url  || row.facebook || null,
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4.5"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.51"/>
  </svg>
);

const TKIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WAIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
    <circle cx="12" cy="12" r="11.5"/>
  </svg>
);

const FBIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 380); };
  const wa = () => window.open(
    `https://wa.me/${((partner.whatsapp || partner.phone) || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse")}`,
    "_blank"
  );

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      background: vis ? "rgba(15,8,3,0.6)" : "transparent",
      backdropFilter: vis ? "blur(8px)" : "none",
      transition: "all 0.35s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto",
        background: "#FFFBF5",
        borderRadius:"28px 28px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.45s cubic-bezier(0.2,0.9,0.4,1.1)",
        position:"relative",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.08)",
      }}>
        <button onClick={close} style={{
          position:"absolute", top:18, right:18, zIndex:10,
          width:32, height:32, borderRadius:99,
          background:"transparent", border:"none",
          cursor:"pointer", color:"#A07848", fontSize:18,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>✕</button>

        <div style={{ padding:"28px 28px 48px" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{
              width:72, height:72, borderRadius:18, marginBottom:18,
              background:"linear-gradient(135deg,#FFF5E8,#F5E8D5)",
              border:"1px solid rgba(201,150,58,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:32,
            }}>{partner.emoji}</div>
            
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.2em", textTransform:"uppercase", color:"#B88A44", marginBottom:6 }}>
                {partner.categoryLabel}
              </div>
              <h2 style={{ fontSize:26, fontWeight:500, color:"#1A0E04", marginBottom:4, letterSpacing:"-0.01em" }}>
                {partner.name}
              </h2>
              <div style={{ fontSize:12, color:"#8B6B3E" }}>{partner.city}</div>
            </div>

            {(partner.rating || partner.reviews) && (
              <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:14, borderTop:"1px solid rgba(201,150,58,0.1)" }}>
                {partner.rating && (
                  <div style={{ display:"flex", gap:3 }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                        fill={i<=Math.round(partner.rating)?"#C9963A":"none"}
                        stroke="#C9963A" strokeWidth="1.5">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    ))}
                  </div>
                )}
                <span style={{ fontSize:12, color:"#A07848" }}>
                  {partner.rating ? `${partner.rating} ★` : ""}{partner.reviews ? ` · ${partner.reviews} avis` : ""}
                </span>
              </div>
            )}
          </div>

          {hasPromo && (
            <div style={{
              background:"linear-gradient(135deg,#FFF8EE,#FFF3E6)",
              borderRadius:16, border:"1px solid rgba(201,150,58,0.15)",
              padding:"18px 22px", marginBottom:28,
            }}>
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#C9963A", marginBottom:10 }}>
                Offre spéciale
              </div>
              <div style={{ fontSize:14, fontWeight:500, color:"#1A0E04", marginBottom:14 }}>
                {partner.promo}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:"#8B6B3E" }}>
                <span>Plus que</span>
                <div style={{ display:"flex", gap:8, fontFamily:"monospace", fontSize:12, color:"#C9963A" }}>
                  <span>{cd.h}h</span>
                  <span>{cd.m}m</span>
                  <span>{cd.s}s</span>
                </div>
              </div>
            </div>
          )}

          {partner.description && (
            <p style={{ fontSize:13, color:"#5C4B32", lineHeight:1.65, marginBottom:32 }}>
              {partner.description}
            </p>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {(partner.whatsapp || partner.phone) && (
              <button onClick={wa} style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
                borderRadius:14, background:"#F5EDE0", border:"none",
                cursor:"pointer", width:"100%", textAlign:"left",
                transition:"background 0.2s", color:"#2A6B3A",
              }}>
                <span><WAIcon /></span>
                <span style={{ fontSize:12, fontWeight:500 }}>WhatsApp</span>
              </button>
            )}
            {partner.socials?.instagram && (
              <a href={`https://instagram.com/${partner.socials.instagram}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderRadius:14, background:"#F5EDE0", textDecoration:"none", color:"#8B3A5E" }}>
                <span><IGIcon /></span>
                <span style={{ fontSize:12, fontWeight:500 }}>@{partner.socials.instagram}</span>
              </a>
            )}
            {partner.socials?.tiktok && (
              <a href={`https://tiktok.com/@${partner.socials.tiktok}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderRadius:14, background:"#F5EDE0", textDecoration:"none", color:"#1A0E04" }}>
                <span><TKIcon /></span>
                <span style={{ fontSize:12, fontWeight:500 }}>@{partner.socials.tiktok}</span>
              </a>
            )}
            {partner.socials?.facebook && (
              <a href={partner.socials.facebook.startsWith("http") ? partner.socials.facebook : `https://facebook.com/${partner.socials.facebook}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderRadius:14, background:"#F5EDE0", textDecoration:"none", color:"#2D5A8A" }}>
                <span><FBIcon /></span>
                <span style={{ fontSize:12, fontWeight:500 }}>Facebook</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner, onClick }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;

  return (
    <div onClick={onClick} style={{
      background: "#FFFFFF",
      border: partner.is_featured ? "1px solid rgba(201,150,58,0.3)" : "1px solid rgba(0,0,0,0.06)",
      borderRadius: 20,
      padding: "18px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: partner.is_featured ? "0 2px 12px rgba(201,150,58,0.08)" : "none",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: "#FAF5EC",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>{partner.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ marginBottom:6 }}>
            <h3 style={{ fontSize:16, fontWeight:500, color:"#1A0E04", margin:0 }}>
              {partner.name}
              {partner.is_featured && <span style={{ marginLeft:6, fontSize:9, color:"#C9963A" }}>✦</span>}
            </h3>
            <div style={{ fontSize:11, color:"#8B6B3E", marginTop:2 }}>{partner.city}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            {partner.categoryLabel && (
              <span style={{ fontSize:9, color:"#A07848", background:"#FAF5EC", borderRadius:20, padding:"3px 8px" }}>
                {partner.categoryLabel}
              </span>
            )}
            {partner.rating && (
              <span style={{ fontSize:10, color:"#C9963A", display:"flex", alignItems:"center", gap:3 }}>
                ★ {partner.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      {hasPromo && (
        <div style={{ marginTop:14, padding:"8px 12px", borderRadius:12, background:"#FAF5EC", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"#C9963A", fontWeight:500 }}>{partner.promo}</span>
          <span style={{ fontSize:10, color:"#A07848", fontFamily:"monospace" }}>{cd.h}h{cd.m}m</span>
        </div>
      )}
    </div>
  );
}

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
    <div style={{ minHeight:"100vh", background:"#FDF9F2" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { display:none; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      `}</style>

      <div style={{ width:"100%", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>

        {/* Header */}
        <div style={{ padding:"44px 24px 36px", background:"#FDF9F2", borderBottom:"1px solid rgba(201,150,58,0.1)" }}>
          <div style={{ marginBottom:10 }}>
            <span style={{ fontSize:9, fontWeight:500, letterSpacing:"0.3em", textTransform:"uppercase", color:"#C9963A" }}>AfroTresse</span>
          </div>
          <h1 style={{ fontSize:34, fontWeight:400, color:"#1A0E04", marginBottom:12, letterSpacing:"-0.02em" }}>
            Nos partenaires
          </h1>
          <p style={{ fontSize:13, color:"#8B6B3E", lineHeight:1.5, maxWidth:320 }}>
            Des professionnelles sélectionnées avec soin.
          </p>
        </div>

        {/* Search */}
        <div style={{ padding:"20px 20px 0", position:"relative" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:"#FFFFFF", borderRadius:14,
            padding:"10px 16px",
            boxShadow:"0 1px 2px rgba(0,0,0,0.03), inset 0 0 0 1px rgba(201,150,58,0.1)",
          }}>
            <span style={{ color:"#C9963A", fontSize:14 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher..."
              value={search}
              style={{ flex:1, background:"transparent", border:"none", fontSize:13, color:"#1A0E04" }}
              onChange={e => { setSearch(e.target.value); setShowHistory(false); }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(search); }}
            />
            {search && (
              <button onClick={clearSearch} style={{ color:"#C9963A", fontSize:13, cursor:"pointer", background:"none", border:"none" }}>✕</button>
            )}
          </div>

          {/* Search history dropdown */}
          {showHistory && searchHistory.length > 0 && !search && (
            <div style={{
              position:"absolute", top:"100%", left:20, right:20, zIndex:50,
              background:"#FFFFFF", borderRadius:14,
              boxShadow:"0 4px 20px rgba(0,0,0,0.06)", marginTop:8,
              border:"1px solid rgba(201,150,58,0.1)",
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px 6px" }}>
                <span style={{ fontSize:9, fontWeight:500, textTransform:"uppercase", color:"#C9963A" }}>Récentes</span>
                <button onClick={clearHistory} style={{ fontSize:9, color:"#A07848", cursor:"pointer", background:"none", border:"none" }}>Effacer</button>
              </div>
              {searchHistory.map(item => (
                <div key={item}
                  onMouseDown={() => { setSearch(item); handleSearchSubmit(item); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", cursor:"pointer", borderTop:"1px solid rgba(201,150,58,0.06)" }}>
                  <span style={{ fontSize:12, color:"#5C4B32" }}>{item}</span>
                  <button onMouseDown={e => removeHistoryItem(item, e)} style={{ fontSize:11, color:"#C9963A", opacity:0.5, cursor:"pointer", background:"none", border:"none" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ padding:"20px 20px 16px", overflowX:"auto" }}>
          <div style={{ display:"flex", gap:8 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} style={{
                  padding:"7px 14px", borderRadius:30, cursor:"pointer",
                  fontSize:11, fontWeight:500, transition:"all 0.2s",
                  background: isActive ? "#C9963A" : "transparent",
                  border: isActive ? "1px solid #C9963A" : "1px solid rgba(201,150,58,0.2)",
                  color: isActive ? "#FFFFFF" : "#8B6B3E",
                  whiteSpace:"nowrap",
                }}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div style={{ padding:"0 20px 12px" }}>
          <span style={{ fontSize:10, color:"#A07848" }}>
            {loading ? "Chargement..." : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Partners list */}
        <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:12 }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"#C9963A", fontSize:12 }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
              <div style={{ color:"#A07848", fontSize:12 }}>Aucun résultat trouvé</div>
              {search && (
                <button onClick={clearSearch} style={{ marginTop:12, fontSize:11, color:"#C9963A", cursor:"pointer", background:"none", border:"none" }}>Effacer la recherche</button>
              )}
            </div>
          ) : (
            filtered.map(p => <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)} />)
          )}
        </div>
      </div>

      {selected && <Modal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
