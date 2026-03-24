import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeFace } from '../services/faceAnalysis.js'
import { consumeAnalysis } from '../services/credits.js'

const STEPS = [
  { text: 'Analyse de tes traits uniques...', icon: '✨', pct: 20 },
  { text: 'Etude de ta structure faciale...', icon: '📐', pct: 40 },
  { text: 'Calcul des proportions ideales...', icon: '🧠', pct: 60 },
  { text: 'Selection de tes tresses sur-mesure...', icon: '👑', pct: 80 },
  { text: 'Voici tes tresses ideales...', icon: '😍', pct: 98 },
]

const MEDIAPIPE_STEP = { text: 'Voici tes tresses idéales...', icon: '⚙️', pct: 10 }

export default function Analyze() {
  const navigate  = useNavigate()
  const [step,    setStep]    = useState(0)
  const [progress,setProgress] = useState(0)
  const [showMediaPipeMsg, setShowMediaPipeMsg] = useState(false)

  useEffect(() => {
    const photoUrl = sessionStorage.getItem('afrotresse_photo')

    // Progress animation avec gestion du message MediaPipe
    let stepIndex = 0
    let mediaPipeShown = false
    let mediaTimerStarted = false
    const mediaPipeTimer = 1000 // Afficher message après 1s

    const interval = setInterval(() => {
      // Afficher message MediaPipe après 1s
      if (!mediaTimerStarted) {
        mediaTimerStarted = true
        setTimeout(() => {
          if (!mediaPipeShown) {
            setShowMediaPipeMsg(true)
            mediaPipeShown = true
          }
        }, mediaPipeTimer)
      }

      if (stepIndex < STEPS.length - 1) {
        stepIndex++
        setStep(stepIndex)
        setProgress(STEPS[stepIndex].pct)
      }
    }, 600)

    // Vider les anciens résultats avant chaque nouvelle analyse
    sessionStorage.removeItem("afrotresse_results")

    const run = async () => {
      let blob = null
      if (photoUrl) {
        try {
          const res  = await fetch(photoUrl)
          blob = await res.blob()
        } catch {}
      }

      try {
        const result = await analyzeFace(blob)
        clearInterval(interval)
        setShowMediaPipeMsg(false)
        setProgress(100)
        const stamped = { ...result, _ts: Date.now() }
        sessionStorage.setItem('afrotresse_results', JSON.stringify(stamped))
        consumeAnalysis()
        localStorage.setItem('afrotresse_used_tests', String(parseInt(localStorage.getItem('afrotresse_used_tests') || '0', 10) + 1))
        setTimeout(() => navigate('/results'), 400)
      } catch (err) {
        console.error('Analysis failed:', err)
        clearInterval(interval)
        setShowMediaPipeMsg(false)
        // Fallback: même en cas d'erreur, on continue (fallback ovale dans analyzeFace)
        const result = await analyzeFace(blob)
        setProgress(100)
        const stamped2 = { ...result, _ts: Date.now() }
        sessionStorage.setItem('afrotresse_results', JSON.stringify(stamped2))
        consumeAnalysis()
        localStorage.setItem('afrotresse_used_tests', String(parseInt(localStorage.getItem('afrotresse_used_tests') || '0', 10) + 1))
        setTimeout(() => navigate('/results'), 400)
      }
    }
    run()

    return () => clearInterval(interval)
  }, [navigate])

  // Déterminer le step à afficher
  const displayStep = showMediaPipeMsg ? MEDIAPIPE_STEP : STEPS[step]

  return (
    <div className="min-h-screen bg-brown flex flex-col items-center justify-center px-6">
      {/* Photo thumbnail */}
      <PhotoThumb />

      {/* Animated rings */}
      <div className="relative w-40 h-40 my-8">
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-gold/30"
            style={{ inset: `${i * 16}px` }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.04, 1] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-4xl"
          >
            {displayStep?.icon}
          </motion.div>
        </div>
      </div>

      {/* Step text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={displayStep?.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-body text-goldLight text-base text-center"
        >
          {displayStep?.text}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-full max-w-xs mt-6 h-2 bg-mid rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #C9963A, #E8B96A)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-warm text-xs mt-2 font-body">{progress}%</p>

      {/* Steps list */}
      <div className="mt-8 space-y-2 w-full max-w-xs">
        {STEPS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0
              ${i < step ? 'bg-gold text-brown' : i === step ? 'bg-gold/30 border border-gold text-gold animate-pulse' : 'bg-mid text-warm'}`}>
              {i < step ? '✓' : i === step ? '…' : '○'}
            </div>
            <span className={`text-xs font-body ${i <= step ? 'text-cream' : 'text-warm/50'}`}>{s.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PhotoThumb() {
  const url = sessionStorage.getItem('afrotresse_photo')
  if (!url) return null
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold/50 mb-2"
      style={{ boxShadow: '0 0 20px rgba(201,150,58,0.3)' }}
    >
      <img src={url} alt="" className="w-full h-full object-cover"/>
    </motion.div>
  )
}
