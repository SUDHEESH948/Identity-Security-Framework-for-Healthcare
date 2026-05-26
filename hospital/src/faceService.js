const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";

function getFaceApi() {
  const faceapi = window.faceapi;
  if (!faceapi) {
    throw new Error("face-api.js is not loaded. Please ensure the CDN script is included in index.html.");
  }
  return faceapi;
}

export async function loadFaceModels() {
  const faceapi = getFaceApi();
  if (window.__faceModelsLoaded) {
    return true;
  }

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  window.__faceModelsLoaded = true;
  return true;
}

export async function getFaceDescriptorFromMedia(media) {
  const faceapi = getFaceApi();
  const detection = await faceapi
    .detectSingleFace(media, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ? Array.from(detection.descriptor) : null;
}

export async function getFaceDescriptorFromFile(file) {
  const faceapi = getFaceApi();
  const image = await faceapi.bufferToImage(file);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ? Array.from(detection.descriptor) : null;
}

