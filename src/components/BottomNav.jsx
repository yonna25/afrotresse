import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',         label: 'Accueil',    Icon: HomeIcon },
  { to: '/results',  label: 'Styles',     Icon: ResultsIcon },
  { to: '/camera',   label: 'Selfie',     Icon: CameraIcon, center: true },
  { to: '/partners', label: 'Partenaires', Icon: HandshakeIcon },
  { to: '/profile',  label: 'Profil',     Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-[430px]">
      {/* Container principal ancré */}
      <div className="bg-[#1A0A00]/90 backdrop-blur-2xl border-t border-white/5 px-2 pb-[env(safe-area-inset-bottom,20px)] pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] flex items-center justify-around">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="relative flex-1 group">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center min-h-[48px]">
                {/* Micro-indicateur supérieur pour l'icône active */}
                {isActive && !center && (
                  <motion.div 
                    layoutId="nav-line"
                    className="absolute top-[-16px] w-8 h-[2px] bg-[#C9963A] shadow-[0_0_8px_#C9963A]"
                  />
                )}

                <motion.div 
                  animate={{ 
                    y: isActive && !center ? -2 : 0,
                    scale: isActive ? 1.05 : 1
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <Icon active={isActive} />
                </motion.div>
                
                <span className={`text-[9px] uppercase tracking-[0.15em] font-medium mt-2 transition-all duration-300 ${
                  isActive ? 'text-[#C9963A] opacity-100' : 'text-white/30 opacity-60'
                }`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ─── ICÔNES PREMIUM (Design épuré) ──────────────────────────────────────────

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <path d="M3 10l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ResultsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <circle cx="11" cy="11" r="8" strokeLinecap="round" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon({ active }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 -mt-10 border border-white/10 shadow-2xl ${
      active ? 'bg-[#C9963A] scale-110' : 'bg-gradient-to-b from-[#3D2616] to-[#1A0A00]'
    }`}>
      <span className="text-2xl filter drop-shadow-md">📸</span>
    </div>
  )
}

function HandshakeIcon({ active }) {
  return (
    <span className={`text-xl transition-all duration-300 block ${active ? 'scale-110' : 'grayscale opacity-40'}`}>
      🤝
    </span>
  )
}

function UserIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" strokeLinecap="round"/>
    </svg>
  )
}
