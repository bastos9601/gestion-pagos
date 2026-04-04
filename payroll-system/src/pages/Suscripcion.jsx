// Página de suscripción con Mercado Pago
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import '../styles/Suscripcion.css'

export const Suscripcion = () => {
  const [loading, setLoading] = useState(false)
  const [suscripcion, setSuscripcion] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadUserAndSuscripcion()
  }, [])

  const loadUserAndSuscripcion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      const { data: sub } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSuscripcion(sub)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleSuscribirse = async (plan) => {
    setLoading(true)
    try {
      const montos = {
        mensual: 50,
        trimestral: 135,
        anual: 480
      }

      const duraciones = {
        mensual: 30,
        trimestral: 90,
        anual: 365
      }

      // Crear preferencia de pago en Mercado Pago
      const response = await fetch('/api/crear-preferencia-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          monto: montos[plan],
          duracion_dias: duraciones[plan],
          user_id: user.id,
          email: user.email
        })
      })

      const { init_point } = await response.json()
      
      // Redirigir a Mercado Pago
      window.location.href = init_point
    } catch (err) {
      console.error('Error:', err)
      alert('Error al procesar el pago: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getDiasRestantes = () => {
    if (!suscripcion || !suscripcion.fecha_vencimiento) return 0
    const hoy = new Date()
    const vencimiento = new Date(suscripcion.fecha_vencimiento + 'T00:00:00')
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const diasRestantes = getDiasRestantes()
  const estaActiva = suscripcion?.estado === 'activa' && diasRestantes > 0

  return (
    <div className="suscripcion-page">
      <div className="page-header">
        <h1>💳 Suscripción</h1>
        <p>Elige el plan que mejor se adapte a tus necesidades</p>
      </div>

      {suscripcion && (
        <div className={`estado-actual ${estaActiva ? 'activa' : 'vencida'}`}>
          <h3>Estado de tu Suscripción</h3>
          <div className="estado-info">
            <div className="info-item">
              <span className="label">Estado:</span>
              <span className={`badge ${estaActiva ? 'activa' : 'vencida'}`}>
                {estaActiva ? '✅ Activa' : '⏰ Vencida'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Días restantes:</span>
              <span className="value">{diasRestantes} días</span>
            </div>
            {suscripcion.fecha_vencimiento && (
              <div className="info-item">
                <span className="label">Vence:</span>
                <span className="value">
                  {new Date(suscripcion.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="planes-grid">
        {/* Plan Mensual */}
        <div className="plan-card">
          <div className="plan-header">
            <h3>Mensual</h3>
            <div className="precio">
              <span className="monto">S/ 50</span>
              <span className="periodo">/mes</span>
            </div>
          </div>
          <ul className="plan-features">
            <li>✅ 30 días de acceso</li>
            <li>✅ Empleados ilimitados</li>
            <li>✅ Reconocimiento facial</li>
            <li>✅ Control de asistencias</li>
            <li>✅ Gestión de pagos</li>
            <li>✅ Reportes en PDF</li>
          </ul>
          <button
            onClick={() => handleSuscribirse('mensual')}
            disabled={loading}
            className="btn-suscribirse"
          >
            {loading ? 'Procesando...' : 'Suscribirse'}
          </button>
        </div>

        {/* Plan Trimestral */}
        <div className="plan-card destacado">
          <div className="badge-popular">🔥 Más Popular</div>
          <div className="plan-header">
            <h3>Trimestral</h3>
            <div className="precio">
              <span className="monto">S/ 135</span>
              <span className="periodo">/3 meses</span>
            </div>
            <span className="ahorro">Ahorra S/ 15 (10%)</span>
          </div>
          <ul className="plan-features">
            <li>✅ 90 días de acceso</li>
            <li>✅ Empleados ilimitados</li>
            <li>✅ Reconocimiento facial</li>
            <li>✅ Control de asistencias</li>
            <li>✅ Gestión de pagos</li>
            <li>✅ Reportes en PDF</li>
            <li>✅ Soporte prioritario</li>
          </ul>
          <button
            onClick={() => handleSuscribirse('trimestral')}
            disabled={loading}
            className="btn-suscribirse destacado"
          >
            {loading ? 'Procesando...' : 'Suscribirse'}
          </button>
        </div>

        {/* Plan Anual */}
        <div className="plan-card">
          <div className="plan-header">
            <h3>Anual</h3>
            <div className="precio">
              <span className="monto">S/ 480</span>
              <span className="periodo">/año</span>
            </div>
            <span className="ahorro">Ahorra S/ 120 (20%)</span>
          </div>
          <ul className="plan-features">
            <li>✅ 365 días de acceso</li>
            <li>✅ Empleados ilimitados</li>
            <li>✅ Reconocimiento facial</li>
            <li>✅ Control de asistencias</li>
            <li>✅ Gestión de pagos</li>
            <li>✅ Reportes en PDF</li>
            <li>✅ Soporte prioritario</li>
            <li>✅ Actualizaciones gratis</li>
          </ul>
          <button
            onClick={() => handleSuscribirse('anual')}
            disabled={loading}
            className="btn-suscribirse"
          >
            {loading ? 'Procesando...' : 'Suscribirse'}
          </button>
        </div>
      </div>

      <div className="info-pago">
        <h3>💳 Métodos de Pago Aceptados</h3>
        <div className="metodos-pago">
          <div className="metodo">💳 Tarjetas de crédito/débito</div>
          <div className="metodo">📱 Yape</div>
          <div className="metodo">📱 Plin</div>
          <div className="metodo">🏦 Transferencia bancaria</div>
          <div className="metodo">💵 Efectivo (agentes)</div>
        </div>
        <p className="nota">
          ✅ Pago seguro procesado por Mercado Pago<br/>
          ✅ Activación automática e instantánea<br/>
          ✅ Puedes cancelar en cualquier momento
        </p>
      </div>
    </div>
  )
}
