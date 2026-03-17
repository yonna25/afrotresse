import { fal } from "@fal-ai/client";

export async function generateHairstyle(selfieFile, styleImage) {
  // 1. Upload selfie
  const selfieUrl = await fal.storage.upload(selfieFile);

  // 2. Génération
  const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
    input: {
      image_url: selfieUrl,
      reference_image_url: styleImage,
    },
  });

  return result.data.image.url;
}
