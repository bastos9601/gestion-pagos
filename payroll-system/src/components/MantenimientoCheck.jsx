// Componente para verificar modo mantenimiento
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const MantenimientoCheck = ({ children }) => {
  const [modoMantenimiento, setModoMantenimiento] = useState(false)
  const [loading, setLoading] = useState(true)
  const [esAdmin, setEsAdmin] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    verificarMantenimiento()
    verificarAdmin()
  }, [user])

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
      setLoading(false)
    }
  }

  const verificarAdmin = async () => {
    if (!user) {
      setEsAdmin(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('administradores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setEsAdmin(!error && !!data)
    } catch (err) {
      setEsAdmin(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Cargando...</p>
      </div>
    )
  }

  // Si está en mantenimiento y NO es admin, mostrar pantalla de mantenimiento
  if (modoMantenimiento && !esAdmin) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '3rem',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔧</div>
          <h1 style={{ 
            fontSize: '2rem', 
            color: '#1f2937', 
            margin: '0 0 1rem 0' 
          }}>
            Sistema en Mantenimiento
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1.1rem', 
            lineHeight: '1.6',
            margin: '0 0 2rem 0'
          }}>
            Estamos realizando mejoras en el sistema. 
            Por favor, intenta nuevamente en unos minutos.
          </p>
          <div style={{
            background: '#f3f4f6',
            padding: '1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <p style={{ margin: 0 }}>
              Si necesitas asistencia urgente, contacta al administrador.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '2rem',
              padding: '0.875rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Si no está en mantenimiento o es admin, mostrar contenido normal
  return children
}
