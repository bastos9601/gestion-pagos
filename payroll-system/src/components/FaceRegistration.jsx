// Componente para registrar el rostro de un empleado
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import { WebcamCapture } from './WebcamCapture'
import { loadFaceApiModels, detectFace } from '../utils/faceApiConfig'
import '../styles/FaceRegistration.css'

export const FaceRegistration = ({ empleado, onComplete, onCancel }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [currentStep, setCurrentStep] = useState(1)
  const [detectionBox, setDetectionBox] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    initializeFaceApi()
  }, [])

  const initializeFaceApi = async () => {
    setLoading(true)
    const loaded = await loadFaceApiModels()
    if (loaded) {
      setModelsLoaded(true)
      setError(null)
    } else {
      setError('No se pudieron cargar los modelos de reconocimiento facial')
    }
    setLoading(false)
  }

  const handleCapture = async () => {
    if (!modelsLoaded) {
      setError('Los modelos aún no están cargados')
      return
    }

    if (!videoRef.current) {
      setError('La cámara no está lista')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Detectar rostro
      const detection = await detectFace(videoRef.current)

      if (!detection) {
        setError('No se detectó ningún rostro. Por favor, asegúrate de estar frente a la cámara con buena iluminación.')
        setLoading(false)
        return
      }

      // Capturar imagen
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      // Guardar foto y descriptor
      const newPhoto = {
        image: imageData,
        descriptor: Array.from(detection.descriptor),
        box: detection.detection.box,
      }

      setCapturedPhotos([...capturedPhotos, newPhoto])
      setCurrentStep(currentStep + 1)

      if (capturedPhotos.length + 1 >= 3) {
        // Ya tenemos 3 fotos, proceder a guardar
        await saveFaceData([...capturedPhotos, newPhoto])
      }
    } catch (err) {
      console.error('Error al capturar rostro:', err)
      setError('Error al procesar la imagen. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const saveFaceData = async (photos) => {
    setLoading(true)
    try {
      // Promediar los descriptores de las 3 fotos
      const avgDescriptor = averageDescriptors(photos.map(p => p.descriptor))

      // Guardar en base de datos
      const { error: updateError } = await supabase
        .from('empleados')
        .update({
          face_descriptors: avgDescriptor,
          foto_referencia: photos[0].image, // Usar primera foto como referencia
        })
        .eq('id', empleado.id)

      if (updateError) throw updateError

      alert('✅ Rostro registrado exitosamente')
      if (onComplete) onComplete()
    } catch (err) {
      console.error('Error al guardar datos faciales:', err)
      setError('Error al guardar en la base de datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const averageDescriptors = (descriptors) => {
    const avg = new Array(128).fill(0)
    descriptors.forEach(desc => {
      desc.forEach((val, i) => {
        avg[i] += val
      })
    })
    return avg.map(val => val / descriptors.length)
  }

  const handleRetake = () => {
    setCapturedPhotos([])
    setCurrentStep(1)
    setError(null)
  }

  if (loading && !modelsLoaded) {
    return (
      <div className="face-registration-loading">
        <div className="spinner"></div>
        <p>Cargando modelos de reconocimiento facial...</p>
        <small>Esto puede tomar unos segundos la primera vez</small>
      </div>
    )
  }

  return (
    <div className="face-registration">
      <div className="registration-header">
        <h2>📸 Registrar Rostro</h2>
        <p className="employee-name">{empleado.nombre}</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="registration-steps">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${capturedPhotos.length >= 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span>Foto frontal</span>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${capturedPhotos.length >= 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span>Girar izquierda</span>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${capturedPhotos.length >= 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <span>Girar derecha</span>
        </div>
      </div>

      {capturedPhotos.length < 3 ? (
        <>
          <div className="instructions">
            <p>
              {currentStep === 1 && '👤 Mira directamente a la cámara'}
              {currentStep === 2 && '↖️ Gira ligeramente tu cabeza hacia la izquierda'}
              {currentStep === 3 && '↗️ Gira ligeramente tu cabeza hacia la derecha'}
            </p>
          </div>

          <WebcamCapture
            videoRef={videoRef}
            showCaptureButton={true}
            onCapture={handleCapture}
            isDetecting={false}
            detectionBox={detectionBox}
          />

          <div className="captured-preview">
            {capturedPhotos.map((photo, index) => (
              <div key={index} className="preview-item">
                <img src={photo.image} alt={`Captura ${index + 1}`} />
                <span>✓ Foto {index + 1}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="registration-complete">
          <div className="success-icon">✅</div>
          <h3>¡Registro Completado!</h3>
          <p>Se capturaron 3 fotos exitosamente</p>
          <div className="preview-grid">
            {capturedPhotos.map((photo, index) => (
              <img key={index} src={photo.image} alt={`Foto ${index + 1}`} />
            ))}
          </div>
        </div>
      )}

      <div className="registration-actions">
        {capturedPhotos.length > 0 && capturedPhotos.length < 3 && (
          <button onClick={handleRetake} className="btn-secondary" disabled={loading}>
            🔄 Reiniciar
          </button>
        )}
        <button onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
