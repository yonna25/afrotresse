import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

const ITEMS = [
  { to: '/',        label: 'Accueil', Icon: HomeIcon   },
  { to: '/camera',  label: 'Selfie',  Icon: CameraIcon, center: true },
  { to: '/profile', label: 'Profil',  Icon: UserIcon   },
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
        background: 'rgba(44,26,14,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(201,150,58,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {ITEMS.map(({ to, label, Icon, center }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div className="flex flex-col items-center gap-1 py-1" whileTap={{ scale: 0.9 }}>
                <div style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
                  <Icon active={isActive} center={center} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: isActive ? '#C9963A' : '#8B5E3C' }}>
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

// Icônes simplifiées pour l'exemple
function HomeIcon({ active }) { return <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor"><path d="M3 12L12 3l9 9M9 21V12h6v9" /></svg> }
function CameraIcon({ active }) { return <div className={`w-12 h-12 rounded-full flex items-center justify-center -mt-8 ${active ? 'bg-[#C9963A]' : 'bg-[#5C3317]'}`}>📸</div> }
function UserIcon({ active }) { return <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> }
