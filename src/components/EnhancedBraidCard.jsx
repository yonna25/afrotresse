import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { PRICING } from '../services/credits.js'

export default function EnhancedBraidCard({ braid, index = 0, onTryStyle, isLoading = false, canDiscover = true, canTransform = true, credits = 0 }) {
  const [zoomedImage, setZoomedImage] = useState(null)
  const [imgErrors, setImgErrors] = useState({})

  // Construire les noms des images
  const styleKey = braid.id?.replace(/-/g, '') || braid.name?.toLowerCase().replace(/\s+/g, '')
  const faceImg = `/styles/${styleKey}-face.jpg`
  const backImg = `/styles/${styleKey}-back.jpg`
  const topImg = `/styles/${styleKey}-top.jpg`

  const handleImageError = (view) => {
    setImgErrors(prev => ({ ...prev, [view]: true }))
  }

  // Déterminer l'état du bouton
  const getButtonState = () => {
    if (!canDiscover && !canTransform) {
      return { label: 'Plus de credits', disabled: true, type: 'empty' }
    }
    if (canDiscover) {
      return { label: 'Decouvrir sur moi', disabled: false, type: 'discover' }
    }
    if (canTransform) {
      return { label: 'Me transformer ✨', disabled: false, type: 'transform' }
    }
    return { label: '🔒 Essayer sur moi', disabled: true, type: 'locked' }
  }

  const buttonState = getButtonState()

  const handleClick = () => {
    if (buttonState.type === 'discover') {
      onTryStyle?.(braid, index, 'discover')
    } else if (buttonState.type === 'transform') {
      onTryStyle?.(braid, index, 'transform')
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-[#3a2118] rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Grid 3 photos : face grande + dos/dessus petites */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#2b1810]">
          {/* FACE - GRANDE (2 colonnes, 2 lignes) */}
          <div className="col-span-2 row-span-2 relative rounded-lg overflow-hidden bg-[#1a0f08] cursor-pointer"
            onClick={() => setZoomedImage({ src: faceImg, label: 'Vue face' })}>
            {!imgErrors.face ? (
              <img
                src={faceImg}
                alt={`${braid.name} - Vue face`}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
                onError={() => handleImageError('face')}
              />
            ) : (
              <BraidPlaceholder style={braid.name} />
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 hover:opacity-100 text-sm font-semibold">🔍</span>
            </div>
          </div>

          {/* DOS - PETITE (1 colonne, 1 ligne) */}
          <div className="relative rounded-lg overflow-hidden bg-[#1a0f08] cursor-pointer aspect-square"
            onClick={() => setZoomedImage({ src: backImg, label: 'Vue dos' })}>
            {!imgErrors.back ? (
              <img
                src={backImg}
                alt={`${braid.name} - Vue dos`}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
                onError={() => handleImageError('back')}
              />
            ) : (
              <BraidPlaceholder style={braid.name} />
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 hover:opacity-100 text-xs font-semibold">🔍</span>
            </div>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              Dos
            </div>
          </div>

          {/* DESSUS - PETITE (1 colonne, 1 ligne) */}
          <div className="relative rounded-lg overflow-hidden bg-[#1a0f08] cursor-pointer aspect-square"
            onClick={() => setZoomedImage({ src: topImg, label: 'Vue dessus' })}>
            {!imgErrors.top ? (
              <img
                src={topImg}
                alt={`${braid.name} - Vue dessus`}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
                onError={() => handleImageError('top')}
              />
            ) : (
              <BraidPlaceholder style={braid.name} />
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 hover:opacity-100 text-xs font-semibold">🔍</span>
            </div>
            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              Dessus
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-white text-lg font-semibold">{braid.name}</h3>
            <p className="text-sm text-gray-300 mt-1">
              {braid.description || "Style tendance adapte a ton visage"}
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {(braid.tags || ["Moderne", "Chic", "Populaire"]).slice(0, 3).map((tag, i) => (
              <span key={i} className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                {tag}
              </span>
            ))}
          </div>

          {/* Message incitatif */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(201,150,58,0.15)', border: '2px solid rgba(201,150,58,0.4)' }}>
            <span className="text-xl">🪞</span>
            <p className="font-semibold text-sm" style={{ color: '#FAF4EC' }}>
              {buttonState.type === 'empty'
                ? "Ne prends plus de risques - achete un pack pour te voir transformee !"
                : buttonState.type === 'discover'
                ? "Decouvre si ce style te va vraiment. Analyse gratuite !"
                : "Imagine-toi avec cette tresse... Visualise le rendu avant d'aller au salon !"}
            </p>
          </div>

          {/* Bouton */}
          <button
            onClick={handleClick}
            disabled={isLoading || buttonState.disabled}
            className="w-full py-3 rounded-xl font-bold text-sm mt-2 transition-all"
            style={{
              background: isLoading ? '#a08000' : buttonState.disabled ? '#666' : '#FFC000',
              color: '#000',
              border: 'none',
              opacity: isLoading ? 0.7 : buttonState.disabled ? 0.5 : 1,
              cursor: buttonState.disabled ? 'not-allowed' : 'pointer',
            }}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Preparation en cours...
              </span>
            ) : (
              <span>
                {buttonState.label}
                {buttonState.type === 'transform' && ` (${PRICING.transformCost} credits)`}
              </span>
            )}
          </button>
        </div>
      </motion.div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full"
            >
              {/* Image zoomée */}
              <img
                src={zoomedImage.src}
                alt="Zoomed"
                className="w-full rounded-lg"
              />

              {/* Label */}
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                {zoomedImage.label}
              </div>

              {/* Bouton fermer */}
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function BraidPlaceholder({ style }) {
  const patterns = {
    'Box Braids': '🌟', 'Cornrows': '〰️', 'Senegalese Twist': '🌀',
    'Fulani Braids': '✨', 'Knotless Braids': '💫', 'Lemonade Braids': '🌊',
    'Ghana Braids': '🔮', 'Micro Braids': '🌺',
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#3a2118] to-[#1a0f08]">
      <span className="text-3xl">{patterns[style] || '💇🏾‍♀️'}</span>
      <span className="text-warm text-xs mt-2 font-body text-center px-2">{style}</span>
    </div>
  )
}
