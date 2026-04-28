import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase"; // Vérifie que le chemin vers ton client Supabase est correct
import Seo from "../components/Seo.jsx";

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  // RÉCUPÉRATION AUTOMATIQUE DES DONNÉES SUPABASE
  useEffect(() => {
    async function fetchPartners() {
      try {
        const { data, error } = await supabase
          .from('partners') // Nom de ta table dans Supabase
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setPartners(data || []);
      } catch (error) {
        console.error("Erreur Supabase:", error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF4EC] to-white text-[#2C1A0E] pb-20">
      <Seo title="Nos Partenaires — AfroTresse" />

      {/* HERO SECTION */}
      <section className="pt-24 pb-16 px-6 text-center">
        <span className="text-[#C9963A] uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block">
          Réseau d'Excellence
        </span>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          Ils nous font <span className="text-[#C9963A]">confiance</span>
        </h1>
      </section>

      {/* GRID PARTENAIRES DYNAMIQUE */}
      <section className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="text-center opacity-50 py-20">Chargement des partenaires...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {partners.map((partner) => (
              <motion.div
                key={partner.id}
                layoutId={`card-${partner.id}`}
                onClick={() => setSelectedPartner(partner)}
                className="cursor-pointer group bg-white rounded-[2.5rem] p-8 border border-[#C9963A]/10 shadow-[0_20px_40px_rgba(44,26,14,0.04)] hover:shadow-[0_30px_60px_rgba(44,26,14,0.08)] transition-all duration-500"
              >
                <div className="h-32 flex items-center justify-center mb-8 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                  <img 
                    src={partner.logo_url || partner.logo} 
                    alt={partner.name} 
                    className="max-h-full max-w-[160px] object-contain" 
                  />
                </div>
                <h3 className="font-bold text-xl mb-2">{partner.name}</h3>
                <p className="text-xs opacity-50 leading-relaxed line-clamp-2">{partner.description}</p>
                <div className="mt-4 text-[#C9963A] text-[10px] font-bold uppercase tracking-widest italic">
                  En savoir plus →
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL RÉTABLIE */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPartner(null)}
              className="fixed inset-0 bg-[#2C1A0E]/80 backdrop-blur-md z-[1000]"
            />
            
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                layoutId={`card-${selectedPartner.id}`}
                className="bg-[#FAF4EC] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl pointer-events-auto relative"
              >
                <button 
                  onClick={() => setSelectedPartner(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors z-20"
                >✕</button>

                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 h-64 md:h-auto bg-white flex items-center justify-center p-12">
                    <img src={selectedPartner.logo_url || selectedPartner.logo} alt={selectedPartner.name} className="max-h-full object-contain" />
                  </div>
                  
                  <div className="md:w-1/2 p-8 md:p-12">
                    <span className="text-[#C9963A] text-[10px] font-bold uppercase tracking-widest">Partenaire Officiel</span>
                    <h2 className="text-3xl font-black mt-2 mb-4">{selectedPartner.name}</h2>
                    <p className="text-sm opacity-70 leading-relaxed mb-6">{selectedPartner.long_description || selectedPartner.description}</p>
                    
                    {selectedPartner.special_offer && (
                      <div className="bg-[#C9963A]/10 border border-[#C9963A]/20 p-4 rounded-2xl mb-8">
                        <p className="text-[#C9963A] text-xs font-bold italic">🎁 {selectedPartner.special_offer}</p>
                      </div>
                    )}

                    <a 
                      href={selectedPartner.website_url || "#"} 
                      target="_blank"
                      className="inline-block w-full text-center py-4 bg-[#2C1A0E] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C9963A] transition-colors"
                    >
                      Visiter le site
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
