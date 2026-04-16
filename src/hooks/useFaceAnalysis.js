export async function analyzeFaceWithAI(photoData, timeoutMs = 10000) {
  return new Promise(async (resolve, reject) => {
    try {
      let file;

      if (photoData instanceof Blob) {
        file = photoData;
      } else if (typeof photoData === "string") {
        const res = await fetch(photoData);
        file = await res.blob();
      } else {
        return reject(new Error("Format image non supporté"));
      }

      const faceShape = await detectFaceShapeLocal(file);

      if (!faceShape) {
        return reject(new Error("Impossible de détecter le visage"));
      }

      const timer = setTimeout(() => {
        reject(new Error("Timeout API analyse"));
      }, timeoutMs);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ faceShape }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return reject(err);
      }

      const data = await response.json();

      resolve({
        faceShape: data.faceShape,
        faceShapeName: data.faceShapeName,
        confidence: data.confidence,
        recommendations: data.recommendations,
      });

    } catch (err) {
      reject(err);
    }
  });
}

/**
 * FIX MEDIA PIPE VERCEL (PRODUCTION SAFE)
 */
async function detectFaceShapeLocal(photoBlob) {
  try {
    const module = await import("@mediapipe/face_mesh");

    // 🔴 FIX CRITIQUE VITE + MEDIA PIPE
    const FaceMesh =
      module.FaceMesh || module.default?.FaceMesh || window.FaceMesh;

    if (!FaceMesh) {
      throw new Error("FaceMesh introuvable (import échoué)");
    }

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const img = new Image();
    img.src = URL.createObjectURL(photoBlob);

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          faceMesh.onResults((results) => {
            if (
              !results.multiFaceLandmarks ||
              results.multiFaceLandmarks.length === 0
            ) {
              resolve(null);
              return;
            }

            const landmarks = results.multiFaceLandmarks[0];
            const shape = calculateFaceShape(landmarks);

            resolve(shape);
          });

          await faceMesh.send({ image: img });
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(img.src);
        }
      };

      img.onerror = () => {
        reject(new Error("Erreur chargement image"));
      };
    });

  } catch (err) {
    console.error("MediaPipe error FIXED:", err);
    throw err;
  }
}

/**
 * CALCUL FACE SHAPE
 */
function calculateFaceShape(landmarks) {
  if (!landmarks || landmarks.length < 10) return null;

  const forehead = landmarks[10];
  const chin = landmarks[152];
  const left = landmarks[234];
  const right = landmarks[454];
  const jawLeft = landmarks[205];
  const jawRight = landmarks[425];

  const faceHeight = Math.abs(chin.y - forehead.y);
  const faceWidth = Math.abs(right.x - left.x);
  const jawWidth = Math.abs(jawRight.x - jawLeft.x);

  const ratio = faceHeight / faceWidth;

  if (ratio > 1.4) return "long";
  if (ratio < 0.85) return "round";
  if (Math.abs(jawWidth - faceWidth) < 0.1) return "square";
  if (forehead.y > chin.y * 0.8) return "heart";
  if (ratio > 1.1) return "diamond";

  return "oval";
}
