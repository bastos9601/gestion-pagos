// Configuración del sistema para administradores
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/AdminConfiguracion.css'

export const AdminConfiguracion = () => {
  const [whatsappNumero, setWhatsappNumero] = useState('')
  const [modoMantenimiento, setModoMantenimiento] = useState(false)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoMantenimiento, setCambiandoMantenimiento] = useState(false)

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('clave, valor')
        .in('clave', ['whatsapp_admin', 'modo_mantenimiento'])

      if (error) throw error

      data.forEach(config => {
        if (config.clave === 'whatsapp_admin') {
          setWhatsappNumero(config.valor || '')
        } else if (config.clave === 'modo_mantenimiento') {
          setModoMantenimiento(config.valor === 'true')
        }
      })
    } catch (err) {
      console.error('Error al cargar configuración:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)

    try {
      const { error } = await supabase
        .from('configuracion_sistema')
        .update({ 
          valor: whatsappNumero,
          updated_at: new Date().toISOString()
        })
        .eq('clave', 'whatsapp_admin')

      if (error) throw error

      alert('✅ Configuración guardada exitosamente')
    } catch (err) {
      console.error('Error al guardar:', err)
      alert('❌ Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleToggleMantenimiento = async () => {
    const nuevoEstado = !modoMantenimiento
    const mensaje = nuevoEstado 
      ? '⚠️ ¿Estás seguro de activar el modo mantenimiento? Los usuarios no podrán acceder al sistema.'
      : '¿Desactivar el modo mantenimiento? Los usuarios podrán acceder normalmente.'

    if (!confirm(mensaje)) return

    setCambiandoMantenimiento(true)

    try {
      const { error } = await supabase
        .from('configuracion_sistema')
        .update({ 
          valor: nuevoEstado.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('clave', 'modo_mantenimiento')

      if (error) throw error

      setModoMantenimiento(nuevoEstado)
      alert(nuevoEstado 
        ? '🔧 Modo mantenimiento activado. Los usuarios verán un mensaje de mantenimiento.'
        : '✅ Modo mantenimiento desactivado. El sistema está disponible.'
      )
    } catch (err) {
      console.error('Error al cambiar modo mantenimiento:', err)
      alert('❌ Error: ' + err.message)
    } finally {
      setCambiandoMantenimiento(false)
    }
  }

  const formatearNumero = (numero) => {
    // Eliminar todo excepto números
    const limpio = numero.replace(/\D/g, '')
    return limpio
  }

  const handleNumeroChange = (e) => {
    const formateado = formatearNumero(e.target.value)
    setWhatsappNumero(formateado)
  }

  if (loading) {
    return (
      <div className="admin-config-loading">
        <div className="spinner"></div>
        <p>Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="admin-config-page">
      <div className="page-header">
        <div>
          <h1>⚙️ Configuración del Sistema</h1>
          <p>Configura los parámetros globales del sistema</p>
        </div>
      </div>

      <div className="config-container">
        {/* Sección de Modo Mantenimiento */}
        <div className="config-section mantenimiento-section">
          <div className="section-header">
            <h2>🔧 Modo Mantenimiento</h2>
            <p>Activa esta opción para mostrar un mensaje de mantenimiento a todos los usuarios</p>
          </div>

          <div className="mantenimiento-control">
            <div className="mantenimiento-info">
              <div className="estado-actual">
                <span className="label">Estado actual:</span>
                <span className={`badge ${modoMantenimiento ? 'activo' : 'inactivo'}`}>
                  {modoMantenimiento ? '🔧 Mantenimiento Activo' : '✅ Sistema Disponible'}
                </span>
              </div>
              <p className="descripcion">
                {modoMantenimiento 
                  ? 'El sistema está en modo mantenimiento. Los usuarios verán un mensaje y no podrán acceder.'
                  : 'El sistema está funcionando normalmente. Los usuarios pueden acceder sin restricciones.'
                }
              </p>
            </div>

            <button
              onClick={handleToggleMantenimiento}
              disabled={cambiandoMantenimiento}
              className={`btn-toggle-mantenimiento ${modoMantenimiento ? 'desactivar' : 'activar'}`}
            >
              {cambiandoMantenimiento 
                ? 'Cambiando...' 
                : modoMantenimiento 
                  ? '✅ Desactivar Mantenimiento' 
                  : '🔧 Activar Mantenimiento'
              }
            </button>
          </div>

          {modoMantenimiento && (
            <div className="warning-box">
              <span className="icono-warning">⚠️</span>
              <div>
                <p><strong>Modo Mantenimiento Activo</strong></p>
                <p>Los usuarios no pueden acceder al sistema. Solo los administradores pueden iniciar sesión.</p>
              </div>
            </div>
          )}
        </div>

        <div className="config-section">
          <div className="section-header">
            <h2>💬 WhatsApp de Soporte</h2>
            <p>Número de WhatsApp que verán los usuarios cuando su suscripción esté inactiva</p>
          </div>

          <form onSubmit={handleGuardar}>
            <div className="form-group">
              <label>Número de WhatsApp</label>
              <input
                type="text"
                value={whatsappNumero}
                onChange={handleNumeroChange}
                placeholder="51987654321"
                required
                maxLength={15}
              />
              <small>
                Formato: Código de país + número sin espacios ni guiones
                <br />
                Ejemplo: 51987654321 (Perú), 34612345678 (España)
              </small>
            </div>

            <div className="preview-section">
              <h3>Vista Previa del Enlace</h3>
              <div className="preview-box">
                <a
                  href={`https://wa.me/${whatsappNumero}?text=Hola,%20necesito%20renovar%20mi%20suscripción%20de%20GestiónPago`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-link"
                >
                  💬 Contactar por WhatsApp
                </a>
                <p className="preview-url">
                  https://wa.me/{whatsappNumero}
                </p>
              </div>
            </div>

            <div className="info-box">
              <span className="icono-info">ℹ️</span>
              <div>
                <p><strong>¿Dónde se muestra este número?</strong></p>
                <ul>
                  <li>Cuando un usuario intenta iniciar sesión con suscripción inactiva</li>
                  <li>Cuando un usuario conectado es bloqueado por suscripción vencida</li>
                  <li>En ambos casos aparece un botón verde para contactarte por WhatsApp</li>
                </ul>
              </div>
            </div>

            <button type="submit" disabled={guardando} className="btn-guardar">
              {guardando ? 'Guardando...' : '💾 Guardar Configuración'}
            </button>
          </form>
        </div>

        <div className="config-section">
          <div className="section-header">
            <h2>📱 Mensaje Predefinido</h2>
            <p>Mensaje que se enviará automáticamente al abrir WhatsApp</p>
          </div>

          <div className="mensaje-preview">
            <div className="whatsapp-bubble">
              <p>Hola, necesito renovar mi suscripción de GestiónPago</p>
            </div>
            <small>Este mensaje aparecerá automáticamente en el chat de WhatsApp</small>
          </div>
        </div>
      </div>
    </div>
  )
}
