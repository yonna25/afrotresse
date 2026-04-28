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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
    <circle cx="12" cy="12" r="4.5"/>
  </svg>
);

const TKIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WAIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
    <circle cx="12" cy="12" r="11.5"/>
  </svg>
);

const FBIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 380); };
  const wa = () => window.open(
    `https://wa.me/${((partner.whatsapp || partner.phone) || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`,
    "_blank"
  );

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      background: vis ? "rgba(0,0,0,0.5)" : "transparent",
      backdropFilter: vis ? "blur(4px)" : "none",
      transition: "all 0.4s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto",
        background: "#FFFFFF",
        borderRadius:"24px 24px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
        position:"relative",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.08)",
      }}>
        <button onClick={close} style={{
          position:"absolute", top:20, right:20, zIndex:10,
          width:36, height:36, borderRadius:99,
          background:"#F5F5F5", border:"none",
          cursor:"pointer", color:"#666", fontSize:14, fontWeight:400,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all 0.2s",
        }}>✕</button>

        <div style={{ padding:"32px 28px 48px" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{
              width:80, height:80, borderRadius:20, marginBottom:20,
              background:"#F8F8F8",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:36,
            }}>{partner.emoji}</div>
            
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:500, letterSpacing:"0.2em", textTransform:"uppercase", color:"#999", marginBottom:8 }}>
                {partner.categoryLabel}
              </div>
              <h2 style={{ fontSize:28, fontWeight:400, color:"#111", marginBottom:6, letterSpacing:"-0.02em" }}>
                {partner.name}
              </h2>
              <div style={{ fontSize:13, color:"#888" }}>{partner.city}</div>
            </div>

            {(partner.rating || partner.reviews) && (
              <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:16, borderTop:"1px solid #EAEAEA" }}>
                {partner.rating && (
                  <div style={{ display:"flex", gap:4 }}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24"
                        fill={i<=Math.round(partner.rating)?"#111":"none"}
                        stroke="#111" strokeWidth="1">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    ))}
                  </div>
                )}
                <span style={{ fontSize:12, color:"#999" }}>
                  {partner.rating ? `${partner.rating}` : ""}{partner.reviews ? ` · ${partner.reviews} avis` : ""}
                </span>
              </div>
            )}
          </div>

          {hasPromo && (
            <div style={{
              background:"#F8F8F8", borderRadius:12,
              padding:"20px 24px", marginBottom:32,
            }}>
              <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase", color:"#999", marginBottom:10 }}>
                Offre spéciale
              </div>
              <div style={{ fontSize:15, fontWeight:500, color:"#111", marginBottom:16 }}>
                {partner.promo}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:"#666" }}>
                <span>Valable encore</span>
                <div style={{ display:"flex", gap:6, fontFamily:"monospace", fontSize:13 }}>
                  <span>{cd.h}h</span>
                  <span>{cd.m}m</span>
                  <span>{cd.s}s</span>
                </div>
              </div>
            </div>
          )}

          {partner.description && (
            <p style={{ fontSize:14, color:"#666", lineHeight:1.6, marginBottom:32 }}>
              {partner.description}
            </p>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {(partner.whatsapp || partner.phone) && (
              <button onClick={wa} style={{
                display:"flex", alignItems:"center", gap:14, padding:"14px 20px",
                borderRadius:12, background:"#F8F8F8", border:"none",
                cursor:"pointer", width:"100%", textAlign:"left",
                transition:"background 0.2s",
              }}>
                <span style={{ color:"#25D366" }}><WAIcon /></span>
                <span style={{ fontSize:13, color:"#111" }}>WhatsApp</span>
              </button>
            )}
            {partner.socials?.instagram && (
              <a href={`https://instagram.com/${partner.socials.instagram}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderRadius:12, background:"#F8F8F8", textDecoration:"none", color:"#111" }}>
                <span><IGIcon /></span>
                <span style={{ fontSize:13 }}>@{partner.socials.instagram}</span>
              </a>
            )}
            {partner.socials?.tiktok && (
              <a href={`https://tiktok.com/@${partner.socials.tiktok}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderRadius:12, background:"#F8F8F8", textDecoration:"none", color:"#111" }}>
                <span><TKIcon /></span>
                <span style={{ fontSize:13 }}>@{partner.socials.tiktok}</span>
              </a>
            )}
            {partner.socials?.facebook && (
              <a href={partner.socials.facebook.startsWith("http") ? partner.socials.facebook : `https://facebook.com/${partner.socials.facebook}`} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderRadius:12, background:"#F8F8F8", textDecoration:"none", color:"#111" }}>
                <span><FBIcon /></span>
                <span style={{ fontSize:13 }}>Facebook</span>
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
      border: "1px solid #EAEAEA",
      borderRadius: 16,
      padding: "20px",
      cursor: "pointer",
      transition: "all 0.25s ease",
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: "#F8F8F8",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>{partner.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <h3 style={{ fontSize:17, fontWeight:500, color:"#111", margin:0 }}>
              {partner.name}
            </h3>
            {partner.is_featured && <span style={{ fontSize:10, color:"#999" }}>●</span>}
          </div>
          <div style={{ fontSize:11, color:"#999", marginBottom:10 }}>{partner.city}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            {partner.categoryLabel && (
              <span style={{ fontSize:10, color:"#666", background:"#F8F8F8", borderRadius:20, padding:"4px 10px" }}>
                {partner.categoryLabel}
              </span>
            )}
            {partner.rating && (
              <span style={{ fontSize:11, color:"#111", display:"flex", alignItems:"center", gap:4 }}>
                ★ {partner.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      {hasPromo && (
        <div style={{ marginTop:16, padding:"10px 14px", borderRadius:10, background:"#F8F8F8", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:12, color:"#111" }}>{partner.promo}</span>
          <span style={{ fontSize:11, color:"#999", fontFamily:"monospace" }}>{cd.h}h{cd.m}m</span>
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
    <div style={{ minHeight:"100vh", background:"#FAFAFA" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { display:none; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      `}</style>

      <div style={{ width:"100%", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>

        <div style={{ padding:"48px 24px 40px", background:"#FFFFFF", borderBottom:"1px solid #EAEAEA" }}>
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:10, fontWeight:500, letterSpacing:"0.2em", textTransform:"uppercase", color:"#999" }}>Partenaires</span>
          </div>
          <h1 style={{ fontSize:32, fontWeight:400, color:"#111", marginBottom:12, letterSpacing:"-0.02em" }}>
            Nos partenaires<br/><span style={{ fontStyle:"italic" }}>de confiance</span>
          </h1>
          <p style={{ fontSize:14, color:"#666", lineHeight:1.5 }}>
            Des professionnelles sélectionnées pour vous accompagner.
          </p>
        </div>

        <div style={{ padding:"20px 20px 0", position:"relative" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:"#FFFFFF", border:"1px solid #EAEAEA", borderRadius:12,
            padding:"10px 16px",
          }}>
            <span style={{ color:"#999", fontSize:14 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher..."
              value={search}
              style={{ flex:1, background:"transparent", border:"none", fontSize:13, color:"#111" }}
              onChange={e => { setSearch(e.target.value); setShowHistory(false); }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(search); }}
            />
            {search && (
              <button onClick={clearSearch} style={{ color:"#999", fontSize:14, cursor:"pointer", background:"none", border:"none" }}>✕</button>
            )}
          </div>

          {showHistory && searchHistory.length > 0 && !search && (
            <div style={{
              position:"absolute", top:"100%", left:20, right:20, zIndex:50,
              background:"#FFFFFF", border:"1px solid #EAEAEA", borderRadius:12,
              boxShadow:"0 8px 24px rgba(0,0,0,0.08)", marginTop:8,
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 8px" }}>
                <span style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", color:"#999" }}>Récentes</span>
                <button onClick={clearHistory} style={{ fontSize:10, color:"#999", cursor:"pointer", background:"none", border:"none" }}>Effacer</button>
              </div>
              {searchHistory.map(item => (
                <div key={item}
                  onMouseDown={() => { setSearch(item); handleSearchSubmit(item); }}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", cursor:"pointer", borderTop:"1px solid #F0F0F0" }}>
                  <span style={{ fontSize:13, color:"#111" }}>{item}</span>
                  <button onMouseDown={e => removeHistoryItem(item, e)} style={{ fontSize:12, color:"#CCC", cursor:"pointer", background:"none", border:"none" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"20px 20px 16px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} style={{
                  padding:"8px 16px", borderRadius:30, cursor:"pointer",
                  fontSize:12, fontWeight:500, transition:"all 0.2s",
                  background: isActive ? "#111" : "#FFFFFF",
                  border: isActive ? "1px solid #111" : "1px solid #EAEAEA",
                  color: isActive ? "#FFFFFF" : "#666",
                  whiteSpace:"nowrap",
                }}>
                  {cat.emoji} {cat.label} ({counts[cat.id]})
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:16 }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:40, color:"#999", fontSize:12 }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
              <div style={{ color:"#999", fontSize:13 }}>Aucun résultat</div>
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
