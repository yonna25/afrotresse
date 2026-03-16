import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const [ready,     setReady]     = useState(false)
  const [flash,     setFlash]     = useState(false)
  const [error,     setError]     = useState(null)
  const [facing,    setFacing]    = useState('user')
  const [countdown, setCountdown] = useState(null)

  const startCamera = useCallback(async (facingMode = 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch (e) {
      setError('Impossible d\'accéder à la caméra. Autorise l\'accès dans les paramètres.')
    }
  }, [])

  useEffect(() => {
    startCamera(facing)
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    setReady(false)
    startCamera(next)
  }

  const capture = () => {
    let count = 3
    setCountdown(count)
    const tick = setInterval(() => {
      count -= 1
      if (count === 0) {
        clearInterval(tick)
        setCountdown(null)
        doCapture()
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  const doCapture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
    canvas.toBlob(blob => {
      const url = canvas.toDataURL('image/jpeg', 0.9)
      onCapture({ blob, url })
    }, 'image/jpeg', 0.9)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }} />
        )}
      </AnimatePresence>

      {/* Countdown */}
      <AnimatePresence>
        {countdown && (
          <motion.div
            key={countdown}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
          >
            <span className="font-display text-8xl text-gold" style={{ textShadow: '0 0 40px rgba(201,150,58,0.8)' }}>
              {countdown}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <OvalFrame />
        </div>

        {!ready && !error && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <p className="text-warm font-body animate-pulse">Démarrage de la caméra…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-brown flex items-center justify-center p-8">
            <p className="text-cream font-body text-center text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Guide text */}
      <div className="text-center py-3 px-4">
        <p className="text-cream/70 text-xs font-body">Centre ton visage dans l'ovale • Bonne lumière</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-10 pb-16 pt-4">
        <motion.button onClick={onClose} whileTap={{ scale: 0.9 }}
          className="w-12 h-12 glass rounded-full flex items-center justify-center text-cream">
          <CloseIcon />
        </motion.button>

        <motion.button
          onClick={capture}
          disabled={!ready || !!countdown}
          whileTap={{ scale: 0.9 }}
          className="w-20 h-20 rounded-full border-4 border-gold flex items-center justify-center disabled:opacity-50"
          style={{ boxShadow: '0 0 0 6px rgba(201,150,58,0.2)' }}
        >
          <div className="w-14 h-14 rounded-full bg-gold" />
        </motion.button>

        <motion.button onClick={flipCamera} whileTap={{ scale: 0.9 }}
          className="w-12 h-12 glass rounded-full flex items-center justify-center text-gold">
          <FlipIcon />
        </motion.button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function OvalFrame() {
  return (
    <svg viewBox="0 0 300 380" className="w-64 h-80 opacity-60">
      <ellipse cx="150" cy="190" rx="130" ry="170" fill="none" stroke="#C9963A" strokeWidth="2" strokeDasharray="8 4"/>
      {/* Corner accents */}
      {[[20,20],[280,20],[20,360],[280,360]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#C9963A" opacity="0.7"/>
      ))}
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  )
}
