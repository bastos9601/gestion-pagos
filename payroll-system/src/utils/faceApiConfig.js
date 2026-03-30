// Configuración y carga de modelos de Face-api.js
import * as faceapi from 'face-api.js'

let modelsLoaded = false

// Configuración
export const FACE_API_CONFIG = {
  minConfidence: 0.7,
  maxDistance: 0.6,
  videoWidth: 640,
  videoHeight: 480,
  detectionInterval: 100,
}

// Cargar modelos de Face-api.js
export const loadFaceApiModels = async () => {
  if (modelsLoaded) return true

  try {
    const MODEL_URL = '/models'
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ])

    modelsLoaded = true
    console.log('✅ Modelos de Face-api.js cargados')
    return true
  } catch (error) {
    console.error('❌ Error al cargar modelos:', error)
    return false
  }
}

// Detectar rostro en imagen
export const detectFace = async (imageElement) => {
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()

  return detection
}

// Comparar dos descriptores faciales
export const compareFaces = (descriptor1, descriptor2) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2)
  return {
    distance,
    match: distance < FACE_API_CONFIG.maxDistance,
    confidence: Math.max(0, (1 - distance) * 100),
  }
}

// Encontrar mejor coincidencia entre descriptores
export const findBestMatch = (targetDescriptor, labeledDescriptors) => {
  let bestMatch = null
  let bestDistance = Infinity

  labeledDescriptors.forEach((labeled) => {
    const distance = faceapi.euclideanDistance(targetDescriptor, labeled.descriptor)
    
    if (distance < bestDistance && distance < FACE_API_CONFIG.maxDistance) {
      bestDistance = distance
      bestMatch = {
        ...labeled,
        distance,
        confidence: Math.max(0, (1 - distance) * 100),
      }
    }
  })

  return bestMatch
}
