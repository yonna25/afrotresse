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

// Composants Icones
const IGIcon = () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> );
const TKIcon = () => ( <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> );

function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 380); };
  const wa = () => window.open(`https://wa.me/${((partner.whatsapp || partner.phone) || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`, "_blank");

  return (
    <div onClick={close} style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center", background: vis ? "rgba(18,10,4,0.85)" : "transparent", backdropFilter: vis ? "blur(12px)" : "none", transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:440, maxHeight:"94vh", overflowY:"auto", background: "#FAF4EC", borderRadius:"32px 32px 0 0", transform: vis ? "translateY(0)" : "translateY(100%)", transition: "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)", position:"relative", border: "1px solid rgba(201,150,58,0.15)", boxShadow: "0 -25px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}><div style={{ width:40, height:4, borderRadius:99, background:"rgba(201,150,58,0.2)" }}/></div>
        <button onClick={close} style={{ position:"absolute", top:16, right:16, zIndex:10, width:36, height:36, borderRadius:99, background:"#FFF", border:"1px solid rgba(201,150,58,0.15)", cursor:"pointer", color:"#2C1A0E", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        <div style={{ padding:"16px 24px 60px" }}>
          <div style={{ marginBottom:32, textAlign:"center" }}>
             <div style={{ width:96, height:96, borderRadius:28, margin:"0 auto 18px", background:"#FFF", border:"1px solid rgba(201,150,58,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, boxShadow:"0 12px 32px rgba(201,150,58,0.12)" }}>{partner.emoji}</div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"#C9963A", marginBottom:6 }}>{partner.categoryLabel}</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:32, fontWeight:700, color:"#2C1A0E", lineHeight:1.1 }}>{partner.name}</h2>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(44,26,14,0.5)", marginTop:4 }}>{partner.city}</div>
          </div>
          <p style={{ fontSize:14, color:"rgba(44,26,14,0.7)", lineHeight:1.7, marginBottom:32, textAlign:"center" }}>{partner.description}</p>
          <button onClick={wa} style={{ width:"100%", background:"#C9963A", color:"#FFF", padding:"18px", borderRadius:20, border:"none", fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.15em", cursor:"pointer" }}>Contacter via WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#FFF", border: `1px solid rgba(201,150,58,0.1)`, borderRadius:28, padding:"20px", cursor:"pointer", display:"flex", alignItems:"center", gap:16, boxShadow: "0 4px 20px rgba(44,26,14,0.03)" }}>
      <div style={{ width:64, height:64, borderRadius:18, background:"#FAF4EC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>{partner.emoji}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:"#2C1A0E" }}>{partner.name}</div>
        <div style={{ fontSize:10, color:"#C9963A", fontWeight:800 }}>{partner.city.toUpperCase()}</div>
      </div>
      <div style={{ color:"rgba(201,150,58,0.4)" }}>›</div>
    </div>
  );
}

export default function Partners() {
  const [partners, setPartners]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("partners").select("*").eq("active", true).order("is_featured", { ascending: false });
      if (!error) setPartners(data.map(mapPartner));
      setLoading(false);
    };
    fetchPartners();
  }, []);

  const counts = {
    all: partners.length,
    salon: partners.filter(p => p.category === "salon").length,
    produits: partners.filter(p => p.category === "produits").length,
    formation: partners.filter(p => p.category === "formation").length,
  };

  const filtered = partners.filter(p => {
    const matchCat = activeFilter === "all" || p.category === activeFilter;
    const q = search.trim().toLowerCase();
    return matchCat && (!q || p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
  });

  return (
    <div style={{ minHeight:"100vh", background:"#FAF4EC", display:"flex", justifyContent:"center", color:"#2C1A0E" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color: transparent; }
        .active-filter { background: #C9963A !important; color: #FFF !important; border-color: #C9963A !important; }
      `}</style>

      <div style={{ width:"100%", maxWidth:440, paddingBottom:100 }}>
        
        {/* HEADER DÉMARQUÉ (PREMIUM DARK) */}
        <div style={{ 
          padding:"60px 24px 80px", 
          textAlign:"center", 
          background:"#2C1A0E", 
          borderRadius:"0 0 50px 50px", 
          boxShadow:"0 20px 40px rgba(0,0,0,0.2)",
          position: "relative"
        }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"#C9963A", marginBottom:12 }}>Expertise & Excellence</div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:42, fontWeight:700, lineHeight:1, marginBottom:16, color: "#FAF4EC" }}>
            Nos Partenaires <br/> <span style={{ color:"#C9963A", fontStyle:"italic" }}>de confiance</span>
          </h1>
          <p style={{ fontSize:13, color:"rgba(250,244,236,0.6)", lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>Une sélection rigoureuse pour sublimer votre beauté afro.</p>
        </div>

        {/* BARRE DE RECHERCHE AVEC OPTION (X) */}
        <div style={{ padding:"0 20px", marginTop: "-30px", position:"relative", zIndex:20 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:12, background:"#FFF",
            borderRadius:22, padding:"18px 24px", border:"1px solid rgba(201,150,58,0.2)",
            boxShadow:"0 15px 35px rgba(0,0,0,0.1)"
          }}>
            <span style={{ fontSize:16 }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Chercher un salon, une ville..."
              value={search}
              style={{ flex:1, border:"none", fontSize:14, fontWeight:500, outline:"none" }}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")} 
                style={{ border:"none", background:"#FAF4EC", color:"#C9963A", width:24, height:24, borderRadius:99, fontWeight:800, cursor:"pointer", fontSize:10 }}
              >✕</button>
            )}
          </div>
        </div>

        {/* FILTRES RESPONSIVE (FLEX WRAP) */}
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={activeFilter === cat.id ? "active-filter" : ""}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "99px", border: "1px solid rgba(201,150,58,0.2)", background: "#FFF", fontSize: "12px", fontWeight: "700", transition: "0.2s" }}>
                <span>{cat.emoji}</span> {cat.label}
                <span style={{ opacity: 0.4, fontSize: "10px", marginLeft: "4px" }}>{counts[cat.id]}</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "10px", fontWeight: "800", color: "rgba(44,26,14,0.3)", letterSpacing: "1px", textTransform: "uppercase" }}>
            {loading ? "Chargement..." : `${filtered.length} résultats disponibles`}
          </div>
        </div>

        {/* LISTE DES PARTENAIRES */}
        <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:16 }}>
          {loading ? (
             <div style={{ padding:"60px 0", textAlign:"center", opacity:0.3, fontWeight:800, fontSize:10 }}>ANALYSE EN COURS...</div>
          ) : (
            filtered.map(p => <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)} />)
          )}
        </div>
      </div>
      {selected && <Modal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
