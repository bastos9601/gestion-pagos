// Página de historial de pagos con filtros
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { descargarBoletaPDF, enviarBoletaPorWhatsApp } from '../utils/pdfGenerator'
import { BoletaPreview } from '../components/BoletaPreview'
import { useEmpresaConfig } from '../hooks/useEmpresaConfig'
import { Eye, FileText, MessageCircle, Trash2, Download } from 'lucide-react'
import '../styles/Historial.css'

export const Historial = () => {
  const { config } = useEmpresaConfig()
  const [pagos, setPagos] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewPago, setPreviewPago] = useState(null)
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState({})
  const [filtros, setFiltros] = useState({
    empleado_id: '',
    tipo: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  useEffect(() => {
    fetchEmpleados()
    fetchPagos()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre')
        .order('nombre')

      if (error) throw error
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
    }
  }

  const fetchPagos = async () => {
    try {
      let query = supabase
        .from('pagos')
        .select(`
          *,
          empleados (nombre, cargo, dni, telefono, sueldo_base)
        `)
        .order('fecha', { ascending: false })

      // Aplicar filtros
      if (filtros.empleado_id) {
        query = query.eq('empleado_id', filtros.empleado_id)
      }
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo)
      }
      if (filtros.fecha_inicio) {
        query = query.gte('fecha', filtros.fecha_inicio)
      }
      if (filtros.fecha_fin) {
        query = query.lte('fecha', filtros.fecha_fin)
      }

      const { data, error } = await query

      if (error) throw error
      setPagos(data || [])
    } catch (error) {
      console.error('Error al cargar pagos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => {
    setLoading(true)
    fetchPagos()
  }

  const limpiarFiltros = () => {
    setFiltros({
      empleado_id: '',
      tipo: '',
      fecha_inicio: '',
      fecha_fin: '',
    })
    setTimeout(() => {
      setLoading(true)
      fetchPagos()
    }, 100)
  }

  const exportarCSV = () => {
    const headers = ['Fecha', 'Empleado', 'Tipo', 'Monto', 'Descripción']
    const rows = pagos.map(p => [
      p.fecha,
      p.empleados?.nombre || 'N/A',
      p.tipo,
      p.monto,
      p.descripcion || ''
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-pagos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleDescargarBoleta = (pago) => {
    try {
      descargarBoletaPDF(pago.empleados, pago, config)
      alert('Boleta descargada exitosamente')
    } catch (error) {
      console.error('Error al generar boleta:', error)
      alert('Error al generar la boleta')
    }
  }

  const handleVerBoleta = (pago) => {
    setPreviewPago(pago)
  }

  const cerrarPreview = () => {
    setPreviewPago(null)
  }

  const handleEnviarWhatsApp = (pago) => {
    if (!pago.empleados?.telefono) {
      alert('El empleado no tiene teléfono registrado')
      return
    }

    try {
      const resultado = enviarBoletaPorWhatsApp(pago.empleados, pago, config)
      alert(resultado.mensaje)
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error)
      alert('Error al enviar por WhatsApp')
    }
  }

  const handleEliminarPago = async (pago) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar este pago?\n\n` +
      `Empleado: ${pago.empleados?.nombre}\n` +
      `Tipo: ${pago.tipo}\n` +
      `Monto: S/. ${pago.monto.toFixed(2)}\n` +
      `Fecha: ${new Date(pago.fecha).toLocaleDateString()}\n\n` +
      `Esta acción no se puede deshacer.`
    )

    if (!confirmar) return

    try {
      const { error } = await supabase
        .from('pagos')
        .delete()
        .eq('id', pago.id)

      if (error) throw error

      alert('Pago eliminado exitosamente')
      fetchPagos() // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar pago:', error)
      alert('Error al eliminar el pago: ' + error.message)
    }
  }

  // Agrupar pagos por empleado
  const agruparPorEmpleado = () => {
    const grupos = {}
    const mesActual = new Date().getMonth()
    const añoActual = new Date().getFullYear()
    
    pagos.forEach(pago => {
      const empleadoId = pago.empleado_id
      if (!grupos[empleadoId]) {
        grupos[empleadoId] = {
          empleado: pago.empleados,
          pagos: [],
          totalPagado: 0,
          totalAdelantos: 0,
          totalBonos: 0,
          cantidadPagos: 0
        }
      }
      grupos[empleadoId].pagos.push(pago)
      
      // Verificar si el pago es del mes actual
      const fechaPago = new Date(pago.fecha)
      const esDelMesActual = fechaPago.getMonth() === mesActual && fechaPago.getFullYear() === añoActual
      
      if (pago.tipo === 'pago') {
        grupos[empleadoId].totalPagado += pago.monto
        grupos[empleadoId].cantidadPagos += 1
      } else if (pago.tipo === 'adelanto' && esDelMesActual) {
        // Solo sumar adelantos del mes actual
        grupos[empleadoId].totalAdelantos += pago.monto
      } else if (pago.tipo === 'bono' && esDelMesActual) {
        // Solo sumar bonos del mes actual
        grupos[empleadoId].totalBonos += pago.monto
      }
    })
    return Object.values(grupos)
  }

  // Manejar expansión/colapso de empleado
  const toggleEmpleado = (empleadoId) => {
    setEmpleadosExpandidos(prev => ({
      ...prev,
      [empleadoId]: !prev[empleadoId]
    }))
  }

  const empleadosAgrupados = agruparPorEmpleado()

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="historial-page">
      {previewPago && (
        <BoletaPreview
          empleado={previewPago.empleados}
          pago={previewPago}
          onClose={cerrarPreview}
        />
      )}

      <div className="page-header">
        <h1>📋 Historial de Pagos</h1>
        <button onClick={exportarCSV} className="btn-export">
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      <div className="filtros-card">
        <h3>Filtros</h3>
        <div className="filtros-grid">
          <div className="form-group">
            <label>Empleado</label>
            <select
              value={filtros.empleado_id}
              onChange={(e) => setFiltros({ ...filtros, empleado_id: e.target.value })}
            >
              <option value="">Todos</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="pago">Pago</option>
              <option value="adelanto">Adelanto</option>
              <option value="bono">Bono</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
            />
          </div>
        </div>

        <div className="filtros-actions">
          <button onClick={handleFiltrar} className="btn-primary">
            Filtrar
          </button>
          <button onClick={limpiarFiltros} className="btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-container">
        {/* Vista de tabla para desktop */}
        <table className="historial-table desktop-view">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Empleado</th>
              <th>Cargo</th>
              <th>Total Pagos</th>
              <th>Total Adelantos</th>
              <th>Total Bonos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosAgrupados.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              empleadosAgrupados.map((grupo) => (
                <>
                  <tr key={`empleado-${grupo.empleado.id}`} className="empleado-row" onClick={() => toggleEmpleado(grupo.empleado.id)}>
                    <td>
                      <button className="btn-toggle">
                        {empleadosExpandidos[grupo.empleado.id] ? '▼' : '▶'}
                      </button>
                    </td>
                    <td><strong>{grupo.empleado.nombre}</strong></td>
                    <td>{grupo.empleado.cargo}</td>
                    <td><strong>S/. {grupo.totalPagado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> ({grupo.cantidadPagos})</td>
                    <td><strong>S/. {grupo.totalAdelantos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></td>
                    <td><strong>S/. {grupo.totalBonos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong></td>
                    <td></td>
                  </tr>
                  {empleadosExpandidos[grupo.empleado.id] && grupo.pagos.map((pago) => (
                    <tr key={pago.id} className="pago-detalle-row">
                      <td></td>
                      <td style={{ paddingLeft: '30px' }}>{new Date(pago.fecha).toLocaleDateString('es-PE')}</td>
                      <td>
                        <span className={`badge badge-${pago.tipo}`}>
                          {pago.tipo}
                        </span>
                      </td>
                      <td>S/. {pago.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td colSpan="2">{pago.descripcion || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleVerBoleta(pago)}
                            className="btn-action btn-view"
                            title="Ver boleta"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDescargarBoleta(pago)}
                            className="btn-action btn-pdf"
                            title="Descargar PDF"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleEnviarWhatsApp(pago)}
                            className="btn-action btn-whatsapp"
                            title="Enviar por WhatsApp"
                            disabled={!pago.empleados?.telefono}
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminarPago(pago)}
                            className="btn-action btn-delete-pago"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>

        {/* Vista de tarjetas para móviles */}
        <div className="pagos-cards mobile-view">
          {empleadosAgrupados.length === 0 ? (
            <div className="empty-state">No hay pagos registrados</div>
          ) : (
            empleadosAgrupados.map((grupo) => (
              <div key={`mobile-${grupo.empleado.id}`} className="empleado-card-group">
                {/* Tarjeta principal del empleado */}
                <div 
                  className="empleado-card-header"
                  onClick={() => toggleEmpleado(grupo.empleado.id)}
                >
                  <div className="empleado-info">
                    <button className="btn-toggle-mobile">
                      {empleadosExpandidos[grupo.empleado.id] ? '▼' : '▶'}
                    </button>
                    <div>
                      <h3>{grupo.empleado.nombre}</h3>
                      <p className="cargo">{grupo.empleado.cargo}</p>
                    </div>
                  </div>
                  <div className="empleado-stats">
                    <div className="stat">
                      <span className="stat-label">Pagos:</span>
                      <span className="stat-value">S/. {grupo.totalPagado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Adelantos:</span>
                      <span className="stat-value">S/. {grupo.totalAdelantos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Pagos individuales (expandibles) */}
                {empleadosExpandidos[grupo.empleado.id] && (
                  <div className="pagos-detalle-mobile">
                    {grupo.pagos.map((pago) => (
                      <div key={pago.id} className="pago-card-detalle">
                        <div className="pago-card-header">
                          <span className="fecha-detalle">{new Date(pago.fecha).toLocaleDateString('es-PE')}</span>
                          <span className={`badge badge-${pago.tipo}`}>
                            {pago.tipo}
                          </span>
                        </div>
                        
                        <div className="pago-card-body">
                          <div className="pago-info">
                            <span className="label">Monto:</span>
                            <span className="value monto">S/. {pago.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          {pago.descripcion && (
                            <div className="pago-info">
                              <span className="label">Descripción:</span>
                              <span className="value">{pago.descripcion}</span>
                            </div>
                          )}
                        </div>

                        <div className="pago-card-actions">
                          <button
                            onClick={() => handleVerBoleta(pago)}
                            className="btn-action btn-view"
                            title="Ver boleta"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDescargarBoleta(pago)}
                            className="btn-action btn-pdf"
                            title="Descargar PDF"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={() => handleEnviarWhatsApp(pago)}
                            className="btn-action btn-whatsapp"
                            title="Enviar por WhatsApp"
                            disabled={!pago.empleados?.telefono}
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminarPago(pago)}
                            className="btn-action btn-delete-pago"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="total-summary">
        <strong>Total mostrado: S/. {pagos.reduce((sum, p) => sum + p.monto, 0).toLocaleString('es-PE')}</strong>
      </div>
    </div>
  )
}
