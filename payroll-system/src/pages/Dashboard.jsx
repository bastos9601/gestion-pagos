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

  useEffect(() => {
    fetchStats()
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
    </div>
  )
}
