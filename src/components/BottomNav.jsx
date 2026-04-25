import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',         label: 'Accueil',    Icon: HomeIcon },
  { to: '/results',  label: 'Styles',     Icon: ResultsIcon },
  { to: '/camera',   label: 'Selfie',     Icon: CameraIcon, center: true },
  { to: '/partners', label: 'Salons',     Icon: HandshakeIcon }, // 👈 Changement ici
  { to: '/profile',  label: 'Profil',     Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 z-50"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        background: 'rgba(26, 10, 0, 0.85)', // Plus sombre pour le minimalisme
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)', // Bordure ultra-fine
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        paddingTop: '12px'
      }}
    >
      <div className="flex items-center justify-around px-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-1.5"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.4, y: isActive ? -2 : 0 }}
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

// ─── ICÔNES MINIMALISTES ───────────────────────────────────────────────────

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
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-10 shadow-2xl transition-all"
      style={{
        background: active ? '#C9963A' : 'linear-gradient(135deg, #3D2616, #2C1A0E)',
        border: '1px solid rgba(255,255,255,0.1)',
        transform: active ? 'scale(1.1)' : 'scale(1)'
      }}
    >
      <span className="text-xl">📸</span>
    </div>
  )
}

function HandshakeIcon({ active }) { // 👈 Nouvelle Icône Poignée de Main
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? '#C9963A' : '#FAF4EC'} strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v4.5" />
    </svg>
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
