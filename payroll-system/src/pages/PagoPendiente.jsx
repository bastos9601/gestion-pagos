// Página de espera mientras se verifica el pago
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'
import '../styles/PagoPendiente.css'

export const PagoPendiente = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [suscripcion, setSuscripcion] = useState(null)

  useEffect(() => {
    checkSuscripcion()
    
    // Verificar cada 10 segundos
    const interval = setInterval(checkSuscripcion, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const checkSuscripcion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      setSuscripcion(data)

      // Si la suscripción fue aprobada, redirigir al dashboard
      if (data.estado === 'activa') {
        alert('🎉 ¡Tu pago ha sido aprobado! Bienvenido al sistema.')
        navigate('/dashboard')
      }

      setChecking(false)
    } catch (err) {
      console.error('Error al verificar suscripción:', err)
      setChecking(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="pago-pendiente-page">
      <div className="pendiente-container">
        <div className="icono-reloj">
          <div className="reloj-animado">⏳</div>
        </div>

        <h1>Verificando tu pago</h1>
        <p className="mensaje-principal">
          Estamos verificando tu pago de Yape. Este proceso puede tomar hasta 5 minutos.
        </p>

        {suscripcion && (
          <div className="info-pago">
            <div className="info-item">
              <span className="label">Estado:</span>
              <span className={`estado ${suscripcion.estado}`}>
                {suscripcion.estado === 'pendiente' ? '⏳ Pendiente' : suscripcion.estado}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Monto:</span>
              <span className="valor">S/ {parseFloat(suscripcion.monto).toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="instrucciones-espera">
          <h3>¿Qué está pasando?</h3>
          <ul>
            <li>✓ Tu pago ha sido registrado en nuestro sistema</li>
            <li>⏳ Estamos verificando la operación en Yape</li>
            <li>📧 Recibirás un email cuando tu cuenta esté activa</li>
          </ul>
        </div>

        <div className="acciones">
          <button onClick={checkSuscripcion} className="btn-verificar" disabled={checking}>
            {checking ? 'Verificando...' : '🔄 Verificar ahora'}
          </button>
          
          <button onClick={handleLogout} className="btn-salir">
            Cerrar sesión
          </button>
        </div>

        <div className="contacto">
          <p>¿Problemas con tu pago?</p>
          <a href="mailto:soporte@tuempresa.com" className="link-contacto">
            📧 Contáctanos
          </a>
        </div>
      </div>
    </div>
  )
}
