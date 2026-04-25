import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',         label: 'Accueil',    Icon: HomeIcon },
  { to: '/results',  label: 'Styles',     Icon: ResultsIcon },
  { to: '/camera',   label: 'Selfie',     Icon: CameraIcon, center: true },
  { to: '/partners', label: 'Salons',     Icon: HandshakeIcon }, 
  { to: '/profile',  label: 'Profil',     Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#1A0A00]/80 backdrop-blur-xl border-t border-white/5 pb-safe pt-3">
      <div className="flex items-center justify-around px-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div 
                className="flex flex-col items-center gap-1"
                animate={{ opacity: isActive ? 1 : 0.4 }}
              >
                <Icon active={isActive} />
                <span className={`text-[8px] uppercase tracking-widest font-medium ${isActive ? 'text-[#C9963A]' : 'text-white/40'}`}>
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

function HandshakeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#C9963A" : "#FAF4EC"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" />
      <path d="M7 21h2" />
      <path d="M7 3h2" />
      <path d="M10 8h5" />
      <path d="M10 12h5" />
      <path d="M10 16h5" />
      <path d="M3 10h4c.6 0 1 .4 1 1v2c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1v-2c0-.6.4-1 1-1Z" />
    </svg>
  )
}

// ... garder les autres icônes HomeIcon, ResultsIcon, etc.
