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
  const [detectionBox, setDetectionBox] = useState(null)
  const [lastRecognition, setLastRecognition] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const isProcessing = useRef(false)
  const lastRecognitionTime = useRef(0)

  useEffect(() => {
    initializeSystem()
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

    videoRef.current = videoElement
    setCameraReady(true)
  }

  const handleCapture = async () => {
    if (!cameraReady || !videoRef.current) {
      setError('La cámara no está lista')
      return
    }

    if (isProcessing.current) {
      console.log('⏸️ Ya hay un procesamiento en curso')
      return
    }

    // Evitar capturas muy seguidas
    const now = Date.now()
    if (now - lastRecognitionTime.current < 3000) {
      setError('Espera unos segundos antes de capturar nuevamente')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const detection = await detectFace(videoRef.current)

      if (!detection) {
        setError('No se detectó ningún rostro. Asegúrate de estar frente a la cámara con buena iluminación.')
        setLoading(false)
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

      if (!match) {
        setError('No se reconoció el rostro. Asegúrate de estar registrado en el sistema.')
        setLoading(false)
        return
      }

      console.log('✅ ROSTRO RECONOCIDO:', match.nombre)
      console.log('🔒 BLOQUEANDO SISTEMA...')
      
      // BLOQUEAR
      isProcessing.current = true
      lastRecognitionTime.current = now
      
      // ESPERAR 500ms para asegurar que no hay llamadas en cola
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Procesar el reconocimiento
      await handleRecognizedEmployee(match)
      
      // Resetear después de 5 segundos
      setTimeout(() => {
        console.log('🔓 Desbloqueando sistema...')
        isProcessing.current = false
      }, 5000)

    } catch (err) {
      console.error('Error en reconocimiento:', err)
      setError('Error al procesar la imagen. Intenta de nuevo.')
      isProcessing.current = false
    } finally {
      setLoading(false)
    }
  }

  const stopRecognition = () => {
    setDetectionBox(null)
  }

  const handleRecognizedEmployee = async (match) => {
    const callTime = new Date().toISOString()
    console.log('🔒 PROCESANDO ASISTENCIA PARA:', match.nombre, 'HORA:', callTime)
    console.log('📊 Estado isProcessing:', isProcessing.current)
    
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

      // Obtener user_id actual
      const { data: { user } } = await supabase.auth.getUser()

      // Obtener configuración de horarios
      const { data: configData } = await supabase
        .from('configuracion_empresa')
        .select('hora_entrada_laboral, hora_salida_laboral, tolerancia_minutos, hora_inicio_almuerzo, duracion_almuerzo_minutos')
        .eq('user_id', user?.id)
        .single()

      const horaEntradaLaboral = configData?.hora_entrada_laboral || '08:00:00'
      const horaSalidaLaboral = configData?.hora_salida_laboral || '18:00:00'
      const toleranciaMinutos = configData?.tolerancia_minutos || 15
      const duracionAlmuerzoMinutos = configData?.duracion_almuerzo_minutos || 0

      console.log('⏰ Horario configurado:', { horaEntradaLaboral, horaSalidaLaboral, toleranciaMinutos, duracionAlmuerzoMinutos })

      // Verificar si ya marcó hoy
      const { data: existingRecords, error: checkError } = await supabase
        .from('asistencias')
        .select('*')
        .eq('empleado_id', match.id)
        .eq('fecha', today)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkError) {
        console.error('❌ Error al verificar asistencias:', checkError)
        throw checkError
      }

      console.log('📋 Registros de hoy:', existingRecords)

      let tipoMarca = 'entrada'
      let asistenciaId = null

      if (existingRecords && existingRecords.length > 0) {
        const lastRecord = existingRecords[0]
        console.log('📝 Último registro:', lastRecord)
        
        // Si ya tiene hora de salida, no puede marcar más
        if (lastRecord.hora_salida) {
          console.log('⚠️ Ya tiene entrada y salida registradas hoy')
          setError(`Ya marcaste entrada (${new Date(lastRecord.hora_entrada).toLocaleTimeString('es-PE')}) y salida (${new Date(lastRecord.hora_salida).toLocaleTimeString('es-PE')}) hoy`)
          setLoading(false)
          return
        }

        // Si tiene entrada pero NO tiene salida, marcar salida
        if (lastRecord.hora_entrada && !lastRecord.hora_salida) {
          console.log('🔴 Marcando SALIDA')
          tipoMarca = 'salida'
          asistenciaId = lastRecord.id

          const entrada = new Date(lastRecord.hora_entrada)
          const salida = new Date(currentTimestamp)
          
          // Calcular horas brutas
          const horasBrutas = (salida - entrada) / (1000 * 60 * 60)
          
          // Descontar tiempo de almuerzo (convertir minutos a horas)
          const horasAlmuerzo = duracionAlmuerzoMinutos / 60
          const horasTrabajadas = Math.max(0, horasBrutas - horasAlmuerzo)

          // Calcular estado de salida y horas extras
          const horaSalidaActual = `${peruDate.hour}:${peruDate.minute}:00`
          const { estadoSalida, horasExtras } = calcularEstadoSalida(horaSalidaActual, horaSalidaLaboral)

          console.log('⏱️ Horas brutas:', horasBrutas.toFixed(2))
          console.log('🍽️ Horas almuerzo:', horasAlmuerzo.toFixed(2))
          console.log('⏱️ Horas trabajadas (netas):', horasTrabajadas.toFixed(2))
          console.log('📊 Estado salida:', estadoSalida, 'Horas extras:', horasExtras)

          const { error: updateError } = await supabase
            .from('asistencias')
            .update({
              hora_salida: currentTimestamp,
              horas_trabajadas: horasTrabajadas.toFixed(2),
              estado_salida: estadoSalida,
              horas_extras: horasExtras,
            })
            .eq('id', asistenciaId)

          if (updateError) {
            console.error('❌ Error al actualizar salida:', updateError)
            throw updateError
          }
          console.log('✅ Salida actualizada correctamente')
        }
      } else {
        // No hay registros de hoy, marcar entrada
        console.log('🟢 Marcando ENTRADA (primer registro del día)')
        
        // Calcular estado de entrada y minutos de tardanza
        const horaEntradaActual = `${peruDate.hour}:${peruDate.minute}:00`
        const { estadoEntrada, minutosTardanza } = calcularEstadoEntrada(
          horaEntradaActual, 
          horaEntradaLaboral, 
          toleranciaMinutos
        )

        console.log('📊 Estado entrada:', estadoEntrada, 'Minutos tardanza:', minutosTardanza)

        const { data: newRecord, error: insertError } = await supabase
          .from('asistencias')
          .insert({
            empleado_id: match.id,
            fecha: today,
            hora_entrada: currentTimestamp,
            confianza_reconocimiento: match.confidence.toFixed(2),
            user_id: user?.id || null,
            estado_entrada: estadoEntrada,
            minutos_tardanza: minutosTardanza,
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

  // Función para calcular estado de entrada
  const calcularEstadoEntrada = (horaActual, horaLaboral, tolerancia) => {
    const [hActual, mActual] = horaActual.split(':').map(Number)
    const [hLaboral, mLaboral] = horaLaboral.split(':').map(Number)
    
    const minutosActual = hActual * 60 + mActual
    const minutosLaboral = hLaboral * 60 + mLaboral
    const diferencia = minutosActual - minutosLaboral

    if (diferencia <= tolerancia) {
      return { estadoEntrada: 'a_tiempo', minutosTardanza: Math.max(0, diferencia) }
    } else {
      return { estadoEntrada: 'tardanza', minutosTardanza: diferencia }
    }
  }

  // Función para calcular estado de salida
  const calcularEstadoSalida = (horaActual, horaLaboral) => {
    const [hActual, mActual] = horaActual.split(':').map(Number)
    const [hLaboral, mLaboral] = horaLaboral.split(':').map(Number)
    
    const minutosActual = hActual * 60 + mActual
    const minutosLaboral = hLaboral * 60 + mLaboral
    const diferencia = minutosActual - minutosLaboral

    if (diferencia < -30) {
      // Salió más de 30 minutos antes
      return { estadoSalida: 'temprano', horasExtras: 0 }
    } else if (diferencia > 30) {
      // Horas extras (más de 30 minutos después)
      const horasExtras = diferencia / 60
      return { estadoSalida: 'horas_extras', horasExtras: parseFloat(horasExtras.toFixed(2)) }
    } else {
      // Normal
      return { estadoSalida: 'normal', horasExtras: 0 }
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
            <p>Colócate frente a la cámara y presiona el botón para marcar tu asistencia</p>
            <div className="stats">
              <span>📊 {empleados.length} empleados registrados</span>
              {cameraReady && <span className="status-ready">📹 Cámara lista</span>}
            </div>
          </div>

          <WebcamCapture
            videoRef={videoRef}
            onCapture={startRecognition}
            autoCapture={true}
            showCaptureButton={false}
            isDetecting={false}
            detectionBox={detectionBox}
          />

          {cameraReady && !loading && (
            <button 
              onClick={handleCapture} 
              className="btn-capturar-asistencia"
              disabled={loading || isProcessing.current}
            >
              📸  Marcar Asistencia
            </button>
          )}

          {loading && (
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Procesando reconocimiento...</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
