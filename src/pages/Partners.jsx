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
const FBIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
      background: vis ? "rgba(18,10,4,0.85)" : "transparent",
      backdropFilter: vis ? "blur(12px)" : "none",
      transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:440, maxHeight:"94vh", overflowY:"auto",
        background: "#FAF4EC",
        borderRadius:"32px 32px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
        position:"relative", overflow:"hidden",
        border: "1px solid rgba(201,150,58,0.15)",
        boxShadow: "0 -25px 60px rgba(0,0,0,0.25)",
      }}>
        {/* Barre décorative tactile */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:40, height:4, borderRadius:99, background:"rgba(201,150,58,0.2)" }}/>
        </div>

        <button onClick={close} style={{
          position:"absolute", top:16, right:16, zIndex:10,
          width:36, height:36, borderRadius:99,
          background:"#FFF", border:"1px solid rgba(201,150,58,0.15)",
          cursor:"pointer", color:"#2C1A0E", fontSize:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}>✕</button>

        <div style={{ padding:"16px 24px 60px" }}>
          {/* Header Modal */}
          <div style={{ marginBottom:32, textAlign:"center" }}>
             <div style={{
                width:96, height:96, borderRadius:28, margin:"0 auto 18px",
                background:"#FFF",
                border:"1px solid rgba(201,150,58,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:44,
                boxShadow:"0 12px 32px rgba(201,150,58,0.12)",
              }}>{partner.emoji}</div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"#C9963A", marginBottom:6 }}>{partner.categoryLabel}</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, color:"#2C1A0E", lineHeight:1.1 }}>{partner.name}</h2>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(44,26,14,0.5)", marginTop:4 }}>{partner.city}</div>
          </div>

          {/* Note */}
          {(partner.rating || partner.reviews) && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:24 }}>
                <div style={{ display:"flex", gap:2 }}>
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.1)"} stroke={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.3)"} strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  ))}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:"#2C1A0E" }}>{partner.rating || "5.0"}</span>
                {partner.reviews && <span style={{ fontSize:13, color:"rgba(44,26,14,0.4)" }}>({partner.reviews} avis)</span>}
            </div>
          )}

          {/* Offre Flash */}
          {hasPromo && (
            <div style={{
              background:"#2C1A0E", borderRadius:24, padding:"24px", marginBottom:32, position:"relative", overflow:"hidden", color:"#FAF4EC"
            }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(201,150,58,0.15)", blur:"40px" }}/>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"#C9963A", marginBottom:10 }}>Offre Privilège</div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>{partner.promo}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", padding:"8px 12px", borderRadius:12, width:"fit-content" }}>
                <span style={{ fontSize:9, fontWeight:700, opacity:0.6 }}>EXPIRE DANS</span>
                {[cd.h, cd.m, cd.s].map((v, i) => (
                  <span key={i} style={{ fontFamily:"monospace", fontSize:14, fontWeight:700, color:"#C9963A" }}>{v}{i<2?":":""}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <p style={{ fontSize:14, color:"rgba(44,26,14,0.7)", lineHeight:1.7, marginBottom:32, textAlign:"center", padding:"0 10px" }}>{partner.description}</p>

          {/* CTAs */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <button onClick={wa} style={{
              background:"#C9963A", color:"#FFF", padding:"18px", borderRadius:20, border:"none",
              fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", cursor:"pointer",
              boxShadow: "0 8px 24px rgba(201,150,58,0.25)"
            }}>Contacter via WhatsApp</button>
            
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:4 }}>
              {partner.socials?.instagram && (
                <a href={`https://instagram.com/${partner.socials.instagram}`} target="_blank" rel="noreferrer" style={{ 
                  textDecoration:"none", background:"#FFF", padding:"14px", borderRadius:16, border:"1px solid rgba(201,150,58,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#2C1A0E", fontSize:11, fontWeight:700
                }}>
                  <IGIcon /> Instagram
                </a>
              )}
              {partner.socials?.tiktok && (
                <a href={`https://tiktok.com/@${partner.socials.tiktok}`} target="_blank" rel="noreferrer" style={{ 
                  textDecoration:"none", background:"#FFF", padding:"14px", borderRadius:16, border:"1px solid rgba(201,150,58,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#2C1A0E", fontSize:11, fontWeight:700
                }}>
                  <TKIcon /> TikTok
                </a>
              )}
            </div>
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
      background: "#FFF",
      border: `1px solid ${partner.is_featured ? "rgba(201,150,58,0.4)" : "rgba(201,150,58,0.1)"}`,
      borderRadius:28, padding:"20px", cursor:"pointer",
      position:"relative", overflow:"hidden",
      transition:"all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 4px 20px rgba(44,26,14,0.03)",
    }}>
      {partner.is_featured && (
        <div style={{ position:"absolute", top:0, left:0, background:"#C9963A", color:"#FFF", padding:"4px 12px", borderRadius:"0 0 12px 0", fontSize:8, fontWeight:900, letterSpacing:1 }}>ÉLITE</div>
      )}
      
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{
          width:64, height:64, borderRadius:18, flexShrink:0,
          background:"#FAF4EC", border:"1px solid rgba(201,150,58,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:28,
        }}>{partner.emoji}</div>
        
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:"#2C1A0E", marginBottom:2 }}>{partner.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:9, fontWeight:800, color:"#C9963A", letterSpacing:1 }}>{partner.city.toUpperCase()}</span>
            <span style={{ width:3, height:3, borderRadius:"50%", background:"rgba(0,0,0,0.1)" }}/>
            <span style={{ fontSize:10, color:"rgba(44,26,14,0.4)" }}>{partner.categoryLabel}</span>
          </div>
        </div>
        
        <div style={{ color:"rgba(201,150,58,0.4)", fontSize:18 }}>›</div>
      </div>

      {hasPromo && (
        <div style={{ 
          marginTop:16, padding:"12px 16px", borderRadius:16, 
          background:"linear-gradient(90deg, #2C1A0E 0%, #3D2414 100%)", 
          display:"flex", alignItems:"center", justifyContent:"space-between" 
        }}>
          <span style={{ fontSize:11, color:"#C9963A", fontWeight:800 }}>🎁 {partner.promo}</span>
          <span style={{ fontSize:9, color:"rgba(250,244,236,0.5)", fontWeight:700 }}>{cd.h}h {cd.m}m</span>
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
    <div style={{ minHeight:"100vh", background:"#FAF4EC", display:"flex", justifyContent:"center", color:"#2C1A0E" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display:none; }
        input:focus { outline: none; }
        .active-filter { background: #2C1A0E !important; color: #FAF4EC !important; border-color: #2C1A0E !important; box-shadow: 0 8px 20px rgba(44,26,14,0.15) !important; }
      `}</style>

      <div style={{ width:"100%", maxWidth:440, paddingBottom:100 }}>
        
        {/* Header Premium */}
        <div style={{ padding:"60px 24px 40px", textAlign:"center", background:"#FFF", borderRadius:"0 0 40px 40px", boxShadow:"0 10px 40px rgba(44,26,14,0.04)" }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"#C9963A", marginBottom:12 }}>Expertise & Excellence</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:42, fontWeight:700, lineHeight:1, marginBottom:16 }}>
            Nos Partenaires <br/> <span style={{ color:"#C9963A", fontStyle:"italic" }}>de confiance</span>
          </h1>
          <p style={{ fontSize:14, color:"rgba(44,26,14,0.5)", lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>Une sélection rigoureuse pour sublimer votre beauté afro.</p>
        </div>

        {/* Search Block */}
        <div style={{ padding:"24px 20px 0", position:"relative", zIndex:10 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:12, background:"#FFF",
            borderRadius:22, padding:"16px 20px", border:"1px solid rgba(201,150,58,0.15)",
            boxShadow:"0 15px 35px rgba(201,150,58,0.08)"
          }}>
            <span style={{ fontSize:16 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Chercher un salon, une ville..."
              value={search}
              style={{ flex:1, border:"none", fontSize:14, color:"#2C1A0E", fontWeight:500, background:"transparent" }}
              onChange={e => { setSearch(e.target.value); setShowHistory(false); }}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={e => { if (e.key === "Enter") handleSearchSubmit(search); }}
            />
            {search && <button onClick={clearSearch} style={{ border:"none", background:"none", fontSize:14, color:"#C9963A", fontWeight:700 }}>✕</button>}
          </div>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && !search && (
            <div style={{
              position:"absolute", top:"100%", left:20, right:20, background:"#FFF", borderRadius:20,
              boxShadow:"0 20px 50px rgba(0,0,0,0.12)", border:"1px solid rgba(201,150,58,0.1)",
              marginTop:8, overflow:"hidden", zIndex:50
            }}>
              <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", background:"#FAF4EC" }}>
                <span style={{ fontSize:9, fontWeight:800, color:"rgba(44,26,14,0.4)", letterSpacing:1 }}>RÉCENT</span>
                <button onClick={clearHistory} style={{ border:"none", background:"none", fontSize:9, fontWeight:800, color:"#C9963A" }}>EFFACER</button>
              </div>
              {searchHistory.map(item => (
                <div key={item} onMouseDown={() => { setSearch(item); handleSearchSubmit(item); }}
                  style={{ padding:"14px 16px", fontSize:14, borderTop:"1px solid #FAF4EC", display:"flex", justifyContent:"space-between", cursor:"pointer" }}>
                  <span>{item}</span>
                  <button onMouseDown={e => removeHistoryItem(item, e)} style={{ border:"none", background:"none", opacity:0.3 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters Slider */}
        <div style={{ padding:"24px 0 16px" }}>
          <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"0 20px 10px", scrollbarWidth:"none" }}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={isActive ? "active-filter" : ""}
                  style={{
                    flexShrink:0, display:"flex", alignItems:"center", gap:8, padding:"12px 18px",
                    borderRadius:99, border:"1px solid rgba(201,150,58,0.2)", background:"#FFF",
                    fontSize:12, fontWeight:700, color:"#2C1A0E", transition:"0.2s"
                  }}>
                  <span>{cat.emoji}</span> {cat.label}
                  <span style={{ opacity:0.4, fontSize:10 }}>{counts[cat.id]}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding:"0 24px", fontSize:10, fontWeight:700, color:"rgba(44,26,14,0.3)", letterSpacing:0.5 }}>
            {loading ? "ANALYSE DE LA BASE..." : `${filtered.length} RÉSULTATS DISPONIBLES`}
          </div>
        </div>

        {/* Partners List */}
        <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:16 }}>
          {loading ? (
             <div style={{ padding:"60px 0", textAlign:"center", opacity:0.3, fontWeight:800, fontSize:10, letterSpacing:2 }}>CHARGEMENT...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:40, marginBottom:16 }}>✨</div>
              <p style={{ color:"rgba(44,26,14,0.4)", fontSize:14 }}>Aucun résultat pour cette recherche.</p>
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
