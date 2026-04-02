// Página de configuración de la empresa
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FirmaCanvas } from '../components/FirmaCanvas'
import '../styles/Configuracion.css'

export const Configuracion = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configuracion, setConfiguracion] = useState(null)
  const [showFirmaCanvas, setShowFirmaCanvas] = useState(false)
  const [firmaDataURL, setFirmaDataURL] = useState(null)
  const [formData, setFormData] = useState({
    nombre_empresa: 'MI EMPRESA S.A.C.',
    ruc: '20XXXXXXXXX',
    direccion: 'Av. Principal 123, Lima - Perú',
    telefono: '',
    email: '',
    firma_url: '',
    hora_entrada_laboral: '08:00',
    hora_salida_laboral: '18:00',
    tolerancia_minutos: 15,
    hora_inicio_almuerzo: '13:00',
    duracion_almuerzo_minutos: 90,
    horas_por_dia: 8,
  })

  useEffect(() => {
    if (user) {
      fetchConfiguracion()
    }
  }, [user])

  const fetchConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_empresa')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setConfiguracion(data)
        setFormData({
          nombre_empresa: data.nombre_empresa,
          ruc: data.ruc,
          direccion: data.direccion,
          telefono: data.telefono || '',
          email: data.email || '',
          firma_url: data.firma_url || '',
          hora_entrada_laboral: data.hora_entrada_laboral?.substring(0, 5) || '08:00',
          hora_salida_laboral: data.hora_salida_laboral?.substring(0, 5) || '18:00',
          tolerancia_minutos: data.tolerancia_minutos || 15,
          hora_inicio_almuerzo: data.hora_inicio_almuerzo?.substring(0, 5) || '13:00',
          duracion_almuerzo_minutos: data.duracion_almuerzo_minutos || 90,
          horas_por_dia: data.horas_por_dia || 8,
        })
        setFirmaDataURL(data.firma_url || null)
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        firma_url: firmaDataURL || formData.firma_url,
      }

      if (configuracion) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('configuracion_empresa')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configuracion.id)

        if (error) throw error
        alert('Configuración actualizada exitosamente')
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('configuracion_empresa')
          .insert([
            {
              ...dataToSave,
              user_id: user.id,
            },
          ])

        if (error) throw error
        alert('Configuración guardada exitosamente')
      }

      fetchConfiguracion()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar configuración: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveFirma = (dataURL) => {
    setFirmaDataURL(dataURL)
    setShowFirmaCanvas(false)
    alert('Firma guardada. No olvides guardar la configuración.')
  }

  const handleDeleteFirma = () => {
    if (confirm('¿Estás seguro de eliminar la firma?')) {
      setFirmaDataURL(null)
      setFormData(prev => ({ ...prev, firma_url: '' }))
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <div className="configuracion-page">
      <h1>⚙️ Configuración de la Empresa</h1>

      <div className="config-info">
        <p>
          📋 Esta información aparecerá en las boletas de pago generadas en PDF.
          Asegúrate de completar todos los campos correctamente.
        </p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Datos de la Empresa</h3>

            <div className="form-group">
              <label>Nombre de la Empresa *</label>
              <input
                type="text"
                name="nombre_empresa"
                value={formData.nombre_empresa}
                onChange={handleChange}
                required
                placeholder="Ej: MI EMPRESA S.A.C."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>RUC *</label>
                <input
                  type="text"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleChange}
                  required
                  maxLength="11"
                  placeholder="20XXXXXXXXX"
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="(01) 123-4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección *</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                placeholder="Av. Principal 123, Lima - Perú"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contacto@empresa.com"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>⏰ Horario Laboral</h3>
            <p className="section-description">
              Configura el horario de trabajo para controlar tardanzas y horas extras
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>Hora de Entrada *</label>
                <input
                  type="time"
                  name="hora_entrada_laboral"
                  value={formData.hora_entrada_laboral}
                  onChange={handleChange}
                  required
                />
                <small>Hora en que los empleados deben ingresar</small>
              </div>

              <div className="form-group">
                <label>Hora de Salida *</label>
                <input
                  type="time"
                  name="hora_salida_laboral"
                  value={formData.hora_salida_laboral}
                  onChange={handleChange}
                  required
                />
                <small>Hora en que los empleados deben salir</small>
              </div>
            </div>

            <div className="form-group">
              <label>Tolerancia para Tardanza (minutos) *</label>
              <input
                type="number"
                name="tolerancia_minutos"
                value={formData.tolerancia_minutos}
                onChange={handleChange}
                required
                min="0"
                max="60"
                placeholder="15"
              />
              <small>
                Minutos de tolerancia antes de marcar como tardanza. 
                Ejemplo: Si la entrada es 08:00 y la tolerancia es 15 min, 
                se considera tardanza después de las 08:15
              </small>
            </div>

            {/* Resumen del Horario - Oculto temporalmente
            <div className="horario-preview">
              <h4>📋 Resumen del Horario:</h4>
              <ul>
                <li>
                  <strong>Entrada:</strong> {formData.hora_entrada_laboral} 
                  (tolerancia hasta {
                    (() => {
                      const [h, m] = formData.hora_entrada_laboral.split(':')
                      const totalMin = parseInt(h) * 60 + parseInt(m) + parseInt(formData.tolerancia_minutos)
                      const newH = Math.floor(totalMin / 60)
                      const newM = totalMin % 60
                      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
                    })()
                  })
                </li>
                <li><strong>Salida:</strong> {formData.hora_salida_laboral}</li>
                <li>
                  <strong>Jornada:</strong> {
                    (() => {
                      const [h1, m1] = formData.hora_entrada_laboral.split(':')
                      const [h2, m2] = formData.hora_salida_laboral.split(':')
                      const totalMin = (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1))
                      const hours = Math.floor(totalMin / 60)
                      const mins = totalMin % 60
                      return `${hours}h ${mins}min`
                    })()
                  }
                </li>
              </ul>
            </div>
            */}
          </div>

          <div className="form-section">
            <h3>🍽️ Horario de Almuerzo</h3>
            <p className="section-description">
              Configura el horario de almuerzo para descontar automáticamente del cálculo de horas trabajadas
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>Hora de Inicio de Almuerzo *</label>
                <input
                  type="time"
                  name="hora_inicio_almuerzo"
                  value={formData.hora_inicio_almuerzo}
                  onChange={handleChange}
                  required
                />
                <small>Hora en que inicia el almuerzo (ej: 13:00 = 1:00 PM)</small>
              </div>

              <div className="form-group">
                <label>Duración del Almuerzo (minutos) *</label>
                <input
                  type="number"
                  name="duracion_almuerzo_minutos"
                  value={formData.duracion_almuerzo_minutos}
                  onChange={handleChange}
                  required
                  min="0"
                  max="180"
                  placeholder="90"
                />
                <small>Minutos de almuerzo (ej: 90 = 1.5 horas)</small>
              </div>
            </div>

            <div className="horario-preview">
              <h4>🍽️ Resumen del Almuerzo:</h4>
              <ul>
                <li>
                  <strong>Inicio:</strong> {formData.hora_inicio_almuerzo}
                </li>
                <li>
                  <strong>Fin:</strong> {
                    (() => {
                      const [h, m] = formData.hora_inicio_almuerzo.split(':')
                      const totalMin = parseInt(h) * 60 + parseInt(m) + parseInt(formData.duracion_almuerzo_minutos)
                      const newH = Math.floor(totalMin / 60)
                      const newM = totalMin % 60
                      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
                    })()
                  }
                </li>
                <li>
                  <strong>Duración:</strong> {
                    (() => {
                      const hours = Math.floor(formData.duracion_almuerzo_minutos / 60)
                      const mins = formData.duracion_almuerzo_minutos % 60
                      return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
                    })()
                  }
                </li>
                <li>
                  <strong>Horas efectivas de trabajo:</strong> {
                    (() => {
                      const [h1, m1] = formData.hora_entrada_laboral.split(':')
                      const [h2, m2] = formData.hora_salida_laboral.split(':')
                      const totalMin = (parseInt(h2) * 60 + parseInt(m2)) - (parseInt(h1) * 60 + parseInt(m1)) - parseInt(formData.duracion_almuerzo_minutos)
                      const hours = Math.floor(totalMin / 60)
                      const mins = totalMin % 60
                      return `${hours}h ${mins}min`
                    })()
                  }
                </li>
              </ul>
            </div>

            <div className="form-group">
              <label>Horas de Trabajo por Día *</label>
              <input
                type="number"
                name="horas_por_dia"
                value={formData.horas_por_dia}
                onChange={handleChange}
                required
                min="1"
                max="24"
                step="0.5"
                placeholder="8"
              />
              <small>
                Horas estándar de trabajo por día (usado para calcular el pago por hora).
                Ejemplo: 8 horas = jornada completa
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>✍️ Firma Digital</h3>
              
            {!showFirmaCanvas && !firmaDataURL && (
              <button 
                type="button" 
                onClick={() => setShowFirmaCanvas(true)}
                className="btn-crear-firma"
              >
                ✍️ Crear Firma Digital
              </button>
            )}

            {showFirmaCanvas && (
              <FirmaCanvas 
                onSave={handleSaveFirma}
                initialSignature={firmaDataURL}
              />
            )}

            {!showFirmaCanvas && firmaDataURL && (
              <div style={{ 
                border: '1px solid #ddd', 
                padding: '15px', 
                borderRadius: '8px', 
                backgroundColor: '#f9f9f9',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Firma guardada:</p>
                <img 
                  src={firmaDataURL} 
                  alt="Firma" 
                  style={{ 
                    maxWidth: '300px', 
                    maxHeight: '100px', 
                    objectFit: 'contain',
                    border: '1px solid #ccc',
                    padding: '5px',
                    backgroundColor: 'white'
                  }}
                />
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowFirmaCanvas(true)}
                    className="btn-editar-firma"
                  >
                    ✏️ Editar Firma
                  </button>
                  <button 
                    type="button" 
                    onClick={handleDeleteFirma}
                    className="btn-eliminar-firma"
                  >
                    🗑️ Eliminar Firma
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : configuracion ? 'Actualizar Configuración' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>

      <div className="preview-section">
        <h3>Vista Previa</h3>
        <div className="preview-card">
          <div className="preview-header">
            <h2>{formData.nombre_empresa}</h2>
            <p>RUC: {formData.ruc}</p>
            <p>{formData.direccion}</p>
            {formData.telefono && <p>Tel: {formData.telefono}</p>}
            {formData.email && <p>Email: {formData.email}</p>}
          </div>
          {firmaDataURL && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Firma del Empleador:</p>
              <img 
                src={firmaDataURL} 
                alt="Firma" 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '80px', 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  padding: '5px'
                }}
              />
            </div>
          )}
          <p className="preview-note">
            Así aparecerá en las boletas de pago
          </p>
        </div>
      </div>
    </div>
  )
}
