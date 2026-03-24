export async function useFaceAnalysis(photoBlob, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let timeoutId

    try {
      // Lazy load MediaPipe
      import('@mediapipe/face_mesh').then(({ FaceMesh }) => {
        const startTime = Date.now()

        // Canvas pour traiter l'image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = 640
        canvas.height = 480

        // Charger l'image
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
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

          // Initialiser FaceMesh
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

          // Handler résultats
          let detected = false
          faceMesh.onResults((results) => {
            if (!detected && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              detected = true
              if (timeoutId) clearTimeout(timeoutId)

              const landmarks = results.multiFaceLandmarks[0]
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

          // Envoyer l'image
          faceMesh.send({ image: canvas })

          // Timeout de sécurité
          timeoutId = setTimeout(() => {
            faceMesh.close()
            reject(new Error(`Timeout: MediaPipe n'a pas détecté de visage après ${timeoutMs}ms`))
          }, timeoutMs)
        }

        img.onerror = () => {
          reject(new Error('Impossible de charger l\'image'))
        }

        // Convertir blob en URL
        const reader = new FileReader()
        reader.onload = (e) => {
          img.src = e.target.result
        }
        reader.onerror = () => {
          reject(new Error('Erreur lecture du fichier'))
        }
        reader.readAsDataURL(photoBlob)
      }).catch((err) => {
        reject(new Error(`Impossible de charger MediaPipe: ${err.message}`))
      })
    } catch (err) {
      reject(new Error(`Erreur: ${err.message}`))
    }
  })
}
