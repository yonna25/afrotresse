import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSavedStyles, getTotalUsed } from '../services/credits.js'
import { useProfile } from '../hooks/useProfile.js'

export default function Profile() {
  const navigate = useNavigate()
  const { displayName, avatar } = useProfile()
  
  // États pour les compteurs
  const [nbSaved, setNbSaved] = useState(0)
  const [nbAnalyses, setNbAnalyses] = useState(0)

  // RECUPÉRATION DE LA PHOTO (Vérification double source)
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie')

  useEffect(() => {
    // 1. Mise à jour Styles Sauvés
    const saved = getSavedStyles()
    setNbSaved(Array.isArray(saved) ? saved.length : 0)

    // 2. Mise à jour Analyses (basé sur ton service credits)
    const used = getTotalUsed()
    setNbAnalyses(used || 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-5">
      
      {/* SECTION PHOTO & NOM */}
      <div className="flex items-center gap-4 mb-8 pt-10">
        <div className="relative">
          {selfieUrl ? (
            <img 
              src={selfieUrl} 
              alt="Mon Selfie" 
              className="w-20 h-20 rounded-full object-cover border-2 border-[#C9963A] shadow-[0_0_15px_rgba(201,150,58,0.4)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#3D2616] flex items-center justify-center text-4 border-2 border-[#C9963A]">
              {avatar || '👸🏾'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-[#C9963A] p-1 rounded-full text-[10px]">✏️</div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-[#FAF4EC]">{displayName || 'Reine'} 💎</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#C9963A]">Membre AfroTresse ✦</p>
        </div>
      </div>

      {/* COMPTEURS (Grille de 3) */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-[#3D2616] p-4 rounded-2xl border border-[#C9963A]/20 text-center">
          <p className="text-xl mb-1">💾</p>
          <p className="text-xl font-black text-[#E8B96A]">{nbSaved}</p>
          <p className="text-[9px] uppercase opacity-60">Styles</p>
        </div>
        
        <div className="bg-[#3D2616] p-4 rounded-2xl border border-[#C9963A]/20 text-center">
          <p className="text-xl mb-1">🔍</p>
          <p className="text-xl font-black text-[#E8B96A]">{nbAnalyses}</p>
          <p className="text-[9px] uppercase opacity-60">Analyses</p>
        </div>

        <div className="bg-[#3D2616] p-4 rounded-2xl border border-[#C9963A]/20 text-center">
          <p className="text-xl mb-1">👯‍♀️</p>
          <p className="text-xl font-black text-[#E8B96A]">0</p>
          <p className="text-[9px] uppercase opacity-60">Filleules</p>
        </div>
      </div>

      {/* MESSAGE SI VIDE */}
      {nbSaved === 0 && (
        <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
          <p className="text-4xl mb-4">💆🏾‍♀️</p>
          <p className="text-sm opacity-70 mb-5">Tu n'as pas encore sauvegardé de styles.</p>
          <button 
            onClick={() => navigate('/results')}
            className="px-6 py-3 bg-[#C9963A] text-[#2C1A0E] rounded-xl font-bold text-sm"
          >
            Explorer les styles
          </button>
        </div>
      )}
    </div>
  )
}
