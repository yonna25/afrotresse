/**
 * Détecte la forme du visage à partir des 468 landmarks MediaPipe
 * Indices clés pour les mesures :
 * 10: Top forehead, 152: Chin, 33/263: Left/Right temples, 50/280: Left/Right cheeks
 */

export function detectFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    console.warn('Landmarks invalides, fallback sur oval')
    return 'oval'
  }

  try {
    // Points clés du visage (normalisés en 0-1)
    const forehead = landmarks[10]    // Haut du front
    const chin = landmarks[152]       // Menton
    const leftTemple = landmarks[33]  // Temple gauche
    const rightTemple = landmarks[263] // Temple droit
    const leftCheek = landmarks[50]   // Pommette gauche
    const rightCheek = landmarks[280] // Pommette droite
    const jawLeft = landmarks[234]    // Mâchoire gauche
    const jawRight = landmarks[454]   // Mâchoire droite

    // Calculer les distances
    // Y est inversé dans MediaPipe : chin.y > forehead.y → abs() pour valeur positive
    const faceHeight = Math.abs(chin.y - forehead.y)
    const faceWidth = Math.abs(rightTemple.x - leftTemple.x)
    const jawWidth = Math.abs(jawRight.x - jawLeft.x)
    const cheekWidth = Math.abs(rightCheek.x - leftCheek.x)

    // Calculer les ratios
    const heightWidthRatio = faceHeight / faceWidth
    const jawFaceRatio = jawWidth / faceWidth

    // Déterminer la forme basée sur les ratios
    let shape = 'oval' // Fallback

    if (heightWidthRatio > 1.4) {
      // Visage très allongé
      shape = 'long'
    } else if (jawFaceRatio < 0.7) {
      // Mâchoire fine comparée au visage
      if (heightWidthRatio < 0.85) {
        shape = 'round'
      } else {
        shape = 'heart'
      }
    } else if (jawFaceRatio > 0.9) {
      // Mâchoire proéminente (carrée ou diamant)
      if (cheekWidth > faceWidth * 0.6) {
        shape = 'diamond'
      } else {
        shape = 'square'
      }
    } else if (heightWidthRatio < 0.9) {
      // Visage plus rond
      shape = 'round'
    } else if (heightWidthRatio < 1.05) {
      // Bien équilibré
      shape = 'oval'
    } else {
      // Allongé mais pas extrême
      shape = 'long'
    }

    return shape
  } catch (err) {
    console.error('Erreur détection forme:', err)
    return 'oval' // Fallback sûr
  }
}

/**
 * Confidence score basé sur la stabilité des landmarks
 */
export function calculateConfidence(landmarks) {
  if (!landmarks || landmarks.length === 0) return 0.5

  try {
    // Vérifier la stabilité (landmarks doivent avoir des valeurs sensibles)
    const validPoints = landmarks.filter(
      (p) => p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1 && p.z > -1 && p.z < 1
    )

    const confidence = Math.max(0.5, Math.min(0.95, validPoints.length / landmarks.length))
    return Math.round(confidence * 100) / 100
  } catch {
    return 0.75
  }
}
