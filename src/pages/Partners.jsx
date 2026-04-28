import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Seo from "../components/Seo.jsx";

const PARTNERS = [
  {
    id: 1,
    name: "Luxe Coiffure",
    logo: "/partners/luxe-coiffure.png",
    fullImage: "/partners/luxe-full.webp",
    description: "Expert en soins capillaires premium et extensions.",
    longDescription:
      "Luxe Coiffure est notre partenaire privilégié pour tout ce qui concerne la santé du cheveu afro. Ils proposent des soins profonds et des conseils personnalisés pour préparer vos cheveux avant une tresse.",
    specialOffer: "10% de réduction pour les membres AfroTresse",
  },
];

export default function Partners() {
  const [selectedPartner, setSelectedPartner] = useState(null);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#FFF8F0,_#F3E7D9_60%,_#EAD9C7)] text-[#2C1A0E] pb-24">
      <Seo title="Nos Partenaires — AfroTresse" />

      {/* HERO SECTION */}
      <section className="pt-28 pb-20 px-6 text-center relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>

        <span className="text-[#C9963A] uppercase tracking-[0.4em] text-[11px] font-semibold mb-6 block">
          Réseau d'Excellence
        </span>

        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          Ils nous font{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9963A] to-[#E6C07B]">
            confiance
          </span>
        </h1>

        <p className="text-sm md:text-base opacity-60 max-w-xl mx-auto">
          Des partenaires triés sur le volet pour sublimer chaque détail de ton
          expérience AfroTresse.
        </p>
      </section>

      {/* GRID PARTENAIRES */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.id}
              layoutId={`card-${partner.id}`}
              onClick={() => setSelectedPartner(partner)}
              className="cursor-pointer group bg-white/70 backdrop-blur-xl rounded-[2.8rem] p-8 border border-white/40 shadow-[0_10px_40px_rgba(44,26,14,0.08)] hover:shadow-[0_40px_80px_rgba(44,26,14,0.12)] hover:-translate-y-2 transition-all duration-500"
            >
              <div className="h-32 flex items-center justify-center mb-8 grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100 transition-all duration-500">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="max-h-full max-w-[160px] object-contain"
                />
              </div>

              <h3 className="font-bold text-xl mb-2 tracking-tight">
                {partner.name}
              </h3>

              <p className="text-xs opacity-60 leading-relaxed line-clamp-2">
                {partner.description}
              </p>

              <div className="mt-5 text-[#C9963A] text-[11px] font-semibold uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">
                En savoir plus →
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODAL */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPartner(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[1000]"
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                layoutId={`card-${selectedPartner.id}`}
                className="bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.2)] pointer-events-auto relative border border-white/40"
              >
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md"
                >
                  ✕
                </button>

                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 h-64 md:h-auto bg-white flex items-center justify-center p-12">
                    <img
                      src={selectedPartner.logo}
                      alt={selectedPartner.name}
                      className="max-h-full object-contain"
                    />
                  </div>

                  <div className="md:w-1/2 p-8 md:p-12">
                    <span className="text-[#C9963A] text-[10px] font-bold uppercase tracking-widest">
                      Partenaire Officiel
                    </span>

                    <h2 className="text-3xl font-black mt-2 mb-4">
                      {selectedPartner.name}
                    </h2>

                    <p className="text-sm opacity-70 leading-relaxed mb-6">
                      {selectedPartner.longDescription}
                    </p>

                    {selectedPartner.specialOffer && (
                      <div className="bg-gradient-to-r from-[#C9963A]/10 to-[#E6C07B]/10 border border-[#C9963A]/30 p-5 rounded-2xl mb-8">
                        <p className="text-[#C9963A] text-xs font-bold italic">
                          🎁 {selectedPartner.specialOffer}
                        </p>
                      </div>
                    )}

                    <button className="w-full py-4 bg-gradient-to-r from-[#2C1A0E] to-[#5A3A1A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:from-[#C9963A] hover:to-[#E6C07B] transition-all duration-300 shadow-lg">
                      Visiter le site
                    </button>
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
