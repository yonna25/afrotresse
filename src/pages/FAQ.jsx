import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Seo from "../components/Seo.jsx"

const FAQ_DATA = [
  {
    category: '✨ Analyse & styles',
    items: [
      {
        q: 'Comment fonctionne l\'analyse de mon visage ?',
        a: 'Tu prends un selfie directement dans l\'app. Notre IA analyse la forme de ton visage et te propose 3 styles de tresses parfaitement adaptés à tes traits en quelques secondes.'
      },
      {
        q: 'L\'analyse est-elle précise ?',
        a: 'L\'IA s\'améliore en continu. Pour un meilleur résultat, prends ton selfie dans un endroit bien éclairé, face à la caméra, sans lunettes ni chapeau.'
      },
      {
        q: 'Puis-je relancer une analyse ?',
        a: 'Oui, chaque nouvelle analyse consomme 1 crédit. Tu peux en faire autant que tu veux tant que tu as des crédits disponibles.'
      },
      {
        q: 'Qu\'est-ce que la transformation virtuelle ?',
        a: 'Pour 2 crédits, tu peux visualiser directement le style sur ta photo — comme un essai virtuel. C\'est la fonctionnalité la plus immersive de l\'app.'
      },
    ]
  },
  {
    category: '💎 Crédits',
    items: [
      {
        q: 'Comment obtenir des crédits gratuits ?',
        a: '2 crédits t\'sont offerts à l\'inscription. Tu peux aussi en gagner en laissant un avis (+2 crédits) ou en parrainant une amie (+2 crédits par parrainage).'
      },
      {
        q: 'Combien coûte un pack de crédits ?',
        a: 'Trois packs sont disponibles : Découverte (3 crédits — 300 FCFA), Allié (10 crédits — 900 FCFA), et VIP (50 crédits + 10/mois — 2 500 FCFA).'
      },
      {
        q: 'Mes crédits ont une date d\'expiration ?',
        a: 'Non. Tes crédits achetés n\'expirent jamais. Seul le pack VIP inclut un renouvellement mensuel automatique de 10 crédits.'
      },
      {
        q: 'J\'ai payé mais je ne vois pas mes crédits ?',
        a: 'Connecte-toi via Magic Link (page Crédits > Sécuriser mes crédits). Ton solde sera restauré automatiquement depuis notre base de données sécurisée.'
      },
    ]
  },
  {
    category: '🔐 Connexion & compte',
    items: [
      {
        q: 'Comment me connecter à mon compte ?',
        a: 'AfroTresse utilise un système sans mot de passe. Entre ton email dans la section Magic Link, et tu recevras un lien de connexion instantané dans ta boîte mail.'
      },
      {
        q: 'Pourquoi créer un compte ?',
        a: 'Sans compte, tes crédits achetés sont liés à ton appareil. Si tu changes de téléphone ou vides ton cache, ils disparaissent. Avec un compte, ils sont sauvegardés et récupérables partout.'
      },
      {
        q: 'J\'ai changé de téléphone, comment récupérer mes crédits ?',
        a: 'Ouvre AfroTresse sur ton nouveau téléphone, va sur la page Crédits, appuie sur "Sécuriser mes crédits" et entre le même email que précédemment. Tes crédits seront restaurés automatiquement.'
      },
      {
        q: 'Puis-je utiliser l\'app sans créer de compte ?',
        a: 'Oui. Tu peux utiliser tes 2 crédits gratuits sans compte. Mais pour sécuriser des crédits achetés et les retrouver sur n\'importe quel appareil, le compte est indispensable.'
      },
    ]
  },
  {
    category: '🤝 Parrainage',
    items: [
      {
        q: 'Comment fonctionne le parrainage ?',
        a: 'Partage ton code unique avec tes amies. Quand une amie l\'utilise, vous recevez toutes les deux +2 crédits. Si elle achète ensuite un pack, tu reçois en plus 10% de cashback en crédits.'
      },
      {
        q: 'Où trouver mon code de parrainage ?',
        a: 'Ton code personnel est disponible sur ta page Profil. Il commence toujours par "AFRO-" suivi de 5 caractères uniques.'
      },
      {
        q: 'Combien de fois puis-je parrainer ?',
        a: 'Autant de fois que tu veux ! Chaque nouvelle amie parrainée te rapporte des crédits. Il n\'y a pas de limite.'
      },
    ]
  },
  {
    category: '🔒 Confidentialité & données',
    items: [
      {
        q: 'Mes photos sont-elles conservées ?',
        a: 'Non. Les photos prises pour l\'analyse sont traitées en temps réel et ne sont jamais stockées sur nos serveurs. Elles disparaissent dès que l\'analyse est terminée.'
      },
      {
        q: 'Qui a accès à mon email ?',
        a: 'Uniquement AfroTresse. Ton email est utilisé uniquement pour l\'authentification Magic Link. Il n\'est jamais vendu ni partagé avec des tiers.'
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Contacte-nous à contact@afrotresse.com avec ta demande. Toutes tes données seront supprimées dans un délai de 72 heures.'
      },
    ]
  },
  {
    category: '📩 Contact & support',
    items: [
      {
        q: 'Comment contacter l\'équipe AfroTresse ?',
        a: 'Envoie-nous un email à contact@afrotresse.com. Nous répondons dans un délai de 24 à 48 heures.'
      },
      {
        q: 'Je rencontre un bug, que faire ?',
        a: 'Décris le problème par email à contact@afrotresse.com en précisant ton appareil et ce qui s\'est passé. On traite les bugs en priorité.'
      },
      {
        q: 'Comment suggérer un nouveau style de tresse ?',
        a: 'On adore les suggestions ! Envoie-nous ta demande à contact@afrotresse.com avec le nom du style et si possible une photo de référence.'
      },
    ]
  },
]

