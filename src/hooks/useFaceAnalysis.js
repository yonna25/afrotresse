export async function useFaceAnalysis(photoBlob, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let timeoutId

    console.log('[useFaceAnalysis] Démarrage, timeout:', timeoutMs)

    try {
      // Lazy load MediaPipe - essayer différentes façons d'importer
      import('@mediapipe/face_mesh').then((module) => {
        console.log('[useFaceAnalysis] Module chargé:', Object.keys(module))
        
        // MediaPipe exporte en .default
        const FaceMesh = module.default || module.FaceMesh
        
        if (!FaceMesh) {
          throw new Error('FaceMesh non trouvé dans le module')
        }

        console.log('[useFaceAnalysis] FaceMesh obtenu, type:', typeof FaceMesh)
        const startTime = Date.now()

        // Canvas pour traiter l'image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = 640
        canvas.height = 480

        console.log('[useFaceAnalysis] Canvas créé: 640x480')

        // Charger l'image
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
          console.log('[useFaceAnalysis] Image chargée:', img.width, 'x', img.height)

          // Redimensionner l'image
          const ratio = img.width / img.height
          let w = 640, h = 480, x = 0, y = 0

          if (ratio > 640 / 480) {
            h = 640 / ratio
            y = (480 - h) / 2
          } else {
            w = 480 * ratio
            x = (640 - w) / 2
          }

          ctx.drawImage(img, x, y, w, h)
          console.log('[useFaceAnalysis] Image dessinée sur canvas')

          // Initialiser FaceMesh
          console.log('[useFaceAnalysis] Initialisation FaceMesh...')
          try {
            const faceMesh = new FaceMesh({
              locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
            })

            faceMesh.setOptions({
              maxNumFaces: 1,
              refineLandmarks: true,
              minDetectionConfidence: 0.65,
              minTrackingConfidence: 0.65,
            })

            console.log('[useFaceAnalysis] FaceMesh initialisé')

            // Handler résultats
            let detected = false
            faceMesh.onResults((results) => {
              console.log('[useFaceAnalysis] Résultats reçus', {
                hasLandmarks: !!results.multiFaceLandmarks,
                count: results.multiFaceLandmarks?.length || 0,
              })

              if (!detected && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                detected = true
                if (timeoutId) clearTimeout(timeoutId)

                const landmarks = results.multiFaceLandmarks[0]
                console.log('[useFaceAnalysis] ✅ Visage détecté! Landmarks:', landmarks.length)
                faceMesh.close()

                resolve({
                  landmarks,
                  width: 640,
                  height: 480,
                  confidence: 0.85,
                  processingTime: Date.now() - startTime,
                })
              }
            })

            console.log('[useFaceAnalysis] Envoi de l\'image à FaceMesh...')
            // Envoyer l'image
            faceMesh.send({ image: canvas })

            // Timeout de sécurité
            timeoutId = setTimeout(() => {
              console.error('[useFaceAnalysis] ❌ TIMEOUT après', timeoutMs, 'ms')
              faceMesh.close()
              reject(new Error(`Timeout: MediaPipe n'a pas détecté de visage après ${timeoutMs}ms`))
            }, timeoutMs)
          } catch (initErr) {
            console.error('[useFaceAnalysis] ❌ Erreur initialisation FaceMesh:', initErr)
            reject(new Error(`Erreur FaceMesh: ${initErr.message}`))
          }
        }

        img.onerror = (err) => {
          console.error('[useFaceAnalysis] ❌ Erreur chargement image:', err)
          reject(new Error('Impossible de charger l\'image'))
        }

        console.log('[useFaceAnalysis] Conversion blob en URL...')
        // Convertir blob en URL
        const reader = new FileReader()
        reader.onload = (e) => {
          console.log('[useFaceAnalysis] Blob converti en data URL')
          img.src = e.target.result
        }
        reader.onerror = (err) => {
          console.error('[useFaceAnalysis] ❌ Erreur FileReader:', err)
          reject(new Error('Erreur lecture du fichier'))
        }
        reader.readAsDataURL(photoBlob)
      }).catch((err) => {
        console.error('[useFaceAnalysis] ❌ Erreur import MediaPipe:', err)
        reject(new Error(`Impossible de charger MediaPipe: ${err.message}`))
      })
    } catch (err) {
      console.error('[useFaceAnalysis] ❌ Erreur catch:', err)
      reject(new Error(`Erreur: ${err.message}`))
    }
  })
}
