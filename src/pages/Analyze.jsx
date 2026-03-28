import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { incrementAnalyses } from '../services/credits.js' 

export default function Analyze() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          // INCRÉMENTATION AUTOMATIQUE
          incrementAnalyses() 
          setTimeout(() => navigate('/results'), 600)
          return 100
        }
        return prev + 1
      })
    }, 35) // Analyse rapide et fluide (env. 3.5s)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#1A0A00] flex flex-col items-center justify-center p-8 overflow-hidden">
       <div className="relative mb-12">
          <div className="w-32 h-32 rounded-full border-2 border-[#C9963A]/30 p-1 relative z-10 overflow-hidden">
             <img 
               src={sessionStorage.getItem('afrotresse_photo') || '/avatar.png'} 
               className="w-full h-full rounded-full object-cover" 
             />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-[#C9963A] blur-3xl z-0"
          />
       </div>

       <h2 className="text-[#FAF4EC] font-display text-xl font-bold mb-2 tracking-tight">Révélation en cours...</h2>
       <p className="text-[#C9963A] font-mono text-xs mb-8 tracking-[0.2em] font-black">{progress}%</p>

       <div className="w-full max-w-[240px] h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#C9963A] to-[#E8B96A]" 
            style={{ width: `${progress}%` }} 
          />
       </div>
    </div>
  )
}
