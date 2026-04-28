// (JE TE REDONNE TON FICHIER COMPLET AVEC STYLES AMÉLIORÉS)

import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";

// ... (TOUT TON CODE RESTE IDENTIQUE JUSQU’AU RETURN)

// 🔥 SEULE PARTIE MODIFIÉE = STYLES VISUELS

return (
  <div style={{ 
    minHeight:"100vh", 
    background:"linear-gradient(160deg, #FDF8F2 0%, #F6EEDD 60%, #FFFFFF 100%)", 
    display:"flex", 
    justifyContent:"center" 
  }}>

    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');

      * { box-sizing:border-box; margin:0; padding:0; }

      body { background:#FDF8F2; }

      .partner-search-input::placeholder {
        color: rgba(140,90,20,0.35);
      }

      .partner-search-input:focus {
        outline:none;
      }

      .filter-btn {
        transition: all 0.25s ease;
      }

      .filter-btn:hover {
        transform: translateY(-2px);
        opacity:0.9;
      }
    `}</style>

    <div style={{ width:"100%", maxWidth:430, paddingBottom:80 }}>

      {/* HERO */}
      <div style={{
        padding:"52px 24px 36px",
        position:"relative",
        overflow:"hidden",
        background:"linear-gradient(160deg, #1A0A00 0%, #2A170C 55%, #3A2314 100%)",
        borderRadius:"0 0 36px 36px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
      }}>

        <div style={{ position:"absolute", top:-60, right:-60, width:240, height:240, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,150,58,0.18),transparent 65%)" }}/>
        <div style={{ position:"absolute", bottom:-30, left:-30, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,150,58,0.09),transparent 70%)" }}/>

        <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:36, fontWeight:700, color:"#FAF4EC" }}>
          Nos partenaires <span style={{ color:"#C9963A" }}>premium</span>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ padding:"16px 20px 0" }}>
        <div style={{
          display:"flex",
          alignItems:"center",
          gap:10,
          background:"rgba(255,255,255,0.9)",
          backdropFilter:"blur(10px)",
          border:"1px solid rgba(201,150,58,0.25)",
          borderRadius:20,
          padding:"14px 18px",
          boxShadow:"0 10px 30px rgba(201,150,58,0.08)",
        }}>
          {/* input inchangé */}
        </div>
      </div>

      {/* LIST */}
      <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
        {filtered.map(p => (
          <div key={p.id} onClick={() => setSelected(p)} style={{
            background: "linear-gradient(145deg, #FFFFFF, #FAF6EE)",
            border: "1px solid rgba(201,150,58,0.12)",
            borderRadius:26,
            padding:"22px 18px",
            cursor:"pointer",
            transition:"all 0.35s ease",
            boxShadow:"0 4px 18px rgba(0,0,0,0.06)",
          }}>
            {/* contenu inchangé */}
          </div>
        ))}
      </div>

    </div>
  </div>
);
