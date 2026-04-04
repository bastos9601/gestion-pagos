// Página de Login y Registro
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'
import '../styles/Auth.css'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [whatsappNumero, setWhatsappNumero] = useState('51921146588')
  const [modoMantenimiento, setModoMantenimiento] = useState(false)
  const [verificandoMantenimiento, setVerificandoMantenimiento] = useState(true)
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    cargarWhatsApp()
    verificarMantenimiento()
  }, [])

  const verificarMantenimiento = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('valor')
        .eq('clave', 'modo_mantenimiento')
        .single()

      if (!error && data) {
        setModoMantenimiento(data.valor === 'true')
      }
    } catch (err) {
      console.log('Error al verificar mantenimiento:', err)
    } finally {
      setVerificandoMantenimiento(false)
    }
  }

  const cargarWhatsApp = async () => {
    try {
      const { data } = await supabase
        .from('configuracion_sistema')
        .select('valor')
        .eq('clave', 'whatsapp_admin')
        .single()

      if (data?.valor) {
        setWhatsappNumero(data.valor)
      }
    } catch (err) {
      console.log('Usando número por defecto')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)
      if (error) throw error

      // Verificar suscripción antes de permitir acceso
      const { data: suscripcion, error: subError } = await supabase
        .from('suscripciones')
        .select('estado, fecha_vencimiento')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subError) {
        throw new Error('No se pudo verificar tu suscripción')
      }

      const hoy = new Date().toISOString().split('T')[0]
      const estaActiva = suscripcion.estado === 'activa' && suscripcion.fecha_vencimiento >= hoy

      if (!estaActiva) {
        await supabase.auth.signOut()
        throw new Error('Tu suscripción está inactiva o ha vencido. Contacta al administrador.')
      }

      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Mostrar spinner mientras verifica mantenimiento
  if (verificandoMantenimiento) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Verificando sistema...</p>
        </div>
      </div>
    )
  }

  // Mostrar pantalla de mantenimiento si está activo
  if (modoMantenimiento) {
    return (
      <div className="auth-container">
        <div className="auth-card mantenimiento-card">
          <div className="mantenimiento-icon">🔧</div>
          <h1>Sistema en Mantenimiento</h1>
          <p className="mantenimiento-mensaje">
            Estamos realizando mejoras en el sistema. 
            Por favor, intenta nuevamente en unos minutos.
          </p>
          <div className="mantenimiento-info">
            <p>Si necesitas asistencia urgente, contacta al administrador.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-reintentar"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>GestiónPago</h1>
        <h2>Iniciar Sesión</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
              {error.includes('suscripción') && (
                <a
                  href={`https://wa.me/${whatsappNumero}?text=Hola,%20necesito%20renovar%20mi%20suscripción%20de%20GestiónPago`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  💬 Contactar por WhatsApp
                </a>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <div className="suscripcion-section">
          <p className="suscripcion-text">¿No tienes cuenta?</p>
          
          {/* Botón de pago automático - Oculto temporalmente
          <button
            onClick={() => navigate('/registro')}
            className="suscribete-btn primary"
          >
            💳 Suscríbete Ahora (Pago Automático)
          </button>
          
          <div className="divider">
            <span>o</span>
          </div>
          */}
          
          <a
            href={`https://wa.me/${whatsappNumero}?text=Hola,%20quiero%20suscribirme%20a%20GestiónPago`}
            target="_blank"
            rel="noopener noreferrer"
            className="suscribete-btn secondary"
          >
            💬 Suscríbete por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
