// Componente para dibujar firma digital
import { useRef, useState, useEffect } from 'react'
import '../styles/FirmaCanvas.css'

export const FirmaCanvas = ({ onSave, initialSignature }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      setContext(ctx)

      // Cargar firma existente si hay
      if (initialSignature) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = initialSignature
      }
    }
  }, [initialSignature])

  const startDrawing = (e) => {
    if (!context) return
    setIsDrawing(true)
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing || !context) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    if (!context) return
    setIsDrawing(false)
    context.closePath()
  }

  const clearCanvas = () => {
    if (!context) return
    const canvas = canvasRef.current
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    onSave(dataURL)
  }

  // Soporte táctil para móviles
  const handleTouchStart = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    canvasRef.current.dispatchEvent(mouseEvent)
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    })
    canvasRef.current.dispatchEvent(mouseEvent)
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    const mouseEvent = new MouseEvent('mouseup', {})
    canvasRef.current.dispatchEvent(mouseEvent)
  }

  return (
    <div className="firma-canvas-container">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="firma-canvas"
        />
      </div>
      <div className="canvas-actions">
        <button type="button" onClick={clearCanvas} className="btn-clear">
          🗑️ Limpiar
        </button>
        <button type="button" onClick={saveSignature} className="btn-save-firma">
          ✓ Guardar Firma
        </button>
      </div>
      <p className="canvas-hint">
        Dibuja tu firma con el mouse o con el dedo (en dispositivos táctiles)
      </p>
    </div>
  )
}
