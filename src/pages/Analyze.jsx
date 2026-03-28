import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { incrementAnalyses } from '../services/credits.js' 

export default function Analyze() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const photoUrl = sessionStorage.getItem('afrotresse_photo')

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          
          // INCRÉMENTATION AUTOMATIQUE ICI
          incrementAnalyses() 
          
          setTimeout(() => navigate('/results'), 500)
          return 100
        }
        return prev + 1
      })
    }, 40) // Vitesse de l'analyse (env. 4s)

    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col items-center justify-center p-8">
       <div className="relative mb-12">
          <div className="w-32 h-32 rounded-full border-2 border-[#C9963A]/30 p-1 relative z-10">
             <img 
               src={sessionStorage.getItem('afrotresse_photo') || '/avatar.png'} 
               className="w-full h-full rounded-full object-cover shadow-2xl" 
               alt="Analyse"
             />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-[#C9963A] blur-2xl z-0"
          />
       </div>

       <h2 className="text-[#FAF4EC] font-display text-xl font-bold mb-2 tracking-tight">Analyse en cours...</h2>
       <p className="text-[#C9963A] font-mono text-sm mb-8 font-bold">{progress}%</p>

       <div className="w-full max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C9963A] to-[#E8B96A]" 
            style={{ width: `${progress}%` }} 
          />
       </div>

       <div className="mt-10 space-y-3 opacity-40">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#FAF4EC]">Intelligence Artificielle AfroTresse</p>
       </div>
    </div>
  )
}
