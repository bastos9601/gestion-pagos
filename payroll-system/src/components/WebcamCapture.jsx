// Componente para capturar video de la cámara web
import { useEffect, useRef, useState } from 'react'
import '../styles/WebcamCapture.css'

export const WebcamCapture = ({ onCapture, isDetecting = false, detectionBox = null, autoCapture = false, showCaptureButton = false, videoRef: externalVideoRef }) => {
  const internalVideoRef = useRef(null)
  const videoRef = externalVideoRef || internalVideoRef
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (detectionBox && canvasRef.current && videoRef.current) {
      drawDetectionBox()
    }
  }, [detectionBox])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user',
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        
        // Solo llamar onCapture automáticamente si autoCapture es true
        videoRef.current.onloadedmetadata = () => {
          if (autoCapture && onCapture) {
            onCapture(videoRef.current)
          }
        }
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err)
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const drawDetectionBox = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (detectionBox) {
      const { x, y, width, height } = detectionBox
      
      // Dibujar rectángulo
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      // Dibujar esquinas
      const cornerLength = 20
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 4

      // Esquina superior izquierda
      ctx.beginPath()
      ctx.moveTo(x, y + cornerLength)
      ctx.lineTo(x, y)
      ctx.lineTo(x + cornerLength, y)
      ctx.stroke()

      // Esquina superior derecha
      ctx.beginPath()
      ctx.moveTo(x + width - cornerLength, y)
      ctx.lineTo(x + width, y)
      ctx.lineTo(x + width, y + cornerLength)
      ctx.stroke()

      // Esquina inferior izquierda
      ctx.beginPath()
      ctx.moveTo(x, y + height - cornerLength)
      ctx.lineTo(x, y + height)
      ctx.lineTo(x + cornerLength, y + height)
      ctx.stroke()

      // Esquina inferior derecha
      ctx.beginPath()
      ctx.moveTo(x + width - cornerLength, y + height)
      ctx.lineTo(x + width, y + height)
      ctx.lineTo(x + width, y + height - cornerLength)
      ctx.stroke()
    }
  }

  const handleCapture = () => {
    if (videoRef.current && onCapture) {
      onCapture(videoRef.current)
    }
  }

  if (error) {
    return (
      <div className="webcam-error">
        <p>❌ {error}</p>
        <button onClick={startCamera} className="btn-retry">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="webcam-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
        />
        <canvas ref={canvasRef} className="detection-canvas" />
        
        {isDetecting && (
          <div className="detecting-indicator">
            <div className="pulse"></div>
            <span>Detectando rostro...</span>
          </div>
        )}
      </div>

      {showCaptureButton && (
        <button onClick={handleCapture} className="btn-capture">
          📸 Capturar
        </button>
      )}
    </div>
  )
}
