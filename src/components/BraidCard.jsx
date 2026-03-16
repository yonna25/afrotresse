import { motion } from 'framer-motion'
import { useState } from 'react'

export default function BraidCard({ braid, index = 0, onSave, saved = false, compact = false }) {
  const [isSaved, setIsSaved] = useState(saved)
  const [imgError, setImgError] = useState(false)

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(braid)
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07 }}
        className="card overflow-hidden"
      >
        <div className="flex items-center gap-3 p-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-mid">
            {!imgError
              ? <img src={braid.image} alt={braid.name} className="w-full h-full object-cover"
                  onError={() => setImgError(true)} />
              : <BraidPlaceholder style={braid.name} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-cream truncate">{braid.name}</p>
            <p className="text-warm text-xs mt-0.5 line-clamp-1">{braid.description}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              {braid.tags?.slice(0,2).map(t => (
                <span key={t} className="text-[10px] bg-brown text-gold px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="p-2 flex-shrink-0">
            <HeartIcon filled={isSaved} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      whileTap={{ scale: 0.98 }}
      className="card overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-mid">
        {!imgError
          ? <img src={braid.image} alt={braid.name} className="w-full h-full object-cover"
              onError={() => setImgError(true)} />
          : <BraidPlaceholder style={braid.name} />
        }
        {/* Match badge */}
        {braid.matchScore && (
          <div className="absolute top-3 left-3 bg-gold text-brown text-xs font-bold px-3 py-1 rounded-full font-body">
            ✦ {braid.matchScore}% match
          </div>
        )}
        {/* Save button */}
        <button
          onClick={handleSave}
          className="absolute top-3 right-3 w-9 h-9 glass rounded-full flex items-center justify-center"
        >
          <HeartIcon filled={isSaved} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display text-lg text-cream font-semibold leading-tight">{braid.name}</h3>
        <p className="text-warm text-sm mt-1 leading-relaxed line-clamp-2">{braid.description}</p>

        {/* Tags */}
        {braid.tags && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {braid.tags.map(tag => (
              <span key={tag} className="text-xs bg-brown text-gold border border-gold/20 px-2.5 py-1 rounded-full font-body">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Duration + difficulty */}
        {(braid.duration || braid.difficulty) && (
          <div className="flex gap-4 mt-3 pt-3 border-t border-warm/20">
            {braid.duration && (
              <div className="flex items-center gap-1.5 text-xs text-warm">
                <ClockIcon /><span>{braid.duration}</span>
              </div>
            )}
            {braid.difficulty && (
              <div className="flex items-center gap-1.5 text-xs text-warm">
                <StarIcon /><span>{braid.difficulty}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function BraidPlaceholder({ style }) {
  const patterns = {
    'Box Braids': '🌟', 'Cornrows': '〰️', 'Senegalese Twist': '🌀',
    'Fulani Braids': '✨', 'Knotless Braids': '💫', 'Lemonade Braids': '🌊',
    'Ghana Braids': '🔮', 'Micro Braids': '🌺',
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-mid to-brown">
      <span className="text-4xl">{patterns[style] || '💇🏾‍♀️'}</span>
      <span className="text-warm text-xs mt-2 font-body text-center px-2">{style}</span>
    </div>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill={filled ? '#C9963A' : 'none'}
      stroke={filled ? '#C9963A' : '#8B5E3C'} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
    </svg>
  )
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
