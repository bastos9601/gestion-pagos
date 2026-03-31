// Panel de administración para aprobar pagos
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/AdminPagos.css'

export const AdminPagos = () => {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('pendiente')

  useEffect(() => {
    loadPagos()
  }, [filtro])

  const loadPagos = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('pagos_yape')
        .select(`
          *,
          suscripciones (*)
        `)
        .order('created_at', { ascending: false })

      if (filtro !== 'todos') {
        query = query.eq('estado', filtro)
      }

      const { data, error } = await query

      if (error) throw error
      setPagos(data || [])
    } catch (err) {
      console.error('Error al cargar pagos:', err)
      alert('Error al cargar pagos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async (pagoId) => {
    if (!confirm('¿Estás seguro de aprobar este pago?')) return

    try {
      // Llamar a la función de Supabase para activar suscripción
      const { error } = await supabase.rpc('activar_suscripcion', {
        pago_id: pagoId
      })

      if (error) throw error

      alert('✅ Pago aprobado y suscripción activada')
      loadPagos()
    } catch (err) {
      console.error('Error al aprobar pago:', err)
      alert('❌ Error al aprobar pago: ' + err.message)
    }
  }

  const handleRechazar = async (pagoId) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    try {
      const { error } = await supabase
        .from('pagos_yape')
        .update({
          estado: 'rechazado',
          notas_admin: motivo
        })
        .eq('id', pagoId)

      if (error) throw error

      alert('❌ Pago rechazado')
      loadPagos()
    } catch (err) {
      console.error('Error al rechazar pago:', err)
      alert('❌ Error al rechazar pago: ' + err.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="admin-pagos-page">
      <div className="page-header">
        <h1>💳 Administración de Pagos</h1>
        <p>Verifica y aprueba los pagos de Yape</p>
      </div>

      <div className="filtros">
        <button
          className={`filtro-btn ${filtro === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('pendiente')}
        >
          ⏳ Pendientes
        </button>
        <button
          className={`filtro-btn ${filtro === 'aprobado' ? 'active' : ''}`}
          onClick={() => setFiltro('aprobado')}
        >
          ✅ Aprobados
        </button>
        <button
          className={`filtro-btn ${filtro === 'rechazado' ? 'active' : ''}`}
          onClick={() => setFiltro('rechazado')}
        >
          ❌ Rechazados
        </button>
        <button
          className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltro('todos')}
        >
          📋 Todos
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando pagos...</div>
      ) : pagos.length === 0 ? (
        <div className="empty-state">
          <p>📭 No hay pagos {filtro !== 'todos' ? filtro + 's' : ''}</p>
        </div>
      ) : (
        <div className="pagos-grid">
          {pagos.map((pago) => (
            <div key={pago.id} className={`pago-card ${pago.estado}`}>
              <div className="pago-header">
                <span className={`estado-badge ${pago.estado}`}>
                  {pago.estado === 'pendiente' && '⏳ Pendiente'}
                  {pago.estado === 'aprobado' && '✅ Aprobado'}
                  {pago.estado === 'rechazado' && '❌ Rechazado'}
                </span>
                <span className="fecha">{formatDate(pago.created_at)}</span>
              </div>

              <div className="pago-body">
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{pago.email_usuario}</span>
                </div>
                <div className="info-row">
                  <span className="label">Celular Yape:</span>
                  <span className="value celular">{pago.celular_yape}</span>
                </div>
                <div className="info-row">
                  <span className="label">Código Operación:</span>
                  <span className="value codigo">{pago.codigo_operacion}</span>
                </div>
                <div className="info-row">
                  <span className="label">Monto:</span>
                  <span className="value monto">S/ {parseFloat(pago.monto).toFixed(2)}</span>
                </div>

                {pago.notas_admin && (
                  <div className="notas-admin">
                    <strong>Notas:</strong>
                    <p>{pago.notas_admin}</p>
                  </div>
                )}

                {pago.fecha_aprobacion && (
                  <div className="info-row">
                    <span className="label">Aprobado:</span>
                    <span className="value">{formatDate(pago.fecha_aprobacion)}</span>
                  </div>
                )}
              </div>

              {pago.estado === 'pendiente' && (
                <div className="pago-actions">
                  <button
                    onClick={() => handleAprobar(pago.id)}
                    className="btn-aprobar"
                  >
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() => handleRechazar(pago.id)}
                    className="btn-rechazar"
                  >
                    ❌ Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
