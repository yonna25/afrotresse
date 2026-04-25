import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',         label: 'Accueil',    Icon: HomeIcon },
  { to: '/results',  label: 'Styles',     Icon: ResultsIcon },
  { to: '/camera',   label: 'Selfie',     Icon: CameraIcon, center: true },
  { to: '/partners', label: 'Salons',     Icon: HandshakeIcon }, // 🤝 Utilisé ici
  { to: '/profile',  label: 'Profil',     Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1A0A00]/85 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom,20px)] pt-3">
      <div className="flex items-center justify-around px-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div 
                className="flex flex-col items-center gap-1.5"
                animate={{ opacity: isActive ? 1 : 0.4 }}
              >
                <Icon active={isActive} />
                <span className={`text-[9px] uppercase tracking-[0.1em] font-medium ${isActive ? 'text-[#C9963A]' : 'text-white/40'}`}>
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ─── COMPOSANTS ICÔNES ──────────────────────────────────────────

function HandshakeIcon({ active }) {
  return (
    <div className={`text-xl transition-all duration-300 ${active ? 'scale-110' : 'grayscale opacity-80'}`}>
      🤝
    </div>
  )
}

function HomeIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.5">
      <path d="M3 12l9-9 9 9M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ResultsIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12h8M8 8h5M8 16h6" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon({ active }) {
  return (
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-10 shadow-2xl transition-all"
      style={{
        background: active ? '#C9963A' : 'linear-gradient(135deg, #3D2616, #2C1A0E)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
      <span className="text-xl">📸</span>
    </div>
  )
}

function UserIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
