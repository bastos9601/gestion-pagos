// Componente para reconocer rostro y marcar asistencia
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import { WebcamCapture } from './WebcamCapture'
import { loadFaceApiModels, detectFace, findBestMatch } from '../utils/faceApiConfig'
import '../styles/FaceRecognition.css'

export const FaceRecognition = ({ onSuccess }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [empleados, setEmpleados] = useState([])
  const [recognizing, setRecognizing] = useState(false)
  const [detectionBox, setDetectionBox] = useState(null)
  const [lastRecognition, setLastRecognition] = useState(null)
  const videoRef = useRef(null)
  const recognitionInterval = useRef(null)
  const isProcessing = useRef(false)

  useEffect(() => {
    initializeSystem()
    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current)
      }
    }
  }, [])

  const initializeSystem = async () => {
    setLoading(true)
    
    // Cargar modelos
    const loaded = await loadFaceApiModels()
    if (!loaded) {
      setError('No se pudieron cargar los modelos de reconocimiento facial')
      setLoading(false)
      return
    }
    setModelsLoaded(true)

    // Cargar empleados con rostros registrados
    await loadEmpleados()
    setLoading(false)
  }

  const loadEmpleados = async () => {
    try {
      // Intentar cargar con filtro activo, si falla cargar todos con face_descriptors
      let query = supabase
        .from('empleados')
        .select('id, nombre, dni, face_descriptors, foto_referencia')
        .not('face_descriptors', 'is', null)

      try {
        const { data, error } = await query.eq('activo', true)
        
        if (error && error.message.includes('column')) {
          // Si la columna activo no existe, cargar todos con face_descriptors
          const { data: allData, error: allError } = await supabase
            .from('empleados')
            .select('id, nombre, dni, face_descriptors, foto_referencia')
            .not('face_descriptors', 'is', null)
          
          if (allError) throw allError
          setEmpleados(allData || [])
        } else if (error) {
          throw error
        } else {
          setEmpleados(data || [])
        }
      } catch (innerErr) {
        // Si hay error, cargar todos con face_descriptors
        const { data: allData, error: allError } = await supabase
          .from('empleados')
          .select('id, nombre, dni, face_descriptors, foto_referencia')
          .not('face_descriptors', 'is', null)
        
        if (allError) throw allError
        setEmpleados(allData || [])
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err)
      setError('Error al cargar empleados: ' + err.message)
    }
  }

  const startRecognition = (videoElement) => {
    if (!modelsLoaded || empleados.length === 0) {
      setError('Sistema no está listo. Verifica que haya empleados registrados.')
      return
    }

    setRecognizing(true)
    setError(null)
    videoRef.current = videoElement

    // Reconocer cada 500ms
    recognitionInterval.current = setInterval(async () => {
      await recognizeFace(videoElement)
    }, 500)
  }

  const stopRecognition = () => {
    setRecognizing(false)
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current)
    }
    setDetectionBox(null)
  }

  const recognizeFace = async (videoElement) => {
    // Evitar múltiples ejecuciones simultáneas
    if (isProcessing.current) return

    try {
      const detection = await detectFace(videoElement)

      if (!detection) {
        setDetectionBox(null)
        return
      }

      // Mostrar caja de detección
      setDetectionBox(detection.detection.box)

      // Buscar coincidencia
      const labeledDescriptors = empleados.map(emp => ({
        id: emp.id,
        nombre: emp.nombre,
        dni: emp.dni,
        descriptor: emp.face_descriptors,
      }))

      const match = findBestMatch(detection.descriptor, labeledDescriptors)

      if (match) {
        // Encontramos una coincidencia - INMEDIATAMENTE marcar como procesando
        if (isProcessing.current) return // Doble verificación
        isProcessing.current = true
        
        // Detener reconocimiento ANTES de procesar
        stopRecognition()
        
        // Procesar el reconocimiento
        await handleRecognizedEmployee(match)
        
        // Resetear después de 5 segundos
        setTimeout(() => {
          isProcessing.current = false
        }, 5000)
      }
    } catch (err) {
      console.error('Error en reconocimiento:', err)
      isProcessing.current = false
    }
  }

  const handleRecognizedEmployee = async (match) => {
    setLoading(true)
    try {
      // Obtener hora actual del sistema (ya debería estar en hora local de Perú)
      const now = new Date()
      
      // Crear fecha en zona horaria de Perú
      const peruFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      
      const parts = peruFormatter.formatToParts(now)
      const peruDate = {
        year: parts.find(p => p.type === 'year').value,
        month: parts.find(p => p.type === 'month').value,
        day: parts.find(p => p.type === 'day').value,
        hour: parts.find(p => p.type === 'hour').value,
        minute: parts.find(p => p.type === 'minute').value,
        second: parts.find(p => p.type === 'second').value,
      }
      
      const today = `${peruDate.year}-${peruDate.month}-${peruDate.day}`
      const currentTime = `${peruDate.hour}:${peruDate.minute}:${peruDate.second}`
      const currentTimestamp = `${today}T${currentTime}`

      console.log('🔍 Verificando asistencia para:', match.nombre)
      console.log('📅 Fecha de hoy (Perú):', today)
      console.log('⏰ Hora actual (Perú):', currentTime)
      console.log('⏰ Timestamp (Perú):', currentTimestamp)

      // Obtener user_id actual
      const { data: { user } } = await supabase.auth.getUser()

      // Verificar si ya marcó hoy - ser más específico con la fecha
      const { data: existingRecords, error: checkError } = await supabase
        .from('asistencias')
        .select('*')
        .eq('empleado_id', match.id)
        .gte('fecha', today)
        .lte('fecha', today)
        .is('hora_salida', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkError) {
        console.error('❌ Error al verificar asistencias:', checkError)
        throw checkError
      }

      console.log('📋 Registros existentes (sin salida):', existingRecords)

      let tipoMarca = 'entrada'
      let asistenciaId = null

      if (existingRecords && existingRecords.length > 0) {
        const lastRecord = existingRecords[0]
        console.log('📝 Último registro:', lastRecord)
        
        if (lastRecord.hora_salida) {
          console.log('⚠️ Ya tiene entrada y salida')
          setError('Ya marcaste entrada y salida hoy')
          setLoading(false)
          return
        }

        // Marcar salida
        console.log('🔴 Marcando SALIDA')
        tipoMarca = 'salida'
        asistenciaId = lastRecord.id

        const entrada = new Date(lastRecord.hora_entrada)
        const salida = new Date(currentTimestamp)
        const horasTrabajadas = (salida - entrada) / (1000 * 60 * 60)

        console.log('⏱️ Horas trabajadas:', horasTrabajadas)

        const { error: updateError } = await supabase
          .from('asistencias')
          .update({
            hora_salida: currentTimestamp,
            horas_trabajadas: horasTrabajadas.toFixed(2),
          })
          .eq('id', asistenciaId)

        if (updateError) {
          console.error('❌ Error al actualizar salida:', updateError)
          throw updateError
        }
        console.log('✅ Salida actualizada correctamente')
      } else {
        // Marcar entrada
        console.log('🟢 Marcando ENTRADA (no hay registros previos)')
        
        // Verificar una vez más antes de insertar (por si acaso)
        const { data: doubleCheck } = await supabase
          .from('asistencias')
          .select('id')
          .eq('empleado_id', match.id)
          .eq('fecha', today)
          .limit(1)
        
        if (doubleCheck && doubleCheck.length > 0) {
          console.log('⚠️ Se detectó un registro creado justo ahora, recargando...')
          setError('Registro detectado, intenta nuevamente')
          setLoading(false)
          if (onSuccess) onSuccess()
          return
        }
        
        const { data: newRecord, error: insertError } = await supabase
          .from('asistencias')
          .insert({
            empleado_id: match.id,
            fecha: today,
            hora_entrada: currentTimestamp,
            confianza_reconocimiento: match.confidence.toFixed(2),
            user_id: user?.id || null,
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error al insertar entrada:', insertError)
          throw insertError
        }
        asistenciaId = newRecord.id
        console.log('✅ Entrada registrada correctamente:', newRecord)
      }

      // Mostrar resultado exitoso
      setLastRecognition({
        nombre: match.nombre,
        dni: match.dni,
        tipo: tipoMarca,
        hora: currentTime,
        confianza: match.confidence.toFixed(1),
      })

      // Limpiar cualquier error previo
      setError(null)

      if (onSuccess) {
        onSuccess()
      }

      // Limpiar después de 5 segundos
      setTimeout(() => {
        setLastRecognition(null)
      }, 5000)

    } catch (err) {
      console.error('❌ Error al marcar asistencia:', err)
      setError('Error al marcar asistencia: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !modelsLoaded) {
    return (
      <div className="face-recognition-loading">
        <div className="spinner"></div>
        <p>Cargando sistema de reconocimiento...</p>
      </div>
    )
  }

  if (empleados.length === 0 && modelsLoaded) {
    return (
      <div className="face-recognition-empty">
        <p>⚠️ No hay empleados con rostro registrado</p>
        <small>Ve a la sección de Empleados para registrar rostros</small>
      </div>
    )
  }

  return (
    <div className="face-recognition">
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {lastRecognition ? (
        <div className="recognition-success">
          <div className="success-icon">✅</div>
          <h2>{lastRecognition.nombre}</h2>
          <p className="dni">DNI: {lastRecognition.dni}</p>
          <div className="marca-info">
            <span className={`marca-tipo ${lastRecognition.tipo}`}>
              {lastRecognition.tipo === 'entrada' ? '🟢 ENTRADA' : '🔴 SALIDA'}
            </span>
            <span className="marca-hora">{lastRecognition.hora}</span>
          </div>
          <p className="confianza">Confianza: {lastRecognition.confianza}%</p>
        </div>
      ) : (
        <>
          <div className="recognition-instructions">
            <h3>👤 Reconocimiento Facial</h3>
            <p>Colócate frente a la cámara para marcar tu asistencia</p>
            <div className="stats">
              <span>📊 {empleados.length} empleados registrados</span>
            </div>
          </div>

          <WebcamCapture
            onCapture={recognizing ? null : startRecognition}
            isDetecting={recognizing}
            detectionBox={detectionBox}
          />

          <div className="recognition-actions">
            {!recognizing ? (
              <button
                onClick={() => startRecognition(videoRef.current)}
                className="btn-start-recognition"
                disabled={loading}
              >
                🎯 Iniciar Reconocimiento
              </button>
            ) : (
              <button
                onClick={stopRecognition}
                className="btn-stop-recognition"
              >
                ⏹️ Detener
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
