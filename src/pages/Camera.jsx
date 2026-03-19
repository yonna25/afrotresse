import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CameraCapture from '../components/CameraCapture.jsx'

// Convertit une blob URL en base64 data URL
async function blobUrlToBase64(blobUrl) {
  const res    = await fetch(blobUrl)
  const blob   = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}


// Vérifie la netteté de l'image via détection de contraste
async function checkImageQuality(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size   = 100
      canvas.width  = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, size, size)
      const data = ctx.getImageData(0, 0, size, size).data
      let sum = 0, sumSq = 0, n = data.length / 4
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
        sum   += gray
        sumSq += gray * gray
      }
      const mean     = sum / n
      const variance = sumSq / n - mean * mean
      // Variance < 200 = image trop uniforme = floue ou trop sombre
      resolve(variance > 200)
    }
    img.src = dataUrl
  })
}

export default function Camera() {
  const navigate = useNavigate()
  const [photo,   setPhoto]   = useState(null)
  const [showCam, setShowCam] = useState(false)
  const [photoError, setPhotoError] = useState("")

  const handleCapture = (data) => {
    setPhoto(data)
    setShowCam(false)
  }

  const handleAnalyze = async () => {
    let photoData = photo.url
    if (photo.url.startsWith('blob:')) {
      photoData = await blobUrlToBase64(photo.url)
    }
    // Verification de la qualite de la photo
    const isSharp = await checkImageQuality(photoData)
    if (!isSharp) {
      setPhotoError("Photo floue. Assure-toi d'etre face a la lumiere pour un resultat optimal.")
      return
    }
    setPhotoError("")
    sessionStorage.setItem('afrotresse_photo', photoData)
    navigate('/analyze')
  }

  const handleRetake = () => {
    setPhoto(null)
    setPhotoError("")
  }

  return (
    <div className="min-h-screen bg-brown flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-cream">
          <BackIcon />
        </button>
        <h1 className="font-display text-xl text-cream">Mon selfie</h1>
      </div>

      {showCam && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCam(false)} />
      )}

      <div className="flex-1 px-6 flex flex-col items-center justify-center gap-8 pb-10">
        {!photo ? (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-64 h-80 glass rounded-3xl flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gold/30"
            >
              <div className="w-20 h-20 rounded-full bg-mid flex items-center justify-center">
                <CameraIcon />
              </div>
              <p className="font-body text-warm text-sm text-center px-6">
                Prends un selfie bien éclairé pour une analyse précise
              </p>
            </motion.div>

            <div className="w-full max-w-sm space-y-2">
              {[
                ['💡', 'Bonne lumière face à toi'],
                ['😊', 'Expression neutre, visage dégagé'],
                ['📱', 'Téléphone à hauteur des yeux'],
              ].map(([icon, tip]) => (
                <div key={tip} className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
                  <span className="text-lg">{icon}</span>
                  <span className="font-body text-cream/80 text-sm">{tip}</span>
                </div>
              ))}
            </div>

            <div className="w-full max-w-sm space-y-3">
              <button onClick={() => setShowCam(true)} className="btn-gold w-full">
                📸 Ouvrir la caméra
              </button>
              <label className="btn-outline w-full flex items-center justify-center gap-2 cursor-pointer">
                <UploadIcon />
                <span>Importer une photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = URL.createObjectURL(file)
                    setPhoto({ blob: file, url })
                  }
                }} />
              </label>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <div className="w-64 h-80 rounded-3xl overflow-hidden border-2 border-gold/40"
              style={{ boxShadow: '0 0 40px rgba(201,150,58,0.2)' }}>
              <img src={photo.url} alt="Selfie" className="w-full h-full object-cover" />
            </div>

            <div className="text-center">
              <p className="font-display text-cream text-lg">✦ Photo prête !</p>
              <p className="font-body text-warm text-sm mt-1">Lance l'analyse pour découvrir tes styles</p>
            </div>

            {photoError && (
              <div className="w-full px-4 py-3 rounded-2xl text-sm text-center"
                style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.4)', color: '#FF6B6B' }}>
                📷 {photoError}
              </div>
            )}
            <button onClick={handleAnalyze} className="btn-gold w-full">
              🔍 Analyser mon visage
            </button>
            <button onClick={handleRetake} className="btn-outline w-full">
              Reprendre la photo
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
