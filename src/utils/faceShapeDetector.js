/**
 * Détecte la forme du visage à partir des 468 landmarks MediaPipe
 * Indices clés pour les mesures :
 * 10: Top forehead, 152: Chin, 33/263: Left/Right temples, 50/280: Left/Right cheeks
 */

export function detectFaceShape(landmarks) {
  // Sécurité renforcée : MediaPipe peut parfois renvoyer des tableaux vides
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length < 468) {
    console.warn('Landmarks invalides ou incomplets, fallback sur oval');
    return 'oval';
  }

  try {
    // Vérification que les points critiques existent bien dans l'objet
    const getPoint = (index) => landmarks[index] || { x: 0.5, y: 0.5, z: 0 };

    // Points clés du visage (normalisés en 0-1)
    const forehead = getPoint(10);    // Haut du front
    const chin = getPoint(152);       // Menton
    const leftTemple = getPoint(33);  // Temple gauche
    const rightTemple = getPoint(263); // Temple droit
    const leftCheek = getPoint(50);   // Pommette gauche
    const rightCheek = getPoint(280); // Pommette droite
    const jawLeft = getPoint(234);    // Mâchoire gauche
    const jawRight = getPoint(454);   // Mâchoire droite

    // Calculer les distances (Y est inversé dans MediaPipe)
    const faceHeight = Math.abs(chin.y - forehead.y);
    const faceWidth = Math.abs(rightTemple.x - leftTemple.x);
    const jawWidth = Math.abs(jawRight.x - jawLeft.x);
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x);

    // Éviter la division par zéro si le visage est mal détecté
    if (faceWidth === 0) return 'oval';

    // Calculer les ratios
    const heightWidthRatio = faceHeight / faceWidth;
    const jawFaceRatio = jawWidth / faceWidth;

    // Déterminer la forme basée sur les ratios
    if (heightWidthRatio > 1.35) return 'long';
    if (heightWidthRatio < 1.05) return 'round';
    if (jawFaceRatio < 0.75) return 'heart';
    
    if (jawFaceRatio > 0.9) {
      return cheekWidth > (faceWidth * 0.6) ? 'diamond' : 'square';
    }

    return (heightWidthRatio < 1.2) ? 'oval' : 'long';

  } catch (err) {
    console.error('Erreur mathématique détection forme:', err);
    return 'oval'; 
  }
}

/**
 * Confidence score basé sur la stabilité des landmarks
 */
export function calculateConfidence(landmarks) {
  if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) return 0.5;

  try {
    // Un point est considéré valide s'il est dans le cadre 0-1
    const validPoints = landmarks.filter(
      (p) => p && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
    );

    const ratio = validPoints.length / landmarks.length;
    // On arrondit pour éviter les nombres flottants infinis
    return Math.round(Math.max(0.5, Math.min(0.95, ratio)) * 100) / 100;
  } catch {
    return 0.75;
  }
}
