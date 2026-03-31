// Dashboard administrativo con estadísticas de usuarios
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import '../styles/AdminDashboard.css'

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    suscripcionesActivas: 0,
    suscripcionesPendientes: 0,
    suscripcionesVencidas: 0,
    pagosPendientes: 0,
    ingresosTotal: 0,
    ingresosMes: 0
  })
  const [usuariosRecientes, setUsuariosRecientes] = useState([])
  const [pagosRecientes, setPagosRecientes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Cargar usuarios desde la vista que incluye emails
      const { data: usuarios, error: usuariosError } = await supabase
        .from('vista_usuarios_admin')
        .select('*')
        .order('created_at', { ascending: false })

      if (usuariosError) throw usuariosError

      // Calcular estadísticas
      const hoy = new Date().toISOString().split('T')[0]
      const activas = usuarios.filter(s => 
        s.estado === 'activa' && s.fecha_vencimiento >= hoy
      ).length
      const pendientes = usuarios.filter(s => s.estado === 'pendiente').length
      const vencidas = usuarios.filter(s => 
        s.estado === 'activa' && s.fecha_vencimiento < hoy
      ).length

      // Calcular ingresos
      const ingresosTotal = usuarios
        .filter(s => s.estado === 'activa')
        .reduce((sum, s) => sum + parseFloat(s.monto || 0), 0)

      const primerDiaMes = new Date()
      primerDiaMes.setDate(1)
      const ingresosMes = usuarios
        .filter(s => 
          s.estado === 'activa' && 
          new Date(s.fecha_inicio) >= primerDiaMes
        )
        .reduce((sum, s) => sum + parseFloat(s.monto || 0), 0)

      // Cargar pagos pendientes
      const { data: pagos, error: pagosError } = await supabase
        .from('pagos_yape')
        .select('*')
        .eq('estado', 'pendiente')

      if (pagosError) throw pagosError

      setStats({
        totalUsuarios: usuarios.length,
        suscripcionesActivas: activas,
        suscripcionesPendientes: pendientes,
        suscripcionesVencidas: vencidas,
        pagosPendientes: pagos?.length || 0,
        ingresosTotal,
        ingresosMes
      })

      setUsuariosRecientes(usuarios.slice(0, 5))
      setPagosRecientes(pagos?.slice(0, 5) || [])
    } catch (err) {
      console.error('Error al cargar dashboard:', err)
      alert('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDiasRestantes = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento + 'T00:00:00')
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>📊 Dashboard Administrativo</h1>
          <p>Vista general del sistema de suscripciones</p>
        </div>
        <button onClick={loadDashboardData} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Usuarios</h3>
            <p className="stat-number">{stats.totalUsuarios}</p>
          </div>
        </div>

        <div className="stat-card activas">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Suscripciones Activas</h3>
            <p className="stat-number">{stats.suscripcionesActivas}</p>
          </div>
        </div>

        <div className="stat-card pendientes">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendientes</h3>
            <p className="stat-number">{stats.suscripcionesPendientes}</p>
          </div>
        </div>

        <div className="stat-card vencidas">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Vencidas</h3>
            <p className="stat-number">{stats.suscripcionesVencidas}</p>
          </div>
        </div>

        <div className="stat-card pagos">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <h3>Pagos Pendientes</h3>
            <p className="stat-number">{stats.pagosPendientes}</p>
          </div>
        </div>

        <div className="stat-card ingresos">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Ingresos Total</h3>
            <p className="stat-number">S/ {stats.ingresosTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card ingresos-mes">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Ingresos Este Mes</h3>
            <p className="stat-number">S/ {stats.ingresosMes.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2>⚡ Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            onClick={() => navigate('/admin/usuarios')} 
            className="action-btn usuarios"
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Gestionar Usuarios</span>
          </button>
          <button 
            onClick={() => navigate('/admin/pagos')} 
            className="action-btn pagos"
          >
            <span className="action-icon">💳</span>
            <span className="action-text">Aprobar Pagos</span>
            {stats.pagosPendientes > 0 && (
              <span className="badge-notification">{stats.pagosPendientes}</span>
            )}
          </button>
        </div>
      </div>

      {/* Usuarios recientes */}
      <div className="recent-section">
        <div className="section-header">
          <h2>👤 Usuarios Recientes</h2>
          <button onClick={() => navigate('/admin/usuarios')} className="btn-ver-todos">
            Ver todos →
          </button>
        </div>
        
        {usuariosRecientes.length === 0 ? (
          <div className="empty-state">No hay usuarios registrados</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email / Empresa</th>
                  <th>Estado</th>
                  <th>Fecha Inicio</th>
                  <th>Vencimiento</th>
                  <th>Días Restantes</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {usuariosRecientes.map((usuario) => {
                  const diasRestantes = getDiasRestantes(usuario.fecha_vencimiento)
                  const estaActiva = usuario.estado === 'activa' && diasRestantes > 0

                  return (
                    <tr key={usuario.id}>
                      <td className="email-cell">
                        <div className="user-info-cell">
                          <div className="email">{usuario.email}</div>
                          {usuario.nombre_empresa && (
                            <div className="empresa">🏢 {usuario.nombre_empresa}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-estado ${usuario.estado}`}>
                          {usuario.estado === 'activa' && estaActiva && '✅ Activa'}
                          {usuario.estado === 'activa' && !estaActiva && '⏰ Vencida'}
                          {usuario.estado === 'pendiente' && '⏳ Pendiente'}
                          {usuario.estado === 'cancelada' && '❌ Cancelada'}
                        </span>
                      </td>
                      <td>{formatDate(usuario.fecha_inicio)}</td>
                      <td>{formatDate(usuario.fecha_vencimiento)}</td>
                      <td className={diasRestantes <= 5 ? 'text-warning' : ''}>
                        {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencida'}
                      </td>
                      <td>S/ {parseFloat(usuario.monto).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagos pendientes */}
      {pagosRecientes.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2>💳 Pagos Pendientes de Aprobación</h2>
            <button onClick={() => navigate('/admin/pagos')} className="btn-ver-todos">
              Ver todos →
            </button>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Celular Yape</th>
                  <th>Código Operación</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagosRecientes.map((pago) => (
                  <tr key={pago.id}>
                    <td className="email-cell">{pago.email}</td>
                    <td>{pago.celular_yape}</td>
                    <td className="codigo-cell">{pago.codigo_operacion}</td>
                    <td>S/ {parseFloat(pago.monto).toFixed(2)}</td>
                    <td>{new Date(pago.created_at).toLocaleDateString('es-PE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
