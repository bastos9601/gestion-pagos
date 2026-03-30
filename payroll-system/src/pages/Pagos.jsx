// Página de registro de pagos, adelantos y bonos
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { descargarBoletaPDF, enviarBoletaPorWhatsApp } from '../utils/pdfGenerator'
import { BoletaPreview } from '../components/BoletaPreview'
import { useEmpresaConfig } from '../hooks/useEmpresaConfig'
import '../styles/Pagos.css'

export const Pagos = () => {
  const { config } = useEmpresaConfig()
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  const [ultimoPago, setUltimoPago] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [descuentosAdicionales, setDescuentosAdicionales] = useState([])
  const [bonosDelMes, setBonosDelMes] = useState([])
  const [bonosAdicionales, setBonosAdicionales] = useState([])
  const [formData, setFormData] = useState({
    empleado_id: '',
    monto: '',
    tipo: 'pago',
    fecha: new Date().toISOString().split('T')[0],
    dias_trabajados: '',
    horas_trabajadas: '',
    descuentos: '',
    descripcion_descuento: '',
    descripcion: '',
  })

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre, cargo, dni, telefono, sueldo_base')
        .order('nombre')

      if (error) throw error
      setEmpleados(data || [])
    } catch (error) {
      console.error('Error al cargar empleados:', error)
    }
  }

  // Función para calcular adelantos del mes actual
  const calcularAdelantosDelMes = async (empleadoId, fechaPago) => {
    if (!empleadoId || !fechaPago) return 0

    try {
      const fecha = new Date(fechaPago)
      const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().split('T')[0]
      const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('pagos')
        .select('monto')
        .eq('empleado_id', empleadoId)
        .eq('tipo', 'adelanto')
        .gte('fecha', primerDiaMes)
        .lte('fecha', ultimoDiaMes)

      if (error) throw error

      const totalAdelantos = data?.reduce((sum, p) => sum + p.monto, 0) || 0
      return totalAdelantos
    } catch (error) {
      console.error('Error al calcular adelantos:', error)
      return 0
    }
  }

  // Función para calcular bonos del mes actual
  const calcularBonosDelMes = async (empleadoId, fechaPago) => {
    if (!empleadoId || !fechaPago) return 0

    try {
      const fecha = new Date(fechaPago)
      const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString().split('T')[0]
      const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('pagos')
        .select('monto, descripcion')
        .eq('empleado_id', empleadoId)
        .eq('tipo', 'bono')
        .gte('fecha', primerDiaMes)
        .lte('fecha', ultimoDiaMes)

      if (error) throw error

      const totalBonos = data?.reduce((sum, p) => sum + p.monto, 0) || 0
      return { total: totalBonos, bonos: data || [] }
    } catch (error) {
      console.error('Error al calcular bonos:', error)
      return { total: 0, bonos: [] }
    }
  }

  // Función para calcular el monto según días trabajados
  const calcularMonto = (empleadoId, dias, tipo, descuentos = 0, bonos = 0) => {
    if (!empleadoId || !dias || tipo !== 'pago') return ''
    
    const empleado = empleados.find(e => e.id === empleadoId)
    if (!empleado) return ''
    
    // Calcular monto proporcional (asumiendo 30 días al mes)
    const montoProporcional = (empleado.sueldo_base / 30) * parseFloat(dias)
    const montoConDescuentosYBonos = montoProporcional + parseFloat(bonos || 0) - parseFloat(descuentos || 0)
    return montoConDescuentosYBonos.toFixed(2)
  }

  // Agregar descuento adicional
  const agregarDescuento = () => {
    setDescuentosAdicionales([...descuentosAdicionales, { concepto: '', monto: '' }])
  }

  // Eliminar descuento adicional
  const eliminarDescuento = (index) => {
    const nuevosDescuentos = descuentosAdicionales.filter((_, i) => i !== index)
    setDescuentosAdicionales(nuevosDescuentos)
    recalcularDescuentos(nuevosDescuentos, bonosAdicionales)
  }

  // Actualizar descuento adicional
  const actualizarDescuento = (index, field, value) => {
    const nuevosDescuentos = [...descuentosAdicionales]
    nuevosDescuentos[index][field] = value
    setDescuentosAdicionales(nuevosDescuentos)
    recalcularDescuentos(nuevosDescuentos, bonosAdicionales)
  }

  // Agregar bono adicional
  const agregarBono = () => {
    setBonosAdicionales([...bonosAdicionales, { concepto: '', monto: '' }])
  }

  // Eliminar bono adicional
  const eliminarBono = (index) => {
    const nuevosBonos = bonosAdicionales.filter((_, i) => i !== index)
    setBonosAdicionales(nuevosBonos)
    recalcularDescuentos(descuentosAdicionales, nuevosBonos)
  }

  // Actualizar bono adicional
  const actualizarBono = (index, field, value) => {
    const nuevosBonos = [...bonosAdicionales]
    nuevosBonos[index][field] = value
    setBonosAdicionales(nuevosBonos)
    recalcularDescuentos(descuentosAdicionales, nuevosBonos)
  }

  // Recalcular total de descuentos y bonos
  const recalcularDescuentos = async (descuentosAd, bonosAd) => {
    // Calcular adelantos del mes
    let adelantos = 0
    let bonosInfo = { total: 0, bonos: [] }
    
    if (formData.tipo === 'pago' && formData.empleado_id) {
      adelantos = await calcularAdelantosDelMes(formData.empleado_id, formData.fecha)
      bonosInfo = await calcularBonosDelMes(formData.empleado_id, formData.fecha)
      setBonosDelMes(bonosInfo.bonos) // Guardar bonos para mostrar
    }

    // Sumar descuentos adicionales
    const totalDescuentosAdicionales = descuentosAd.reduce((sum, d) => sum + parseFloat(d.monto || 0), 0)
    const totalDescuentos = adelantos + totalDescuentosAdicionales

    // Sumar bonos adicionales
    const totalBonosAdicionales = bonosAd.reduce((sum, b) => sum + parseFloat(b.monto || 0), 0)
    const totalBonos = bonosInfo.total + totalBonosAdicionales

    // Crear descripción de descuentos
    let descripcionDescuentos = ''
    if (adelantos > 0) {
      descripcionDescuentos += `Adelantos del mes: S/. ${adelantos.toFixed(2)}`
    }
    descuentosAd.forEach(d => {
      if (d.concepto && d.monto) {
        if (descripcionDescuentos) descripcionDescuentos += '\n'
        descripcionDescuentos += `${d.concepto}: S/. ${parseFloat(d.monto).toFixed(2)}`
      }
    })

    // Crear descripción de bonos
    let descripcionBonos = ''
    if (bonosInfo.total > 0) {
      bonosInfo.bonos.forEach(b => {
        if (descripcionBonos) descripcionBonos += '\n'
        descripcionBonos += `${b.descripcion || 'Bono'}: S/. ${b.monto.toFixed(2)}`
      })
    }
    bonosAd.forEach(b => {
      if (b.concepto && b.monto) {
        if (descripcionBonos) descripcionBonos += '\n'
        descripcionBonos += `${b.concepto}: S/. ${parseFloat(b.monto).toFixed(2)}`
      }
    })

    // Actualizar form
    const monto = calcularMonto(
      formData.empleado_id, 
      formData.dias_trabajados, 
      formData.tipo, 
      totalDescuentos,
      totalBonos
    )
    
    setFormData({
      ...formData,
      descuentos: totalDescuentos.toString(),
      descripcion_descuento: descripcionDescuentos,
      descripcion: descripcionBonos || formData.descripcion,
      monto: monto || formData.monto
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Usar RPC para evitar problemas de schema cache
      const { data, error } = await supabase.rpc('insertar_pago', {
        p_empleado_id: formData.empleado_id,
        p_monto: parseFloat(formData.monto),
        p_tipo: formData.tipo,
        p_fecha: formData.fecha,
        p_dias_trabajados: formData.dias_trabajados ? parseInt(formData.dias_trabajados) : 0,
        p_horas_trabajadas: formData.horas_trabajadas ? parseFloat(formData.horas_trabajadas) : 0,
        p_descuentos: formData.descuentos ? parseFloat(formData.descuentos) : 0,
        p_descripcion_descuento: formData.descripcion_descuento || null,
        p_descripcion: formData.descripcion || null
      })

      if (error) throw error
      
      // Transformar los datos para que coincidan con el formato esperado
      const pagoData = data && data.length > 0 ? {
        ...data[0],
        empleados: {
          nombre: data[0].empleado_nombre,
          cargo: data[0].empleado_cargo,
          dni: data[0].empleado_dni,
          telefono: data[0].empleado_telefono,
          sueldo_base: data[0].empleado_sueldo_base
        }
      } : null
      
      // Guardar el último pago para mostrar opciones
      setUltimoPago(pagoData)
      
      alert('Pago registrado exitosamente')
      setFormData({
        empleado_id: '',
        monto: '',
        tipo: 'pago',
        fecha: new Date().toISOString().split('T')[0],
        dias_trabajados: '',
        horas_trabajadas: '',
        descuentos: '',
        descripcion_descuento: '',
        descripcion: '',
      })
      setDescuentosAdicionales([]) // Limpiar descuentos adicionales
      setBonosAdicionales([]) // Limpiar bonos adicionales
      setBonosDelMes([]) // Limpiar bonos del mes
    } catch (error) {
      console.error('Error:', error)
      alert('Error al registrar pago: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarBoleta = () => {
    if (!ultimoPago) return
    try {
      descargarBoletaPDF(ultimoPago.empleados, ultimoPago, config)
      alert('Boleta descargada exitosamente')
    } catch (error) {
      console.error('Error al generar boleta:', error)
      alert('Error al generar la boleta')
    }
  }

  const handleEnviarWhatsApp = () => {
    if (!ultimoPago) return
    if (!ultimoPago.empleados?.telefono) {
      alert('El empleado no tiene teléfono registrado')
      return
    }

    try {
      const resultado = enviarBoletaPorWhatsApp(ultimoPago.empleados, ultimoPago, config)
      alert(resultado.mensaje)
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error)
      alert('Error al enviar por WhatsApp')
    }
  }

  const cerrarConfirmacion = () => {
    setUltimoPago(null)
  }

  const handleVerBoleta = () => {
    setShowPreview(true)
  }

  const cerrarPreview = () => {
    setShowPreview(false)
  }

  return (
    <div className="pagos-page">
      {showPreview && ultimoPago && (
        <BoletaPreview
          empleado={ultimoPago.empleados}
          pago={ultimoPago}
          onClose={cerrarPreview}
        />
      )}

      <h1>💰 Registrar Pago</h1>

      {ultimoPago && (
        <div className="confirmacion-pago">
          <div className="confirmacion-header">
            <h3>✅ Pago Registrado Exitosamente</h3>
            <button onClick={cerrarConfirmacion} className="btn-cerrar">✕</button>
          </div>
          <div className="confirmacion-body">
            <p><strong>Empleado:</strong> {ultimoPago.empleados?.nombre}</p>
            <p><strong>Monto:</strong> S/. {ultimoPago.monto.toFixed(2)}</p>
            <p><strong>Tipo:</strong> {ultimoPago.tipo.toUpperCase()}</p>
          </div>
          <div className="confirmacion-actions">
            <button onClick={handleVerBoleta} className="btn-ver-boleta">
              👁️ Ver Boleta
            </button>
            <button onClick={handleDescargarBoleta} className="btn-descargar">
              📄 Descargar PDF
            </button>
            <button 
              onClick={handleEnviarWhatsApp} 
              className="btn-whatsapp-send"
              disabled={!ultimoPago.empleados?.telefono}
            >
              📱 Enviar WhatsApp
            </button>
          </div>
          {!ultimoPago.empleados?.telefono && (
            <p className="warning-text">⚠️ El empleado no tiene teléfono registrado</p>
          )}
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Empleado *</label>
            <select
              value={formData.empleado_id}
              onChange={async (e) => {
                const empleadoId = e.target.value
                
                // Si es tipo pago, calcular adelantos del mes
                let adelantos = 0
                let descripcionDescuento = formData.descripcion_descuento
                
                if (formData.tipo === 'pago' && empleadoId) {
                  adelantos = await calcularAdelantosDelMes(empleadoId, formData.fecha)
                  if (adelantos > 0) {
                    descripcionDescuento = `Adelantos del mes: S/. ${adelantos.toFixed(2)}`
                  }
                }
                
                const descuentosTotal = parseFloat(formData.descuentos || 0) + adelantos
                const monto = calcularMonto(empleadoId, formData.dias_trabajados, formData.tipo, descuentosTotal)
                
                setFormData({ 
                  ...formData, 
                  empleado_id: empleadoId,
                  descuentos: descuentosTotal.toString(),
                  descripcion_descuento: descripcionDescuento,
                  monto: monto || formData.monto
                })
              }}
              required
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} - {emp.cargo} (S/. {emp.sueldo_base.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo *</label>
              <select
                value={formData.tipo}
                onChange={async (e) => {
                  const tipo = e.target.value
                  
                  // Si cambia a tipo pago, calcular adelantos del mes
                  let adelantos = 0
                  let descripcionDescuento = ''
                  
                  if (tipo === 'pago' && formData.empleado_id) {
                    adelantos = await calcularAdelantosDelMes(formData.empleado_id, formData.fecha)
                    if (adelantos > 0) {
                      descripcionDescuento = `Adelantos del mes: S/. ${adelantos.toFixed(2)}`
                    }
                  }
                  
                  const descuentosTotal = parseFloat(formData.descuentos || 0) + adelantos
                  const monto = tipo === 'pago' 
                    ? calcularMonto(formData.empleado_id, formData.dias_trabajados, tipo, descuentosTotal)
                    : ''
                    
                  setFormData({ 
                    ...formData, 
                    tipo: tipo,
                    descuentos: tipo === 'pago' ? descuentosTotal.toString() : formData.descuentos,
                    descripcion_descuento: tipo === 'pago' ? descripcionDescuento : formData.descripcion_descuento,
                    monto: monto || formData.monto
                  })
                }}
                required
              >
                <option value="pago">Pago</option>
                <option value="adelanto">Adelanto</option>
                <option value="bono">Bono</option>
              </select>
            </div>

            <div className="form-group">
              <label>Monto *</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fecha *</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Días Trabajados</label>
              <input
                type="number"
                min="0"
                max="31"
                value={formData.dias_trabajados}
                onChange={(e) => {
                  const dias = e.target.value
                  const horas = dias ? (parseFloat(dias) * 10).toFixed(2) : ''
                  const monto = calcularMonto(formData.empleado_id, dias, formData.tipo, formData.descuentos)
                  setFormData({ 
                    ...formData, 
                    dias_trabajados: dias,
                    horas_trabajadas: horas,
                    monto: monto || formData.monto
                  })
                }}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label>Horas Trabajadas</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.horas_trabajadas}
                onChange={(e) => setFormData({ ...formData, horas_trabajadas: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descuentos Totales</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.descuentos}
              readOnly
              placeholder="0.00"
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Total calculado automáticamente (adelantos + descuentos adicionales)
            </small>
          </div>

          {formData.tipo === 'pago' && (
            <div className="descuentos-adicionales-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ margin: 0, fontWeight: 'bold' }}>Descuentos Adicionales</label>
                <button 
                  type="button" 
                  onClick={agregarDescuento}
                  className="btn-agregar-descuento"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Agregar Descuento
                </button>
              </div>

              {descuentosAdicionales.map((descuento, index) => (
                <div key={index} className="descuento-item" style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr auto',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <input
                    type="text"
                    placeholder="Concepto (ej: Cámara domo malograda)"
                    value={descuento.concepto}
                    onChange={(e) => actualizarDescuento(index, 'concepto', e.target.value)}
                    style={{
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Monto"
                    value={descuento.monto}
                    onChange={(e) => actualizarDescuento(index, 'monto', e.target.value)}
                    style={{
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarDescuento(index)}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          {formData.descuentos && parseFloat(formData.descuentos) > 0 && (
            <div className="form-group">
              <label>Detalle de Descuentos</label>
              <textarea
                value={formData.descripcion_descuento}
                readOnly
                rows="4"
                style={{
                  backgroundColor: '#f3f4f6',
                  cursor: 'not-allowed',
                  whiteSpace: 'pre-line'
                }}
              />
            </div>
          )}

          {bonosDelMes.length > 0 && formData.tipo === 'pago' && (
            <div className="bonos-del-mes-section" style={{
              padding: '15px',
              backgroundColor: '#d1fae5',
              borderRadius: '8px',
              border: '2px solid #10b981',
              marginTop: '15px'
            }}>
              <label style={{ fontWeight: 'bold', color: '#065f46', marginBottom: '10px', display: 'block' }}>
                ✨ Bonos del Mes (se suman automáticamente)
              </label>
              {bonosDelMes.map((bono, index) => (
                <div key={index} style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#374151' }}>{bono.descripcion || 'Bono'}</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                    + S/. {bono.monto.toFixed(2)}
                  </span>
                </div>
              ))}
              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '2px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                color: '#065f46'
              }}>
                <span>TOTAL BONOS:</span>
                <span>+ S/. {bonosDelMes.reduce((sum, b) => sum + b.monto, 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {formData.tipo === 'pago' && (
            <div className="bonos-adicionales-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ margin: 0, fontWeight: 'bold' }}>Bonos Adicionales</label>
                <button 
                  type="button" 
                  onClick={agregarBono}
                  className="btn-agregar-bono"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Agregar Bono
                </button>
              </div>

              {bonosAdicionales.map((bono, index) => (
                <div key={index} className="bono-item" style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr auto',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '15px',
                  backgroundColor: '#d1fae5',
                  borderRadius: '8px',
                  border: '1px solid #10b981'
                }}>
                  <input
                    type="text"
                    placeholder="Concepto (ej: Bono por desempeño)"
                    value={bono.concepto}
                    onChange={(e) => actualizarBono(index, 'concepto', e.target.value)}
                    style={{
                      padding: '10px',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Monto"
                    value={bono.monto}
                    onChange={(e) => actualizarBono(index, 'monto', e.target.value)}
                    style={{
                      padding: '10px',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => eliminarBono(index)}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows="3"
              placeholder="Detalles adicionales..."
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Registrar Pago'}
          </button>
        </form>
      </div>
    </div>
  )
}
