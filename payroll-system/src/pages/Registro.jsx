// Página de Registro con Planes de Suscripción
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Registro.css'

export const Registro = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const planes = [
    {
      id: 'mensual',
      nombre: 'Mensual',
      precio: 50,
      duracion: 30,
      periodo: '/mes',
      ahorro: null,
      destacado: false,
      caracteristicas: [
        '30 días de acceso completo',
        'Empleados ilimitados',
        'Reconocimiento facial',
        'Control de asistencias',
        'Gestión de pagos y nómina',
        'Reportes en PDF',
        'Soporte por email'
      ]
    },
    {
      id: 'trimestral',
      nombre: 'Trimestral',
      precio: 135,
      duracion: 90,
      periodo: '/3 meses',
      ahorro: 'Ahorra S/ 15 (10%)',
      destacado: true,
      caracteristicas: [
        '90 días de acceso completo',
        'Empleados ilimitados',
        'Reconocimiento facial',
        'Control de asistencias',
        'Gestión de pagos y nómina',
        'Reportes en PDF',
        'Soporte prioritario',
        '✨ Mejor relación precio-valor'
      ]
    },
    {
      id: 'anual',
      nombre: 'Anual',
      precio: 480,
      duracion: 365,
      periodo: '/año',
      ahorro: 'Ahorra S/ 120 (20%)',
      destacado: false,
      caracteristicas: [
        '365 días de acceso completo',
        'Empleados ilimitados',
        'Reconocimiento facial',
        'Control de asistencias',
        'Gestión de pagos y nómina',
        'Reportes en PDF',
        'Soporte prioritario 24/7',
        'Actualizaciones gratis',
        '🎁 Máximo ahorro'
      ]
    }
  ]

  const handleSeleccionarPlan = async (plan) => {
    setLoading(true)
    try {
      // Por ahora solo redirige a Mercado Pago
      // Cuando implementes el backend, aquí llamarás a la API
      alert(`Plan seleccionado: ${plan.nombre}\nPrecio: S/ ${plan.precio}\n\nPróximamente: Integración con Mercado Pago`)
      
      // TODO: Implementar llamada a API
      // const response = await fetch('/api/crear-preferencia-pago', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     plan: plan.id,
      //     monto: plan.precio,
      //     duracion_dias: plan.duracion
      //   })
      // })
      // const { init_point } = await response.json()
      // window.location.href = init_point
    } catch (err) {
      console.error('Error:', err)
      alert('Error al procesar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registro-container">
      <div className="registro-header">
        <button onClick={() => navigate('/login')} className="btn-volver">
          ← Volver al Login
        </button>
        <h1>🚀 Elige tu Plan</h1>
        <p>Selecciona el plan que mejor se adapte a tus necesidades</p>
      </div>

      <div className="planes-grid">
        {planes.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.destacado ? 'destacado' : ''}`}
          >
            {plan.destacado && (
              <div className="badge-popular">🔥 Más Popular</div>
            )}

            <div className="plan-header">
              <h3>{plan.nombre}</h3>
              <div className="precio">
                <span className="simbolo">S/</span>
                <span className="monto">{plan.precio}</span>
                <span className="periodo">{plan.periodo}</span>
              </div>
              {plan.ahorro && (
                <span className="ahorro">{plan.ahorro}</span>
              )}
            </div>

            <ul className="caracteristicas">
              {plan.caracteristicas.map((caracteristica, index) => (
                <li key={index}>
                  <span className="check">✓</span>
                  {caracteristica}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSeleccionarPlan(plan)}
              disabled={loading}
              className={`btn-seleccionar ${plan.destacado ? 'destacado' : ''}`}
            >
              {loading ? 'Procesando...' : 'Seleccionar Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="info-pago">
        <h3>💳 Métodos de Pago Disponibles</h3>
        <div className="metodos-grid">
          <div className="metodo">
            <span className="icono">💳</span>
            <span>Tarjetas</span>
          </div>
          <div className="metodo">
            <span className="icono">📱</span>
            <span>Yape</span>
          </div>
          <div className="metodo">
            <span className="icono">📱</span>
            <span>Plin</span>
          </div>
          <div className="metodo">
            <span className="icono">🏦</span>
            <span>Transferencia</span>
          </div>
          <div className="metodo">
            <span className="icono">💵</span>
            <span>Efectivo</span>
          </div>
        </div>

        <div className="garantias">
          <div className="garantia">
            <span className="icono">🔒</span>
            <div>
              <strong>Pago 100% Seguro</strong>
              <p>Procesado por Mercado Pago</p>
            </div>
          </div>
          <div className="garantia">
            <span className="icono">⚡</span>
            <div>
              <strong>Activación Instantánea</strong>
              <p>Acceso inmediato después del pago</p>
            </div>
          </div>
          <div className="garantia">
            <span className="icono">🎯</span>
            <div>
              <strong>Sin Permanencia</strong>
              <p>Cancela cuando quieras</p>
            </div>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <h3>❓ Preguntas Frecuentes</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <strong>¿Cuándo se activa mi cuenta?</strong>
            <p>Tu cuenta se activa automáticamente después de confirmar el pago. Es instantáneo.</p>
          </div>
          <div className="faq-item">
            <strong>¿Puedo cambiar de plan?</strong>
            <p>Sí, puedes actualizar tu plan en cualquier momento desde tu panel de control.</p>
          </div>
          <div className="faq-item">
            <strong>¿Hay límite de empleados?</strong>
            <p>No, todos los planes incluyen empleados ilimitados.</p>
          </div>
          <div className="faq-item">
            <strong>¿Necesito tarjeta de crédito?</strong>
            <p>No necesariamente. Puedes pagar con Yape, Plin, transferencia o efectivo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
