// ─────────────────────────────────────────────────────────────────────────────
// Seo.jsx — AfroTresse
// Composant SEO réutilisable — à poser dans chaque page
// ─────────────────────────────────────────────────────────────────────────────
import { Helmet } from "react-helmet-async";

const BASE_URL  = "https://afrotresse.com";
const OG_IMAGE  = `${BASE_URL}/og-image.png`; // 1200x630px — à créer dans /public/

const DEFAULTS = {
  title:       "AfroTresse — Votre Majesté",
  description: "Découvre les tresses faites pour la forme de ton visage. Analyse gratuite, recommandations personnalisées en quelques secondes.",
  image:       OG_IMAGE,
};

/**
 * <Seo
 *   title="Tes résultats — AfroTresse"
 *   description="3 styles de tresses sélectionnés pour toi."
 *   noindex   ← pour les pages privées (results, analyze)
 * />
 */
export default function Seo({ title, description, image, noindex = false }) {
  const t = title       || DEFAULTS.title;
  const d = description || DEFAULTS.description;
  const i = image       || DEFAULTS.image;

  return (
    <Helmet>
      {/* ── Basique ── */}
      <title>{t}</title>
      <meta name="description" content={d} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Open Graph (partage WhatsApp, Facebook) ── */}
      <meta property="og:title"       content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:image"       content={i} />
      <meta property="og:url"         content={BASE_URL} />
      <meta property="og:type"        content="website" />
      <meta property="og:locale"      content="fr_FR" />
      <meta property="og:site_name"   content="AfroTresse" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image"       content={i} />

      {/* ── Mobile / PWA ── */}
      <meta name="theme-color"          content="#2C1A0E" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="AfroTresse" />

      {/* ── Langue ── */}
      <html lang="fr" />
    </Helmet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// USAGE PAR PAGE
// ─────────────────────────────────────────────────────────────────────────────
//
// Home.jsx
// <Seo /> ← valeurs par défaut
//
// Credits.jsx
// <Seo
//   title="Crédits — AfroTresse"
//   description="Découverte, Alliée ou Accès VIP — choisis ton offre et accède à toutes tes recommandations."
// />
//
// Results.jsx / Analyze.jsx  ← pages privées, pas d'indexation
// <Seo title="Tes résultats — AfroTresse" noindex />
//
// Profile.jsx
// <Seo title="Mon profil — AfroTresse" noindex />
