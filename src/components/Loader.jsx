import { motion } from 'framer-motion'

export default function Loader({ message = 'Analyse en cours...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16">
      {/* Outer ring */}
      <div className="relative w-32 h-32">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-gold/20"
          style={{ borderTopColor: '#C9963A' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border-4 border-goldLight/15"
          style={{ borderBottomColor: '#E8B96A' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center adinkra symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AdinkraSymbol />
          </motion.div>
        </div>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gold"
            animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <p className="font-body text-goldLight text-center text-sm leading-relaxed max-w-xs">
        {message}
      </p>
    </div>
  )
}

function AdinkraSymbol() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" stroke="#C9963A" strokeWidth="2" fill="none"/>
      <circle cx="24" cy="24" r="4"  fill="#C9963A"/>
      <line x1="24" y1="6"  x2="24" y2="14" stroke="#C9963A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="24" y1="34" x2="24" y2="42" stroke="#C9963A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6"  y1="24" x2="14" y2="24" stroke="#C9963A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="34" y1="24" x2="42" y2="24" stroke="#C9963A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="10" x2="17" y2="17" stroke="#E8B96A" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="31" y1="31" x2="38" y2="38" stroke="#E8B96A" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="38" y1="10" x2="31" y2="17" stroke="#E8B96A" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="17" y1="31" x2="10" y2="38" stroke="#E8B96A" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
