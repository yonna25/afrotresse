import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPartners } from "../services/useSupabasePartners.js";

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartners().then(data => {
      setPartners(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] px-6 pt-12 pb-32">
      <header className="mb-12">
        <h1 className="text-[28px] font-light tracking-tight text-[#FAF4EC]">Nos <span className="text-[#C9963A] font-serif italic">Partenaires</span></h1>
        <p className="text-white/30 text-xs mt-2 font-light tracking-wide">L'excellence au service de vos tresses.</p>
      </header>

      <div className="space-y-10">
        {loading ? <p className="text-white/20 text-xs">Chargement...</p> : 
          partners.map((p) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="group relative"
            >
              <div className="flex items-start gap-6">
                {/* Logo minimaliste sans cadre massif */}
                <div className="text-4xl grayscale group-hover:grayscale-0 transition-all duration-500">
                  {p.emoji || "👑"}
                </div>

                <div className="flex-1 border-b border-white/5 pb-6">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-lg font-medium text-white/90">{p.name}</h2>
                    <span className="text-[10px] text-[#C9963A] font-bold tracking-tighter">★ {p.rating}</span>
                  </div>
                  
                  <p className="text-white/40 text-[11px] mt-1 font-light leading-relaxed">
                    {p.city} • {p.specialty}
                  </p>

                  {p.promo && (
                    <div className="mt-3 inline-flex items-center gap-2 text-[10px] text-[#C9963A] font-semibold tracking-wide uppercase">
                      <span className="w-1 h-1 rounded-full bg-[#C9963A]" />
                      {p.promo}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Indicateur de boost ultra-fin */}
              {p.sponsored && (
                <div className="absolute -left-2 top-0 bottom-6 w-[1px] bg-gradient-to-b from-[#C9963A] to-transparent" />
              )}
            </motion.div>
          ))
        }
      </div>
    </div>
  );
}
