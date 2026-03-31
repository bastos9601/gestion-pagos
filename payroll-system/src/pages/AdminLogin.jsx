// Página de login para administradores
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { Eye, EyeOff, Shield } from 'lucide-react'
import '../styles/AdminLogin.css'

export const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔐 AdminLogin - Intentando iniciar sesión con:', email)
      
      // 1. Iniciar sesión
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.log('❌ AdminLogin - Error de autenticación:', authError)
        throw authError
      }

      console.log('✅ AdminLogin - Autenticación exitosa:', authData.user.email, authData.user.id)

      // 2. Verificar si es administrador
      console.log('🔍 AdminLogin - Verificando permisos de administrador...')
      
      const { data: adminData, error: adminError } = await supabase
        .from('administradores')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      console.log('🔍 AdminLogin - Resultado de consulta:', {
        adminData,
        error: adminError?.message,
        errorCode: adminError?.code
      })

      if (adminError || !adminData) {
        console.log('❌ AdminLogin - Usuario NO es administrador, cerrando sesión...')
        // No es administrador, cerrar sesión
        await supabase.auth.signOut()
        throw new Error('No tienes permisos de administrador')
      }

      console.log('✅ AdminLogin - Usuario ES administrador, redirigiendo...')
      
      // 3. Redirigir al dashboard de admin
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('❌ AdminLogin - Error:', err)
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-header">
            <div className="shield-icon">
              <Shield size={48} />
            </div>
            <h1>Panel de Administración</h1>
            <p>Acceso restringido solo para administradores</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Usuario (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@ejemplo.com"
                autoComplete="username"
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
                  autoComplete="current-password"
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
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Verificando...' : 'Acceder al Panel'}
            </button>
          </form>

          <div className="admin-footer">
            <p>🔒 Acceso seguro con verificación de permisos</p>
            <button 
              onClick={() => navigate('/login')} 
              className="btn-volver"
            >
              ← Volver al login normal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
