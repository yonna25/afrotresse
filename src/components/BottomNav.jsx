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
    <nav className="fixed bottom-6 z-50 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px]">
      <div className="bg-[#1A0A00]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-around">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="relative flex-1">
            {({ isActive }) => (
              <motion.div 
                className="flex flex-col items-center justify-center min-h-[44px]"
                animate={{ 
                  y: isActive && !center ? -4 : 0,
                  scale: isActive ? 1.1 : 1
                }}
              >
                <Icon active={isActive} />
                
                {isActive && !center && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[8px] uppercase tracking-[0.2em] font-black text-[#C9963A] mt-1.5"
                  >
                    {label}
                  </motion.span>
                )}

                {isActive && !center && (
                  <motion.div 
                    layoutId="dot"
                    className="absolute -bottom-1 w-1 h-1 bg-[#C9963A] rounded-full"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ─── ICÔNES PREMIUM (Finesse 1.2) ──────────────────────────────────────────

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <path d="M3 10l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ResultsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" />
    </svg>
  )
}

function CameraIcon({ active }) {
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
      active ? 'bg-[#C9963A] -translate-y-8 scale-110' : 'bg-gradient-to-tr from-[#2C1A0E] to-[#4D3625] -translate-y-6'
    } border border-white/10`}>
      <span className="text-2xl">📸</span>
    </div>
  )
}

function HandshakeIcon({ active }) {
  return (
    <span className={`text-xl transition-all duration-300 ${active ? 'scale-110' : 'grayscale opacity-50'}`}>
      🤝
    </span>
  )
}

function UserIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="4" strokeLinecap="round"/>
    </svg>
  )
}
