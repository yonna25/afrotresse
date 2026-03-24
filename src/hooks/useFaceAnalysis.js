import { useEffect, useRef } from 'react'

export async function useFaceAnalysis(photoBlob, timeoutMs = 8000) {
  try {
    // Lazy load MediaPipe pour perf au démarrage
    const FaceMesh = (await import('@mediapipe/face_mesh')).FaceMesh
    const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils')

    return new Promise((resolve, reject) => {
      let timeoutId
      const startTime = Date.now()

      // Créer canvas pour MediaPipe
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Créer image à partir du blob
      const img = new Image()
      img.onload = () => {
        canvas.width = 640
        canvas.height = 480

        // Redimensionner et centrer l'image
        const aspectRatio = img.width / img.height
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0

        if (aspectRatio > 640 / 480) {
          drawWidth = 640
          drawHeight = 640 / aspectRatio
          offsetY = (480 - drawHeight) / 2
        } else {
          drawHeight = 480
          drawWidth = 480 * aspectRatio
          offsetX = (640 - drawWidth) / 2
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

        // Initialiser MediaPipe
        const faceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        })

        faceMesh.onResults((results) => {
          const elapsed = Date.now() - startTime

          // Annuler le timeout si détection OK
          if (timeoutId) clearTimeout(timeoutId)

          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0]
            resolve({
              landmarks,
              width: canvas.width,
              height: canvas.height,
              confidence: results.multiFaceDetections?.[0]?.detectionScore || 0.85,
              processingTime: elapsed,
            })
          } else {
            reject(new Error('Aucun visage détecté'))
          }
        })

        // Process image
        faceMesh.send({ image: canvas })

        // Timeout fallback
        timeoutId = setTimeout(() => {
          faceMesh.close()
          reject(new Error(`Timeout après ${timeoutMs}ms`))
        }, timeoutMs)
      }

      img.onerror = () => reject(new Error('Erreur chargement image'))

      // Charger image
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Erreur FileReader'))
      reader.readAsDataURL(photoBlob)
    })
  } catch (err) {
    throw new Error(`MediaPipe error: ${err.message}`)
  }
}
