import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTotalUsed, getSavedStyles, getMyReferralCode } from '../services/credits.js'

export default function Profile() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0) // 0: Styles, 1: Résultats, 2: Cadeaux
  const [totalUsed, setTotalUsed] = useState(0)
  const [saved, setSaved] = useState([])

  useEffect(() => {
    setTotalUsed(getTotalUsed())
    setSaved(getSavedStyles())
  }, [])

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] pb-32">
      {/* Header avec verre dépoli */}
      <div className="pt-16 pb-10 px-6 text-center bg-gradient-to-b from-[#2C1A0E] to-transparent">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full border-2 border-[#C9963A] overflow-hidden shadow-[0_0_25px_rgba(201,150,58,0.2)]">
            <img src={sessionStorage.getItem('afrotresse_photo') || '/avatar.png'} className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#C9963A] text-[#1A0A00] text-[9px] font-black px-3 py-1 rounded-full">PREMIUM</span>
        </div>
        <h1 className="mt-6 text-2xl font-display font-bold">Ma Reine 👑</h1>
      </div>

      {/* Stats minimalistes */}
      <div className="flex justify-center gap-12 mb-10">
        <div className="text-center">
          <p className="text-2xl font-light text-[#E8B96A]">{totalUsed}</p>
          <p className="text-[10px] uppercase tracking-tighter opacity-50">Analyses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-light text-[#E8B96A]">{saved.length}</p>
          <p className="text-[10px] uppercase tracking-tighter opacity-50">Favoris</p>
        </div>
      </div>

      {/* NAVIGATION 3 BOUTONS (Le Switcher) */}
      <div className="mx-6 p-1 bg-white/5 rounded-2xl flex border border-white/5 mb-8">
        {['Mes Styles', 'Résultats', 'Parrainage'].map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all duration-300 ${tab === i ? 'bg-[#C9963A] text-[#1A0A00]' : 'text-white/40'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenu avec transition */}
      <div className="px-6 min-h-[200px]">
        <AnimatePresence mode="wait">
          {tab === 0 && (
            <motion.div key="t1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               {saved.length === 0 ? <p className="text-center py-10 opacity-20 italic">Aucun style enregistré</p> : <p>Liste de tes styles...</p>}
            </motion.div>
          )}

          {tab === 1 && (
            <motion.div key="t2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
               <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                 <p className="text-sm opacity-60 mb-6 italic">"Ta beauté mérite d'être revue."</p>
                 <button onClick={() => navigate('/results')} className="w-full py-4 bg-[#FAF4EC] text-[#1A0A00] rounded-2xl font-bold shadow-xl">
                    Voir mon dernier miroir 🪞
                 </button>
               </div>
            </motion.div>
          )}

          {tab === 2 && (
            <motion.div key="t3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="bg-gradient-to-br from-[#C9963A] to-[#8B5E3C] rounded-3xl p-6 text-[#1A0A00]">
                 <p className="text-[10px] font-black uppercase mb-1">Ton Code Privé</p>
                 <p className="text-3xl font-black mb-4 tracking-tighter">{getMyReferralCode()}</p>
                 <p className="text-xs font-medium leading-tight">Offre 2 crédits à tes amies et reçois-en 2 en retour. Partage la magie ! ✨</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mentions Légales - Retour en bas de page */}
      <footer className="mt-20 pb-10 flex flex-col items-center gap-4 opacity-20">
        <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest">
          <Link to="/privacy-policy">Privacy</Link>
          <Link to="/terms-of-service">Terms</Link>
          <Link to="/cookie-policy">Cookies</Link>
        </div>
        <p className="text-[9px]">© 2026 AfroTresse Studio</p>
      </footer>
    </div>
  )
}
