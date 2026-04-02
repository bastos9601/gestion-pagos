// Dashboard - Resumen general del sistema
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/Dashboard.css'

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    totalPagado: 0,
    totalAdelantos: 0,
    totalBonos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'adelantos' o 'bonos'
  const [modalData, setModalData] = useState([])
  const [alertasAsistencia, setAlertasAsistencia] = useState([])
  const [showAlertasModal, setShowAlertasModal] = useState(false)

  useEffect(() => {
    fetchStats()
    verificarAsistenciasHoy()
  }, [])

  const fetchStats = async () => {
    try {
      // Contar empleados
      const { count: empleadosCount } = await supabase
        .from('empleados')
        .select('*', { count: 'exact', head: true })

      // Obtener pagos
      const { data: pagos } = await supabase
        .from('pagos')
        .select('monto, tipo, descripcion')

      const totalPagado = pagos?.filter(p => p.tipo === 'pago').reduce((sum, p) => sum + p.monto, 0) || 0
      const totalAdelantos = pagos?.filter(p => p.tipo === 'adelanto').reduce((sum, p) => sum + p.monto, 0) || 0
      
      // Total Pagado incluye pagos mensuales + adelantos
      const totalPagadoConAdelantos = totalPagado + totalAdelantos
      
      // Calcular bonos: tipo 'bono' + bonos incluidos en pagos mensuales
      let totalBonos = pagos?.filter(p => p.tipo === 'bono').reduce((sum, p) => sum + p.monto, 0) || 0
      
      // Sumar bonos que están en la descripción de pagos mensuales
      pagos?.filter(p => p.tipo === 'pago' && p.descripcion).forEach(pago => {
        const lineasBonos = pago.descripcion.split('\n')
        lineasBonos.forEach(linea => {
          const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
          if (match) {
            const monto = parseFloat(match[2].replace(/,/g, ''))
            totalBonos += monto
          }
        })
      })

      setStats({
        totalEmpleados: empleadosCount || 0,
        totalPagado: totalPagadoConAdelantos,
        totalAdelantos,
        totalBonos,
      })
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarAsistenciasHoy = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Verificando asistencias para:', today)
      
      // Obtener todos los empleados
      const { data: empleados, error: empError } = await supabase
        .from('empleados')
        .select('id, nombre, dni, cargo')
        .order('nombre')

      if (empError) throw empError

      // Obtener asistencias de hoy
      const { data: asistenciasHoy, error: asistError } = await supabase
        .from('asistencias')
        .select('empleado_id, hora_entrada, hora_salida, fecha')
        .eq('fecha', today)

      if (asistError) throw asistError

      console.log('✅ Asistencias de hoy encontradas:', asistenciasHoy?.length || 0)

      // Si no hay asistencias de hoy, buscar las más recientes
      let asistenciasParaVerificar = asistenciasHoy
      
      if (!asistenciasHoy || asistenciasHoy.length === 0) {
        console.log('⚠️ No hay asistencias de hoy, buscando las más recientes...')
        
        // Obtener la fecha más reciente con asistencias
        const { data: ultimaAsistencia } = await supabase
          .from('asistencias')
          .select('fecha')
          .order('fecha', { ascending: false })
          .limit(1)
          .single()
        
        if (ultimaAsistencia) {
          const fechaReciente = ultimaAsistencia.fecha
          console.log('📅 Última fecha con asistencias:', fechaReciente)
          
          // Obtener todas las asistencias de esa fecha
          const { data: asistenciasRecientes } = await supabase
            .from('asistencias')
            .select('empleado_id, hora_entrada, hora_salida, fecha')
            .eq('fecha', fechaReciente)
          
          asistenciasParaVerificar = asistenciasRecientes
        }
      }

      // Crear mapa de asistencias por empleado
      const asistenciasMap = {}
      asistenciasParaVerificar?.forEach(a => {
        asistenciasMap[a.empleado_id] = a
      })

      // Identificar empleados sin asistencia o sin salida
      const alertas = []
      empleados?.forEach(emp => {
        const asistencia = asistenciasMap[emp.id]
        
        if (!asistencia) {
          // No ha marcado entrada
          alertas.push({
            empleado: emp,
            tipo: 'sin_entrada',
            mensaje: 'No ha marcado entrada',
            icono: '🔴',
            color: '#ef4444'
          })
        } else if (!asistencia.hora_salida) {
          // No ha marcado salida
          alertas.push({
            empleado: emp,
            tipo: 'sin_salida',
            mensaje: 'No ha marcado salida',
            icono: '🟡',
            color: '#f59e0b'
          })
        }
      })

      console.log('⚠️ Total de alertas:', alertas.length)
      setAlertasAsistencia(alertas)
    } catch (error) {
      console.error('Error al verificar asistencias:', error)
    }
  }

  const handleShowAdelantos = async () => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*, empleados(nombre, dni)')
        .eq('tipo', 'adelanto')
        .order('fecha', { ascending: false })

      if (error) throw error

      setModalData(data || [])
      setModalType('adelantos')
      setShowModal(true)
    } catch (error) {
      console.error('Error al cargar adelantos:', error)
    }
  }

  const handleShowBonos = async () => {
    try {
      // Obtener bonos tipo 'bono'
      const { data: bonosTipo, error: error1 } = await supabase
        .from('pagos')
        .select('*, empleados(nombre, dni)')
        .eq('tipo', 'bono')
        .order('fecha', { ascending: false })

      if (error1) throw error1

      // Obtener pagos con bonos en descripción
      const { data: pagosConBonos, error: error2 } = await supabase
        .from('pagos')
        .select('*, empleados(nombre, dni)')
        .eq('tipo', 'pago')
        .not('descripcion', 'is', null)
        .order('fecha', { ascending: false })

      if (error2) throw error2

      // Combinar y procesar bonos
      const todosLosBonos = [...(bonosTipo || [])]

      // Agregar bonos de pagos mensuales
      pagosConBonos?.forEach(pago => {
        const lineasBonos = pago.descripcion.split('\n')
        lineasBonos.forEach(linea => {
          const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
          if (match) {
            const concepto = match[1].trim()
            const monto = parseFloat(match[2].replace(/,/g, ''))
            todosLosBonos.push({
              ...pago,
              monto: monto,
              descripcion: concepto,
              esBonoDePago: true
            })
          }
        })
      })

      setModalData(todosLosBonos)
      setModalType('bonos')
      setShowModal(true)
    } catch (error) {
      console.error('Error al cargar bonos:', error)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData([])
    setModalType('')
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {/* Alertas de Asistencia */}
      {alertasAsistencia.length > 0 && (
        <div className="alertas-asistencia">
          <div className="alertas-header">
            <h3>
              ⚠️ Alertas de Asistencia ({alertasAsistencia.length})
            </h3>
            <button 
              onClick={() => setShowAlertasModal(true)}
              className="btn-ver-alertas"
            >
              Ver Detalles
            </button>
          </div>
          <div className="alertas-preview">
            {alertasAsistencia.slice(0, 3).map((alerta, index) => (
              <div key={index} className="alerta-item" style={{ borderLeftColor: alerta.color }}>
                <span className="alerta-icono">{alerta.icono}</span>
                <div className="alerta-info">
                  <strong>{alerta.empleado.nombre}</strong>
                  <span>{alerta.mensaje}</span>
                </div>
              </div>
            ))}
            {alertasAsistencia.length > 3 && (
              <div className="alerta-mas">
                +{alertasAsistencia.length - 3} más
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Empleados</h3>
            <p className="stat-value">{stats.totalEmpleados}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Pagado</h3>
            <p className="stat-value">S/. {stats.totalPagado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={handleShowAdelantos}>
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>Total Adelantos</h3>
            <p className="stat-value">S/. {stats.totalAdelantos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-card clickable" onClick={handleShowBonos}>
          <div className="stat-icon">🎁</div>
          <div className="stat-info">
            <h3>Total Bonos</h3>
            <p className="stat-value">S/. {stats.totalBonos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Sección de Instrucciones */}
      <div className="instrucciones-section">
        <h2>📚 Guía de Uso del Sistema</h2>
        <p className="instrucciones-intro">
          Bienvenido al sistema de gestión de planillas y asistencias. Aquí te explicamos cómo usar cada módulo:
        </p>

        <div className="instrucciones-grid">
          {/* Configuración */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">⚙️</span>
              <h3>1. Configuración Inicial</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Antes de comenzar, configura:</strong></p>
              <ul>
                <li><strong>Datos de la empresa:</strong> Nombre, RUC, dirección</li>
                <li><strong>Horario laboral:</strong> Hora de entrada, salida y tolerancia</li>
                <li><strong>Horario de almuerzo:</strong> Inicio y duración</li>
                <li><strong>Horas por día:</strong> Define cuántas horas tiene una jornada completa</li>
                <li><strong>Firma digital:</strong> Crea tu firma para las boletas</li>
              </ul>
              <p className="instruccion-tip">💡 Estas configuraciones afectan el cálculo de pagos y asistencias</p>
            </div>
          </div>

          {/* Empleados */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">👥</span>
              <h3>2. Gestión de Empleados</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Registra a tus empleados:</strong></p>
              <ul>
                <li>Agrega nombre completo, DNI y teléfono</li>
                <li>Define el cargo y sueldo base mensual</li>
                <li><strong>Importante:</strong> Registra la fecha de contratación</li>
                <li>Puedes editar o eliminar empleados cuando sea necesario</li>
              </ul>
              <p className="instruccion-tip">💡 La fecha de contratación se usa para calcular períodos de pago de 30 días</p>
            </div>
          </div>

          {/* Asistencias */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">📅</span>
              <h3>3. Control de Asistencias</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Sistema de reconocimiento facial:</strong></p>
              <ul>
                <li><strong>Registrar Rostros:</strong> Primero registra el rostro de cada empleado</li>
                <li><strong>Marcar Asistencia:</strong> Los empleados marcan entrada y salida con su rostro</li>
                <li><strong>Historial:</strong> Revisa asistencias por empleado, con días y horas trabajadas</li>
                <li>El sistema detecta tardanzas y horas extras automáticamente</li>
              </ul>
              <p className="instruccion-tip">💡 Las horas se calculan descontando el tiempo de almuerzo configurado</p>
            </div>
          </div>

          {/* Pagos */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">💰</span>
              <h3>4. Registro de Pagos</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Cómo registrar pagos:</strong></p>
              <ul>
                <li>Selecciona el empleado y tipo (Pago, Adelanto o Bono)</li>
                <li>Elige la fecha del pago</li>
                <li><strong>Usa "Desde Asistencias":</strong> Carga automáticamente días y horas del período de 30 días</li>
                <li>El monto se calcula por horas trabajadas según configuración</li>
                <li>Agrega descuentos o bonos adicionales si es necesario</li>
                <li>Genera y descarga la boleta en PDF</li>
              </ul>
              <p className="instruccion-tip">💡 El sistema calcula períodos de 30 días desde la fecha de contratación</p>
            </div>
          </div>

          {/* Cálculo de Pagos */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">🧮</span>
              <h3>5. Cómo se Calculan los Pagos</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Fórmula de cálculo:</strong></p>
              <ul>
                <li><strong>Pago por hora =</strong> Sueldo Base ÷ (30 días × Horas por día)</li>
                <li><strong>Ejemplo:</strong> S/. 1,200 ÷ (30 × 9.5) = S/. 4.21 por hora</li>
                <li><strong>Pago total =</strong> Horas trabajadas × Pago por hora</li>
                <li>Se descuentan adelantos del mes automáticamente</li>
                <li>Se suman bonos si los hay</li>
              </ul>
              <p className="instruccion-tip">💡 Ajusta las "Horas por día" en Configuración según tu jornada laboral</p>
            </div>
          </div>

          {/* Historial */}
          <div className="instruccion-card">
            <div className="instruccion-header">
              <span className="instruccion-icon">📊</span>
              <h3>6. Historial y Reportes</h3>
            </div>
            <div className="instruccion-body">
              <p><strong>Consulta y genera reportes:</strong></p>
              <ul>
                <li><strong>Historial de Pagos:</strong> Ve todos los pagos, adelantos y bonos registrados</li>
                <li><strong>Historial de Asistencias:</strong> Busca por empleado y filtra por período</li>
                <li>Los empleados están agrupados con totales de días y horas</li>
                <li>Descarga reportes en PDF para respaldo</li>
                <li>Envía boletas por WhatsApp directamente</li>
              </ul>
              <p className="instruccion-tip">💡 Usa los filtros para encontrar información específica rápidamente</p>
            </div>
          </div>
        </div>

        {/* Consejos Adicionales */}
        <div className="consejos-section">
          <h3>💡 Consejos para un Mejor Uso</h3>
          <div className="consejos-grid">
            <div className="consejo-item">
              <span className="consejo-icon">✅</span>
              <p><strong>Configura primero:</strong> Completa toda la configuración antes de registrar empleados</p>
            </div>
            <div className="consejo-item">
              <span className="consejo-icon">📸</span>
              <p><strong>Buena iluminación:</strong> Registra rostros con buena luz para mejor reconocimiento</p>
            </div>
            <div className="consejo-item">
              <span className="consejo-icon">🔄</span>
              <p><strong>Revisa diariamente:</strong> Verifica las alertas de asistencia en el Dashboard</p>
            </div>
            <div className="consejo-item">
              <span className="consejo-icon">💾</span>
              <p><strong>Descarga respaldos:</strong> Genera PDFs de boletas y reportes regularmente</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === 'adelantos' ? '⚡ Adelantos Registrados' : '🎁 Bonos Registrados'}</h2>
              <button onClick={closeModal} className="btn-close-modal">✕</button>
            </div>
            <div className="modal-body">
              {modalData.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No hay {modalType} registrados
                </p>
              ) : (
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>DNI</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      {modalType === 'bonos' && <th>Concepto</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.empleados?.nombre}</td>
                        <td>{item.empleados?.dni}</td>
                        <td>{new Date(item.fecha).toLocaleDateString('es-PE')}</td>
                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                          S/. {item.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {modalType === 'bonos' && (
                          <td>{item.esBonoDePago ? item.descripcion : (item.descripcion || 'Bono')}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alertas de Asistencia */}
      {showAlertasModal && (
        <div className="modal-overlay" onClick={() => setShowAlertasModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Alertas de Asistencia</h2>
              <button onClick={() => setShowAlertasModal(false)} className="btn-close-modal">✕</button>
            </div>
            <div className="modal-body">
              {alertasAsistencia.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#10b981', padding: '20px' }}>
                  ✅ Todos los empleados han marcado asistencia correctamente
                </p>
              ) : (
                <div className="alertas-list">
                  {alertasAsistencia.map((alerta, index) => (
                    <div key={index} className="alerta-card" style={{ borderLeftColor: alerta.color }}>
                      <div className="alerta-card-header">
                        <span className="alerta-icono-grande">{alerta.icono}</span>
                        <div>
                          <h4>{alerta.empleado.nombre}</h4>
                          <p className="alerta-cargo">{alerta.empleado.cargo}</p>
                        </div>
                      </div>
                      <div className="alerta-card-body">
                        <p className="alerta-mensaje">{alerta.mensaje}</p>
                        <p className="alerta-dni">DNI: {alerta.empleado.dni}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
