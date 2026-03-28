import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
// IMPORT CRUCIAL
import { incrementAnalyses } from '../services/credits.js' 

export default function Analyze() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          
          // --- C'EST ICI QUE CA SE JOUE ---
          // On enregistre l'analyse AUTOMATIQUEMENT ici
          incrementAnalyses() 
          
          setTimeout(() => navigate('/results'), 500)
          return 100
        }
        return prev + 1
      })
    }, 40) // Environ 4 secondes d'analyse
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col items-center justify-center p-8">
       <div className="relative mb-10">
          <div className="w-32 h-32 rounded-full border-2 border-[#C9963A]/30 p-1">
             <img src={sessionStorage.getItem('afrotresse_photo')} className="w-full h-full rounded-full object-cover" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-[#C9963A]/20 blur-xl"
          />
       </div>
       <h2 className="text-[#FAF4EC] font-display text-lg font-medium mb-2">Analyse de ta beauté...</h2>
       <p className="text-[#C9963A] font-mono text-sm mb-8">{progress}%</p>
       <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#C9963A]" style={{ width: `${progress}%` }} />
       </div>
    </div>
  )
}
