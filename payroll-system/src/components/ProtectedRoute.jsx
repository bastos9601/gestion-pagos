// Componente para proteger rutas - Solo usuarios autenticados con suscripción activa
import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabaseClient'

export const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [suscripcionValida, setSuscripcionValida] = useState(null)
  const [loading, setLoading] = useState(true)
  const [whatsappNumero, setWhatsappNumero] = useState('51921146588')

  useEffect(() => {
    cargarWhatsApp()
    if (!authLoading && user) {
      verificarSuscripcion()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

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

  const verificarSuscripcion = async () => {
    try {
      const { data, error } = await supabase
        .from('suscripciones')
        .select('estado, fecha_vencimiento')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error al verificar suscripción:', error)
        setSuscripcionValida(false)
        setLoading(false)
        return
      }

      const hoy = new Date().toISOString().split('T')[0]
      const estaActiva = data.estado === 'activa' && data.fecha_vencimiento >= hoy

      setSuscripcionValida(estaActiva)
    } catch (err) {
      console.error('Error:', err)
      setSuscripcionValida(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
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
        <p>Verificando suscripción...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (suscripcionValida === false) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem' }}>⚠️</div>
        <h2 style={{ margin: 0, color: '#ef4444' }}>Suscripción Inactiva</h2>
        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
          Tu suscripción ha sido cancelada o ha vencido. 
          Por favor, contacta al administrador para renovar tu acceso.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href={`https://wa.me/${whatsappNumero}?text=Hola,%20necesito%20renovar%20mi%20suscripción%20de%20GestiónPago`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}
          >
            💬 Contactar por WhatsApp
          </a>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  return children
}
