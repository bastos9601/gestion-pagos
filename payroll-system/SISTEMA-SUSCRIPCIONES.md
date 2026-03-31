# 💳 Sistema de Suscripciones con Yape

## 📋 Descripción

Sistema de pago manual con Yape para suscripciones mensuales. Los usuarios pagan por Yape y tú apruebas manualmente desde un panel de administración.

## 🚀 Pasos de Implementación

### 1. Configurar Base de Datos

Ejecuta el script SQL en Supabase:

```bash
# Abre el SQL Editor en Supabase y ejecuta:
payroll-system/supabase-suscripciones.sql
```

### 2. Configurar tu Número de Yape

Edita el archivo `src/pages/PagoYape.jsx` y cambia:

```javascript
const NUMERO_YAPE = '921146588' // CAMBIA ESTO POR TU NÚMERO
const MONTO = 50.00 // Cambia el precio si quieres
```

### 3. Agregar Rutas en tu App

Edita tu archivo de rutas (probablemente `App.jsx` o similar) y agrega:

```javascript
import { PagoYape } from './pages/PagoYape'
import { PagoPendiente } from './pages/PagoPendiente'
import { AdminPagos } from './pages/AdminPagos'

// En tus rutas:
<Route path="/pago-yape" element={<PagoYape />} />
<Route path="/pago-pendiente" element={<PagoPendiente />} />
<Route path="/admin/pagos" element={<AdminPagos />} />
```

### 4. Modificar el Registro

Modifica tu página de registro para que después de crear la cuenta, redirija a `/pago-yape`:

```javascript
// En tu componente de registro, después de crear la cuenta:
const handleRegister = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (!error) {
    // Redirigir a pago
    navigate('/pago-yape', { 
      state: { 
        userEmail: email, 
        userId: data.user.id 
      } 
    })
  }
}
```

### 5. Crear tu Cuenta de Administrador

Después de ejecutar el SQL y crear tu primera cuenta:

```sql
-- En el SQL Editor de Supabase, ejecuta:
INSERT INTO administradores (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com';
```

### 6. Proteger Rutas

Agrega un middleware para verificar suscripción activa:

```javascript
// src/hooks/useSuscripcion.js
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export const useSuscripcion = () => {
  const [loading, setLoading] = useState(true)
  const [activa, setActiva] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    checkSuscripcion()
  }, [])

  const checkSuscripcion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/login')
        return
      }

      const { data } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('user_id', user.id)
        .eq('estado', 'activa')
        .gte('fecha_vencimiento', new Date().toISOString().split('T')[0])
        .single()

      if (!data) {
        navigate('/pago-pendiente')
        return
      }

      setActiva(true)
    } catch (err) {
      console.error('Error:', err)
      navigate('/pago-pendiente')
    } finally {
      setLoading(false)
    }
  }

  return { loading, activa }
}
```

Usa el hook en tus páginas protegidas:

```javascript
// En Dashboard, Empleados, etc.
import { useSuscripcion } from '../hooks/useSuscripcion'

export const Dashboard = () => {
  const { loading, activa } = useSuscripcion()

  if (loading) return <div>Verificando suscripción...</div>
  if (!activa) return null // El hook redirige automáticamente

  return (
    // Tu contenido normal
  )
}
```

## 🔄 Flujo Completo

### Usuario:
1. Se registra con email y contraseña
2. Es redirigido a página de pago
3. Yapea S/ 50.00 a tu número
4. Ingresa su celular y código de operación
5. Ve página de "Pago Pendiente"
6. Espera aprobación (máximo 5 minutos)

### Administrador (Tú):
1. Recibes el Yape en tu celular
2. Verificas que el monto y código coincidan
3. Entras a `/admin/pagos`
4. Ves el pago pendiente
5. Presionas "Aprobar"
6. Sistema activa la suscripción automáticamente

### Sistema:
1. Usuario puede acceder al sistema
2. Suscripción dura 30 días
3. Después de 30 días, se bloquea el acceso
4. Usuario debe renovar (mismo proceso)

## 📱 Panel de Administración

Accede a: `http://localhost:5173/admin/pagos`

Funciones:
- Ver todos los pagos (pendientes, aprobados, rechazados)
- Aprobar pagos con un clic
- Rechazar pagos con motivo
- Ver historial completo

## 🔐 Seguridad

- RLS (Row Level Security) activado en todas las tablas
- Usuarios solo ven sus propios datos
- Administradores ven todo
- Códigos de operación únicos
- Verificación manual para evitar fraudes

## 💰 Precios y Configuración

Para cambiar el precio mensual:

```javascript
// En src/pages/PagoYape.jsx
const MONTO = 50.00 // Cambia aquí
```

## 📧 Notificaciones (Opcional)

Puedes agregar notificaciones por email cuando:
- Usuario registra un pago
- Administrador aprueba/rechaza
- Suscripción está por vencer

Usa Supabase Edge Functions o servicios como SendGrid.

## 🆘 Soporte

Si tienes problemas:
1. Verifica que ejecutaste el SQL correctamente
2. Verifica que agregaste tu email como administrador
3. Revisa la consola del navegador para errores
4. Verifica las políticas RLS en Supabase

## 📊 Reportes

Puedes agregar reportes de:
- Ingresos mensuales
- Usuarios activos
- Tasa de conversión
- Renovaciones

Consulta la tabla `pagos_yape` y `suscripciones` para generar estadísticas.

## 🔄 Renovaciones

El sistema bloquea automáticamente después de 30 días. Para renovar:
1. Usuario intenta acceder
2. Ve mensaje de suscripción vencida
3. Hace nuevo pago
4. Tú apruebas
5. Se extiende 30 días más

## ✅ Checklist de Implementación

- [ ] Ejecutar `supabase-suscripciones.sql`
- [ ] Cambiar número de Yape en `PagoYape.jsx`
- [ ] Agregar rutas en `App.jsx`
- [ ] Modificar página de registro
- [ ] Crear cuenta de administrador en BD
- [ ] Implementar hook `useSuscripcion`
- [ ] Proteger rutas principales
- [ ] Probar flujo completo
- [ ] Configurar notificaciones (opcional)

¡Listo! Tu sistema de suscripciones está funcionando.
