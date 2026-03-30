// Componente para previsualizar la boleta de pago
import { descargarBoletaPDF, enviarBoletaPorWhatsApp } from '../utils/pdfGenerator'
import { useEmpresaConfig } from '../hooks/useEmpresaConfig'
import '../styles/BoletaPreview.css'

export const BoletaPreview = ({ empleado, pago, onClose }) => {
  const { config } = useEmpresaConfig()
  
  if (!empleado || !pago) return null

  // Usar configuración de la empresa
  const nombreEmpresa = config.nombre
  const rucEmpresa = config.ruc
  const direccionEmpresa = config.direccion

  // Calcular periodo
  const fechaPago = new Date(pago.fecha)
  const periodo = fechaPago.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()

  // Días y horas trabajadas
  const diasTrabajados = pago.dias_trabajados || 0
  const horasTrabajadas = pago.horas_trabajadas || 0

  // Cálculos para boleta detallada
  const sueldoBase = empleado.sueldo_base
  const asignacionFamiliar = 0 // Puedes agregar lógica para esto
  
  // Calcular monto bruto basado en días trabajados
  const montoBruto = pago.tipo === 'pago' && diasTrabajados > 0
    ? (sueldoBase / 30) * diasTrabajados
    : sueldoBase
  
  // Parsear bonos desde la descripción
  const bonosArray = []
  let totalBonos = 0
  if (pago.descripcion) {
    const lineasBonos = pago.descripcion.split('\n')
    lineasBonos.forEach(linea => {
      const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
      if (match) {
        const concepto = match[1].trim()
        const monto = parseFloat(match[2].replace(/,/g, ''))
        bonosArray.push({ concepto, monto })
        totalBonos += monto
      }
    })
  }
  
  const totalIngresos = pago.tipo === 'pago' 
    ? montoBruto + asignacionFamiliar + totalBonos
    : pago.monto

  // Parsear descuentos desde la descripción
  const descuentosArray = []
  let totalDescuentos = 0
  if (pago.descripcion_descuento) {
    const lineasDescuentos = pago.descripcion_descuento.split('\n')
    lineasDescuentos.forEach(linea => {
      const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
      if (match) {
        const concepto = match[1].trim()
        const monto = parseFloat(match[2].replace(/,/g, ''))
        descuentosArray.push({ concepto, monto })
        totalDescuentos += monto
      }
    })
  }
  
  const netoAPagar = totalIngresos - totalDescuentos

  const handleDescargar = () => {
    descargarBoletaPDF(empleado, pago, config)
    alert('Boleta descargada exitosamente')
  }

  const handleEnviarWhatsApp = () => {
    if (!empleado.telefono) {
      alert('El empleado no tiene teléfono registrado')
      return
    }
    const resultado = enviarBoletaPorWhatsApp(empleado, pago, config)
    alert(resultado.mensaje)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Vista Previa - Boleta de Pago</h2>
          <button onClick={onClose} className="btn-close-modal">✕</button>
        </div>

        <div className="boleta-preview">
          {/* Encabezado */}
          <div className="boleta-header">
            <h1>{nombreEmpresa}</h1>
            <p>RUC: {rucEmpresa}</p>
            <p>{direccionEmpresa}</p>
            <h2>BOLETA DE PAGO</h2>
          </div>

          {/* Datos del trabajador */}
          <div className="boleta-section">
            <div className="section-title">DATOS DEL TRABAJADOR</div>
            <div className="datos-grid">
              <div className="dato-item">
                <span className="dato-label">APELLIDOS Y NOMBRES:</span>
                <span className="dato-value">{empleado.nombre.toUpperCase()}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">PERIODO:</span>
                <span className="dato-value">{periodo}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">DOCUMENTO DE IDENTIDAD:</span>
                <span className="dato-value">{empleado.dni}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">FECHA DE PAGO:</span>
                <span className="dato-value">{fechaPago.toLocaleDateString('es-PE')}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">CARGO:</span>
                <span className="dato-value">{empleado.cargo.toUpperCase()}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">DÍAS TRABAJADOS:</span>
                <span className="dato-value">{diasTrabajados}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">SUELDO BASE:</span>
                <span className="dato-value">S/. {empleado.sueldo_base.toFixed(2)}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">HORAS TRABAJADAS:</span>
                <span className="dato-value">{horasTrabajadas.toFixed(2)}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">TIPO:</span>
                <span className="dato-value">{pago.tipo.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Tabla de Ingresos */}
          <div className="boleta-section">
            <div className="section-title">DETALLE DE ASISTENCIA</div>
            <div className="datos-grid" style={{ marginBottom: '15px' }}>
              <div className="dato-item">
                <span className="dato-label">DÍAS TRABAJADOS:</span>
                <span className="dato-value">{diasTrabajados} días</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">HORAS TRABAJADAS:</span>
                <span className="dato-value">{horasTrabajadas.toFixed(2)} horas</span>
              </div>
            </div>
            
            <table className="boleta-table">
              <thead>
                <tr>
                  <th>INGRESOS</th>
                  <th>MONTO</th>
                </tr>
              </thead>
              <tbody>
                {pago.tipo === 'pago' && (
                  <>
                    <tr>
                      <td>SUELDO BÁSICO ({diasTrabajados} días trabajados)</td>
                      <td>S/. {montoBruto.toFixed(2)}</td>
                    </tr>
                    {asignacionFamiliar > 0 && (
                      <tr>
                        <td>ASIGNACIÓN FAMILIAR</td>
                        <td>S/. {asignacionFamiliar.toFixed(2)}</td>
                      </tr>
                    )}
                    {bonosArray.map((bono, index) => (
                      <tr key={index}>
                        <td>{bono.concepto.toUpperCase()}</td>
                        <td>S/. {bono.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </>
                )}
                {pago.tipo === 'adelanto' && (
                  <tr>
                    <td>ADELANTO DE SUELDO</td>
                    <td>S/. {pago.monto.toFixed(2)}</td>
                  </tr>
                )}
                {pago.tipo === 'bono' && (
                  <tr>
                    <td>BONIFICACIÓN ESPECIAL</td>
                    <td>S/. {pago.monto.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAL INGRESOS</strong></td>
                  <td><strong>S/. {totalIngresos.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tabla de Descuentos */}
          <div className="boleta-section">
            <table className="boleta-table">
              <thead>
                <tr>
                  <th>DESCUENTOS</th>
                  <th>MONTO</th>
                </tr>
              </thead>
              <tbody>
                {descuentosArray.length > 0 ? (
                  descuentosArray.map((descuento, index) => (
                    <tr key={index}>
                      <td>{descuento.concepto.toUpperCase()}</td>
                      <td>S/. {descuento.monto.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>SIN DESCUENTOS</td>
                    <td>S/. 0.00</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAL DESCUENTOS</strong></td>
                  <td><strong>S/. {totalDescuentos.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Neto a Pagar */}
          <div className="neto-pagar">
            <span>NETO A PAGAR:</span>
            <span className="monto-neto">S/. {netoAPagar.toFixed(2)}</span>
          </div>

          {/* Observaciones */}
          {pago.descripcion && (
            <div className="boleta-section">
              <div className="observaciones">
                <strong>OBSERVACIONES:</strong>
                <p>{pago.descripcion}</p>
              </div>
            </div>
          )}

          {/* Firmas */}
          <div className="firmas-section">
            <div className="firma-box">
              {config.firma_url ? (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <img 
                    src={config.firma_url} 
                    alt="Firma del empleador" 
                    style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="firma-line"></div>
              )}
              <p style={{ textAlign: 'center' }}>FIRMA DEL EMPLEADOR</p>
            </div>
            <div className="firma-box">
              <div className="firma-line"></div>
              <p style={{ textAlign: 'center' }}>FIRMA DEL TRABAJADOR</p>
            </div>
          </div>

          {/* Pie de página */}
          <div className="boleta-footer">
            Documento generado electrónicamente el {new Date().toLocaleDateString('es-PE')} a las {new Date().toLocaleTimeString('es-PE')}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="modal-actions">
          <button onClick={handleDescargar} className="btn-modal btn-download">
            📄 Descargar PDF
          </button>
          <button 
            onClick={handleEnviarWhatsApp} 
            className="btn-modal btn-whatsapp"
            disabled={!empleado.telefono}
          >
            📱 Enviar por WhatsApp
          </button>
          <button onClick={onClose} className="btn-modal btn-cancel">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
