// Página principal de Asistencias con reconocimiento facial
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { FaceRecognition } from '../components/FaceRecognition'
import { FaceRegistration } from '../components/FaceRegistration'
import { useEmpresaConfig } from '../hooks/useEmpresaConfig'
import { generarReporteAsistenciasPDF } from '../utils/asistenciasPdfGenerator'
import { Download } from 'lucide-react'
import '../styles/Asistencias.css'

export const Asistencias = () => {
  const [activeTab, setActiveTab] = useState('marcar')
  const [asistencias, setAsistencias] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEmpleado, setSelectedEmpleado] = useState(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [filtroFecha, setFiltroFecha] = useState('hoy')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const { config } = useEmpresaConfig()

  useEffect(() => {
    if (activeTab === 'historial') {
      loadAsistencias()
    } else if (activeTab === 'registrar') {
      loadEmpleados()
    }
  }, [activeTab, filtroFecha, fechaInicio, fechaFin])

  const loadAsistencias = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('asistencias')
        .select(`
          *,
          empleados (nombre, dni)
        `)
        .order('fecha', { ascending: false })
        .order('hora_entrada', { ascending: false })

      // Aplicar filtros de fecha
      const today = new Date().toISOString().split('T')[0]
      
      if (filtroFecha === 'hoy') {
        query = query.eq('fecha', today)
      } else if (filtroFecha === 'semana') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('fecha', weekAgo.toISOString().split('T')[0])
      } else if (filtroFecha === 'mes') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('fecha', monthAgo.toISOString().split('T')[0])
      } else if (filtroFecha === 'personalizado' && fechaInicio && fechaFin) {
        query = query.gte('fecha', fechaInicio).lte('fecha', fechaFin)
      }

      const { data, error } = await query

      if (error) throw error
      setAsistencias(data || [])
    } catch (err) {
      console.error('Error al cargar asistencias:', err)
      alert('Error al cargar asistencias: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadEmpleados = async () => {
    setLoading(true)
    try {
      // Intentar cargar con filtro activo, si falla cargar todos
      let query = supabase
        .from('empleados')
        .select('*')
        .order('nombre')

      // Intentar filtrar por activo si la columna existe
      try {
        const { data, error } = await query.eq('activo', true)
        if (error && error.message.includes('column')) {
          // Si la columna no existe, cargar todos
          const { data: allData, error: allError } = await supabase
            .from('empleados')
            .select('*')
            .order('nombre')
          
          if (allError) throw allError
          setEmpleados(allData || [])
        } else if (error) {
          throw error
        } else {
          setEmpleados(data || [])
        }
      } catch (innerErr) {
        // Si hay error, cargar todos los empleados
        const { data: allData, error: allError } = await supabase
          .from('empleados')
          .select('*')
          .order('nombre')
        
        if (allError) throw allError
        setEmpleados(allData || [])
      }
    } catch (err) {
      console.error('Error al cargar empleados:', err)
      alert('Error al cargar empleados: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrationComplete = () => {
    setShowRegistration(false)
    setSelectedEmpleado(null)
    loadEmpleados()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    // El timestamp está guardado como string en formato YYYY-MM-DDTHH:MM:SS
    // Extraer solo la parte de la hora
    if (timeString.includes('T')) {
      return timeString.split('T')[1].substring(0, 8)
    }
    // Si es solo hora, retornar tal cual
    return timeString.substring(0, 8)
  }

  const getEstadoAsistencia = (asistencia) => {
    if (!asistencia.hora_salida) {
      return { texto: 'En curso', clase: 'en-curso' }
    }
    if (asistencia.horas_trabajadas >= 10) {
      return { texto: 'Completo', clase: 'completo' }
    }
    return { texto: 'Incompleto', clase: 'incompleto' }
  }

  const handleDescargarReporte = () => {
    if (asistencias.length === 0) {
      alert('No hay registros para generar el reporte')
      return
    }
    generarReporteAsistenciasPDF(asistencias, config, filtroFecha)
  }

  const handleDeleteAsistencia = async (asistenciaId, empleadoNombre) => {
    if (!confirm(`¿Estás seguro de eliminar la asistencia de ${empleadoNombre}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('asistencias')
        .delete()
        .eq('id', asistenciaId)

      if (error) throw error

      alert('✅ Asistencia eliminada correctamente')
      loadAsistencias()
    } catch (err) {
      console.error('Error al eliminar asistencia:', err)
      alert('❌ Error al eliminar asistencia: ' + err.message)
    }
  }

  return (
    <div className="asistencias-page">
      <div className="page-header">
        <h1>📅 Asistencias</h1>
        <p>Sistema de control de asistencias con reconocimiento facial</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'marcar' ? 'active' : ''}`}
          onClick={() => setActiveTab('marcar')}
        >
          🎯 Marcar Asistencia
        </button>
        <button
          className={`tab ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          📋 Historial
        </button>
        <button
          className={`tab ${activeTab === 'registrar' ? 'active' : ''}`}
          onClick={() => setActiveTab('registrar')}
        >
          📸 Registrar Rostros
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'marcar' && (
          <div className="marcar-tab">
            <FaceRecognition key="face-recognition" onSuccess={loadAsistencias} />
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="historial-tab">
            <div className="filtros-header">
              <div className="filtros">
                <div className="filtro-group">
                  <label>Período:</label>
                  <select
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  >
                    <option value="hoy">Hoy</option>
                    <option value="semana">Última semana</option>
                    <option value="mes">Último mes</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                {filtroFecha === 'personalizado' && (
                  <>
                    <div className="filtro-group">
                      <label>Desde:</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                      />
                    </div>
                    <div className="filtro-group">
                      <label>Hasta:</label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {asistencias.length > 0 && (
                <button onClick={handleDescargarReporte} className="btn-descargar-reporte">
                  <Download size={18} />
                  Descargar Reporte PDF
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading">Cargando...</div>
            ) : asistencias.length === 0 ? (
              <div className="empty-state">
                <p>📭 No hay registros de asistencia</p>
              </div>
            ) : (
              <>
                {/* Vista de tabla para desktop */}
                <div className="asistencias-table-container desktop-view">
                  <table className="asistencias-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Empleado</th>
                        <th>DNI</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Horas</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.map((asistencia) => {
                        const estado = getEstadoAsistencia(asistencia)
                        return (
                          <tr key={asistencia.id}>
                            <td>{formatDate(asistencia.fecha)}</td>
                            <td>{asistencia.empleados.nombre}</td>
                            <td>{asistencia.empleados.dni}</td>
                            <td className="hora-entrada">
                              {formatTime(asistencia.hora_entrada)}
                            </td>
                            <td className="hora-salida">
                              {formatTime(asistencia.hora_salida)}
                            </td>
                            <td>
                              {asistencia.horas_trabajadas
                                ? `${parseFloat(asistencia.horas_trabajadas).toFixed(1)}h`
                                : '-'}
                            </td>
                            <td>
                              <span className={`estado-badge ${estado.clase}`}>
                                {estado.texto}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleDeleteAsistencia(asistencia.id, asistencia.empleados.nombre)}
                                className="btn-delete-asistencia"
                                title="Eliminar asistencia"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista de tarjetas para móvil */}
                <div className="asistencias-cards mobile-view">
                  {asistencias.map((asistencia) => {
                    const estado = getEstadoAsistencia(asistencia)
                    return (
                      <div key={asistencia.id} className="asistencia-card">
                        <div className="card-header">
                          <div>
                            <h3>{asistencia.empleados.nombre}</h3>
                            <p className="card-dni">DNI: {asistencia.empleados.dni}</p>
                          </div>
                          <span className={`estado-badge ${estado.clase}`}>
                            {estado.texto}
                          </span>
                        </div>
                        
                        <div className="card-body">
                          <div className="card-row">
                            <span className="label">📅 Fecha:</span>
                            <span className="value">{formatDate(asistencia.fecha)}</span>
                          </div>
                          <div className="card-row">
                            <span className="label">🟢 Entrada:</span>
                            <span className="value hora-entrada">{formatTime(asistencia.hora_entrada)}</span>
                          </div>
                          <div className="card-row">
                            <span className="label">🔴 Salida:</span>
                            <span className="value hora-salida">{formatTime(asistencia.hora_salida)}</span>
                          </div>
                          <div className="card-row">
                            <span className="label">⏱️ Horas:</span>
                            <span className="value">
                              {asistencia.horas_trabajadas
                                ? `${parseFloat(asistencia.horas_trabajadas).toFixed(1)}h`
                                : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button
                            onClick={() => handleDeleteAsistencia(asistencia.id, asistencia.empleados.nombre)}
                            className="btn-delete-card"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'registrar' && (
          <div className="registrar-tab">
            {showRegistration && selectedEmpleado ? (
              <FaceRegistration
                empleado={selectedEmpleado}
                onComplete={handleRegistrationComplete}
                onCancel={() => {
                  setShowRegistration(false)
                  setSelectedEmpleado(null)
                }}
              />
            ) : (
              <>
                <div className="registrar-header">
                  <h2>Selecciona un empleado para registrar su rostro</h2>
                  <p>El empleado debe capturar 3 fotos desde diferentes ángulos</p>
                </div>

                {loading ? (
                  <div className="loading">Cargando empleados...</div>
                ) : (
                  <div className="empleados-grid">
                    {empleados.map((empleado) => (
                      <div key={empleado.id} className="empleado-card">
                        <div className="empleado-info">
                          <h3>{empleado.nombre}</h3>
                          <p>DNI: {empleado.dni}</p>
                          {empleado.face_descriptors && (
                            <span className="badge-registrado">✓ Registrado</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEmpleado(empleado)
                            setShowRegistration(true)
                          }}
                          className={empleado.face_descriptors ? 'btn-secondary' : 'btn-primary'}
                        >
                          {empleado.face_descriptors ? '🔄 Re-registrar' : '📸 Registrar'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
