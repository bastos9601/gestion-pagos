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
