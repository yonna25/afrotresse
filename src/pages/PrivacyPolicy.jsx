import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  return <LegalPage title="Politique de confidentialité" onBack={() => navigate(-1)} sections={SECTIONS} />
}

function LegalPage({ title, onBack, sections }) {
  return (
    <div className="min-h-screen pb-16" style={{ background: '#1A0A00' }}>
      {/* Header */}
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

      {/* Contenu */}
      <div className="px-5 pt-6 space-y-6">
        {sections.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <h2 className="font-display text-base mb-2" style={{ color: '#C9963A' }}>{s.title}</h2>
            <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(250,244,236,0.75)' }}>{s.content}</p>
          </motion.div>
        ))}

        <div className="pt-4 pb-8 text-center">
          <p className="font-body text-xs" style={{ color: 'rgba(201,150,58,0.5)' }}>
            © 2026 AfroTresse — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}

const SECTIONS = [
  {
    title: '1. Qui sommes-nous ?',
    content: 'AfroTresse est une application mobile progressive (PWA) qui aide les femmes à trouver leur tresse parfaite en analysant la forme de leur visage. Notre application est développée et opérée de manière indépendante.',
  },
  {
    title: '2. Données collectées',
    content: 'Nous collectons uniquement les données nécessaires au bon fonctionnement de l\'application : votre prénom (optionnel, stocké localement sur votre appareil), vos photos de selfie (traitées en temps réel et non conservées sur nos serveurs), vos préférences de styles sauvegardés (stockées localement sur votre appareil), et votre code de parrainage (généré et stocké localement).',
  },
  {
    title: '3. Utilisation des données',
    content: 'Votre selfie est envoyé à notre service d\'analyse pour détecter la forme de votre visage et vous proposer des styles adaptés. Cette photo n\'est pas conservée après l\'analyse. Aucune donnée personnelle n\'est vendue ou partagée avec des tiers à des fins commerciales.',
  },
  {
    title: '4. Stockage local',
    content: 'La majorité de vos données (prénom, styles sauvegardés, crédits, code de parrainage) sont stockées uniquement sur votre appareil via le localStorage de votre navigateur. AfroTresse n\'a pas accès à ces données.',
  },
  {
    title: '5. Services tiers',
    content: 'AfroTresse utilise l\'API Claude d\'Anthropic pour l\'analyse de la forme du visage, et l\'API Fal.ai pour la génération d\'essayage virtuel (fonctionnalité payante). Ces services traitent temporairement vos images conformément à leurs propres politiques de confidentialité.',
  },
  {
    title: '6. Vos droits',
    content: 'Vous pouvez à tout moment supprimer vos données locales en effaçant les données de navigation de votre navigateur. Pour toute question concernant vos données, contactez-nous via les informations disponibles dans l\'application.',
  },
  {
    title: '7. Cookies',
    content: 'AfroTresse n\'utilise pas de cookies de tracking ou publicitaires. Seuls des cookies techniques nécessaires au fonctionnement de l\'application peuvent être utilisés.',
  },
]
