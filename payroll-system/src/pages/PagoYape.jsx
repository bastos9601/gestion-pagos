// Página de pago con Yape
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/PagoYape.css'

export const PagoYape = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [celular, setCelular] = useState('')
  const [codigoOperacion, setCodigoOperacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')

  const NUMERO_YAPE = '921146588' // CAMBIA ESTO POR TU NÚMERO
  const MONTO = 50.00

  useEffect(() => {
    // Obtener datos del usuario
    const getUserData = async () => {
      // Primero intentar desde location.state
      if (location.state?.userEmail && location.state?.userId) {
        setUserEmail(location.state.userEmail)
        setUserId(location.state.userId)
      } else {
        // Si no hay state, obtener del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email)
          setUserId(user.id)
        } else {
          // Si no hay usuario, redirigir a login
          navigate('/login')
        }
      }
    }

    getUserData()
  }, [location, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validar campos
      if (!celular || celular.length < 9) {
        throw new Error('Ingresa un número de celular válido')
      }

      if (!codigoOperacion || codigoOperacion.length < 6) {
        throw new Error('Ingresa el código de operación completo')
      }

      // Crear suscripción pendiente
      const { data: suscripcion, error: suscripcionError } = await supabase
        .from('suscripciones')
        .insert({
          user_id: userId,
          estado: 'pendiente',
          monto: MONTO
        })
        .select()
        .single()

      if (suscripcionError) throw suscripcionError

      // Registrar pago
      const { error: pagoError } = await supabase
        .from('pagos_yape')
        .insert({
          user_id: userId,
          suscripcion_id: suscripcion.id,
          email_usuario: userEmail,
          celular_yape: celular,
          codigo_operacion: codigoOperacion.toUpperCase(),
          monto: MONTO,
          estado: 'pendiente'
        })

      if (pagoError) throw pagoError

      // Mostrar mensaje de éxito
      alert('✅ Pago registrado correctamente. Verificaremos tu pago en los próximos minutos y activaremos tu cuenta.')
      
      // Redirigir a página de espera
      navigate('/pago-pendiente')

    } catch (err) {
      console.error('Error al registrar pago:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pago-yape-page">
      <div className="pago-container">
        <div className="pago-header">
          <h1>💰 Suscripción Mensual</h1>
          <p>Sistema de Gestión de Nómina</p>
        </div>

        <div className="precio-card">
          <div className="precio">
            <span className="moneda">S/</span>
            <span className="monto">{MONTO.toFixed(2)}</span>
            <span className="periodo">/ mes</span>
          </div>
        </div>

        <div className="beneficios">
          <h3>✨ Incluye:</h3>
          <ul>
            <li>✓ Gestión ilimitada de empleados</li>
            <li>✓ Asistencias con reconocimiento facial</li>
            <li>✓ Reportes PDF personalizados</li>
            <li>✓ Control de horarios y tardanzas</li>
            <li>✓ Cálculo automático de horas extras</li>
            <li>✓ Soporte técnico</li>
          </ul>
        </div>

        <div className="instrucciones-yape">
          <h3>📱 Instrucciones de Pago</h3>
          <div className="pasos">
            <div className="paso">
              <span className="numero">1</span>
              <div className="texto">
                <strong>Abre tu app Yape</strong>
                <p>Y yapea S/ {MONTO.toFixed(2)} al número:</p>
                <div className="numero-yape">
                  <span className="icono">📱</span>
                  <span className="numero-grande">{NUMERO_YAPE}</span>
                </div>
              </div>
            </div>

            <div className="paso">
              <span className="numero">2</span>
              <div className="texto">
                <strong>En el concepto escribe:</strong>
                <p className="concepto">{userEmail}</p>
              </div>
            </div>

            <div className="paso">
              <span className="numero">3</span>
              <div className="texto">
                <strong>Completa el formulario abajo</strong>
                <p>Con tu número de Yape y el código de operación</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-pago">
          <h3>Ingresa la información para pagar</h3>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>Tu celular registrado en Yape</label>
            <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value.replace(/\D/g, ''))}
              placeholder="921146588"
              maxLength="9"
              required
              disabled={loading}
            />
            <small>Ingresa tu número sin espacios</small>
          </div>

          <div className="form-group">
            <label>Código de operación</label>
            <input
              type="text"
              value={codigoOperacion}
              onChange={(e) => setCodigoOperacion(e.target.value.toUpperCase())}
              placeholder="ABC123XYZ"
              required
              disabled={loading}
              className="codigo-input"
            />
            <small>Encuéntralo en tu app de Yape después de hacer el pago</small>
          </div>

          <div className="info-box">
            <span className="icono-info">ℹ️</span>
            <p>
              Verifica en Yape que la opción "Compras por internet" esté activada 
              y que tu límite diario es suficiente.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-continuar"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>

          <p className="nota-verificacion">
            ⏳ Verificaremos tu pago manualmente en máximo 5 minutos
          </p>
        </form>
      </div>
    </div>
  )
}
