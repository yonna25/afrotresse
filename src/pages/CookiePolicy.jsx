import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CookiePolicy() {
  const navigate = useNavigate()
  return <LegalPage title="Politique des cookies" onBack={() => navigate(-1)} sections={SECTIONS} />
}

function LegalPage({ title, onBack, sections }) {
  return (
    <div className="min-h-screen pb-16" style={{ background: '#1A0A00' }}>
      <div className="sticky top-0 z-30 px-5 pt-12 pb-4"
        style={{ background: 'rgba(26,10,0,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(201,150,58,0.15)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,150,58,0.1)', border: '1px solid rgba(201,150,58,0.3)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#C9963A" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 className="font-display text-lg" style={{ color: '#FAF4EC' }}>{title}</h1>
            <p className="font-body text-xs" style={{ color: 'rgba(201,150,58,0.7)' }}>AfroTresse — Dernière mise à jour : Mars 2026</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {sections.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <h2 className="font-display text-base mb-2" style={{ color: '#C9963A' }}>{s.title}</h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(250,244,236,0.75)' }}>{s.content}</p>
          </motion.div>
        ))}
        <div className="pt-4 pb-8 text-center">
          <p className="font-body text-xs" style={{ color: 'rgba(201,150,58,0.5)' }}>© 2026 AfroTresse — Tous droits réservés</p>
        </div>
      </div>
    </div>
  )
}

const SECTIONS = [
  {
    title: '1. Qu\'est-ce qu\'un cookie ?',
    content: 'Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur une application ou un site web. Il permet de mémoriser des informations sur votre navigation.',
  },
  {
    title: '2. Les cookies utilisés par AfroTresse',
    content: 'AfroTresse n\'utilise pas de cookies de tracking, publicitaires ou d\'analyse comportementale. Nous utilisons uniquement le localStorage de votre navigateur pour stocker vos préférences locales (prénom, crédits, styles sauvegardés). Ces données ne sont pas des cookies au sens technique du terme et ne quittent jamais votre appareil.',
  },
  {
    title: '3. Cookies des services tiers',
    content: 'Lors de l\'utilisation des fonctionnalités d\'essayage virtuel, vos images sont temporairement transmises aux services Anthropic (Claude) et Fal.ai. Ces services peuvent déposer leurs propres cookies conformément à leurs politiques respectives.',
  },
  {
    title: '4. Gestion des données locales',
    content: 'Vous pouvez supprimer toutes vos données locales à tout moment en effaçant les données de navigation dans les paramètres de votre navigateur. Cette action supprimera votre prénom, vos crédits, vos styles sauvegardés et votre code de parrainage.',
  },
  {
    title: '5. Pas de tracking publicitaire',
    content: 'AfroTresse ne vend pas vos données à des annonceurs. Aucun cookie publicitaire ou de retargeting n\'est utilisé. Votre expérience sur l\'application est entièrement privée.',
  },
  {
    title: '6. Contact',
    content: 'Pour toute question concernant notre utilisation des cookies et données locales, vous pouvez nous contacter directement via l\'application AfroTresse.',
  },
]
