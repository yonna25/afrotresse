import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
// 1. IMPORT AJOUTÉ ICI
import { incrementAnalyses } from '../services/credits.js' 

const STEPS = [
  { text: 'Analyse de tes traits uniques...', icon: '✨', pct: 20 },
  { text: 'Etude de ta structure faciale...', icon: '📐', pct: 40 },
  { text: 'Calcul des proportions ideales...', icon: '🧠', pct: 60 },
  { text: 'Selection de tes tresses sur-mesure...', icon: '👑', pct: 80 },
  { text: 'Voici tes tresses ideales...', icon: '😍', pct: 98 },
]

export default function Analyze() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          
          // 2. DÉCLENCHEMENT DU COMPTEUR ICI
          incrementAnalyses() 
          
          setTimeout(() => navigate('/results'), 500)
          return 100
        }
        
        // Gestion des étapes visuelles
        const newProgress = prev + 1
        const currentStep = STEPS.findIndex(s => newProgress <= s.pct)
        if (currentStep !== -1) setStep(currentStep)
        
        return newProgress
      })
    }, 50) // Vitesse de la barre

    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-6 text-center">
      <PhotoThumb />
      
      <h2 className="text-xl font-display font-bold text-[#FAF4EC] mb-8 mt-6">
        {STEPS[step]?.text}
      </h2>

      {/* Barre de progression */}
      <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-[#C9963A]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-[#C9963A] text-xs font-bold">{progress}%</p>

      {/* Liste des étapes */}
      <div className="mt-8 space-y-3 w-full max-w-xs">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
            <span className="text-lg">{s.icon}</span>
            <span className="text-[11px] text-[#FAF4EC] uppercase tracking-wider font-bold text-left">{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotoThumb() {
  const url = sessionStorage.getItem('afrotresse_photo')
  if (!url) return null
  return (
    <div className="relative">
      <img src={url} className="w-32 h-32 rounded-full object-cover border-4 border-[#C9963A] shadow-2xl" alt="Analyse" />
      <motion.div 
        animate={{ y: [0, 120, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-1 bg-[#C9963A] shadow-[0_0_15px_#C9963A]"
      />
    </div>
  )
}