// Labels courts pour les filtres mobiles
const FILTER_LABELS = {
  '✨ Analyse & styles':       '✨ Styles',
  '💎 Crédits':               '💎 Crédits',
  '🔐 Connexion & compte':    '🔐 Compte',
  '🤝 Parrainage':            '🤝 Parrainage',
  '🔒 Confidentialité & données': '🔒 Données',
  '📩 Contact & support':     '📩 Contact',
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(201,150,58,0.2)', background: open ? 'rgba(201,150,58,0.06)' : 'rgba(255,255,255,0.03)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="font-semibold text-sm leading-snug flex-1" style={{ color: '#FAF4EC' }}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: open ? '#C9963A' : 'rgba(201,150,58,0.2)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke={open ? '#2C1A0E' : '#C9963A'} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4">
              <div className="h-px w-full mb-3" style={{ background: 'rgba(201,150,58,0.15)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(250,244,236,0.7)' }}>
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(null)

  const filtered = activeCategory
    ? FAQ_DATA.filter(c => c.category === activeCategory)
    : FAQ_DATA

  return (
    <div className="min-h-screen pb-28" style={{ background: '#1A0A00' }}>
      <Seo
        title="FAQ — AfroTresse"
        description="Toutes les réponses à tes questions sur AfroTresse : analyse de visage, styles, crédits et confidentialité."
      />
      {/* Header */}
      <div className="pt-14 pb-4 px-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-5"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="font-bold text-3xl" style={{ color: '#C9963A' }}>FAQ</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(250,244,236,0.5)' }}>
          Toutes les réponses à tes questions
        </p>
      </div>

      {/* Filtres catégories — flex wrap responsive */}
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: !activeCategory ? '#C9963A' : 'rgba(201,150,58,0.15)',
            color: !activeCategory ? '#2C1A0E' : '#C9963A',
            border: '1px solid rgba(201,150,58,0.3)'
          }}
        >
          Tout
        </button>
        {FAQ_DATA.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(cat.category === activeCategory ? null : cat.category)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat.category ? '#C9963A' : 'rgba(201,150,58,0.15)',
              color: activeCategory === cat.category ? '#2C1A0E' : '#C9963A',
              border: '1px solid rgba(201,150,58,0.3)'
            }}
          >
            {FILTER_LABELS[cat.category] || cat.category}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="px-5 space-y-6">
        {filtered.map(cat => (
          <div key={cat.category}>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: 'rgba(201,150,58,0.6)' }}>
              {cat.category}
            </h2>
            <div className="space-y-2">
              {cat.items.map(item => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact en bas */}
      <div className="mx-5 mt-8 p-5 rounded-3xl text-center"
        style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: '#FAF4EC' }}>
          Tu n'as pas trouvé ta réponse ? 💬
        </p>
        <p className="text-xs mb-3" style={{ color: 'rgba(250,244,236,0.5)' }}>
          Notre équipe répond en moins de 48h
        </p>
        <a
          href="mailto:contact@afrotresse.com"
          className="inline-block px-6 py-2.5 rounded-full text-sm font-bold"
          style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
        >
          Nous contacter ✉️
        </a>
      </div>

    </div>
  )
}
