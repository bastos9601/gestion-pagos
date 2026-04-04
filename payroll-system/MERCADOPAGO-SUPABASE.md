# 🚀 Integración Mercado Pago con Supabase - Guía Completa

## 📋 Resumen

Esta guía te ayudará a integrar Mercado Pago usando Supabase Edge Functions (sin necesidad de servidor adicional).

---

## ✅ Paso 1: Instalar Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
supabase --version
```

---

## 🔧 Paso 2: Inicializar Supabase en tu Proyecto

```bash
cd payroll-system

# Inicializar Supabase (esto crea la carpeta supabase/)
supabase init

# Vincular con tu proyecto de Supabase
supabase link --project-ref TU_PROJECT_REF
```

Para obtener tu `PROJECT_REF`:
1. Ve a tu proyecto en Supabase Dashboard
2. Settings → General → Reference ID

---

## 📝 Paso 3: Crear Edge Function para Crear Preferencia de Pago

```bash
# Crear la función
supabase functions new crear-preferencia-pago
```

Esto crea: `supabase/functions/crear-preferencia-pago/index.ts`

Edita el archivo con este contenido:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, monto, duracion_dias, user_id, email } = await req.json()

    // Configurar Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    
    const preference = {
      items: [
        {
          title: `Suscripción ${plan.charAt(0).toUpperCase() + plan.slice(1)} - GestiónPago`,
          quantity: 1,
          unit_price: parseFloat(monto),
          currency_id: 'PEN'
        }
      ],
      payer: {
        email: email
      },
      external_reference: `${user_id}_${plan}_${duracion_dias}`,
      back_urls: {
        success: `${Deno.env.get('APP_URL')}/pago-exitoso`,
        failure: `${Deno.env.get('APP_URL')}/pago-fallido`,
        pending: `${Deno.env.get('APP_URL')}/pago-pendiente`
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-mercadopago`
    }

    // Crear preferencia en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    const data = await response.json()

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        preference_id: data.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

---

## 📝 Paso 4: Crear Edge Function para Webhook

```bash
# Crear la función webhook
supabase functions new webhook-mercadopago
```

Edita `supabase/functions/webhook-mercadopago/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()

    // Solo procesar pagos
    if (type !== 'payment') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtener información del pago desde Mercado Pago
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const payment = await paymentResponse.json()

    // Solo procesar pagos aprobados
    if (payment.status !== 'approved') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extraer información del external_reference
    const [user_id, plan, duracion_dias] = payment.external_reference.split('_')

    // Crear cliente de Supabase con Service Role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calcular fechas
    const hoy = new Date()
    const fechaInicio = hoy.toISOString().split('T')[0]
    
    // Verificar si ya existe suscripción
    const { data: subExistente } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (subExistente) {
      // Extender suscripción existente
      const fechaBase = subExistente.fecha_vencimiento > fechaInicio
        ? new Date(subExistente.fecha_vencimiento + 'T00:00:00')
        : hoy

      const nuevaFecha = new Date(fechaBase)
      nuevaFecha.setDate(nuevaFecha.getDate() + parseInt(duracion_dias))

      await supabase
        .from('suscripciones')
        .update({
          estado: 'activa',
          fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
          monto: payment.transaction_amount
        })
        .eq('user_id', user_id)
    } else {
      // Crear nueva suscripción
      const fechaVencimiento = new Date(hoy)
      fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(duracion_dias))

      await supabase
        .from('suscripciones')
        .insert({
          user_id: user_id,
          estado: 'activa',
          fecha_inicio: fechaInicio,
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          monto: payment.transaction_amount
        })
    }

    console.log('✅ Suscripción activada para user:', user_id)

    return new Response(
      JSON.stringify({ received: true, activated: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error en webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

---

## 📝 Paso 5: Crear Archivo CORS Compartido

Crea: `supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## 🔐 Paso 6: Configurar Variables de Entorno en Supabase

```bash
# Configurar secrets
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-5247527903416342-040323-011a15411154235aa21505f4a0d55c1a-3313854526

supabase secrets set APP_URL=https://tu-app.netlify.app

# Listar secrets configurados
supabase secrets list
```

---

## 🚀 Paso 7: Desplegar Edge Functions

```bash
# Desplegar todas las funciones
supabase functions deploy crear-preferencia-pago
supabase functions deploy webhook-mercadopago

# O desplegar todas a la vez
supabase functions deploy
```

---

## 📱 Paso 8: Actualizar el Frontend

Actualiza `src/pages/Registro.jsx`:

```javascript
const handleSeleccionarPlan = async (plan) => {
  setLoading(true)
  try {
    // Obtener usuario actual (si está logueado) o crear uno temporal
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Si no está logueado, redirigir a crear cuenta primero
      alert('Primero debes crear una cuenta. Serás redirigido...')
      // Guardar plan seleccionado en localStorage
      localStorage.setItem('plan_seleccionado', JSON.stringify(plan))
      navigate('/crear-cuenta')
      return
    }

    // Llamar a la Edge Function de Supabase
    const { data, error } = await supabase.functions.invoke('crear-preferencia-pago', {
      body: {
        plan: plan.id,
        monto: plan.precio,
        duracion_dias: plan.duracion,
        user_id: user.id,
        email: user.email
      }
    })

    if (error) throw error

    // Redirigir a Mercado Pago
    window.location.href = data.init_point
  } catch (err) {
    console.error('Error:', err)
    alert('Error al procesar el pago: ' + err.message)
  } finally {
    setLoading(false)
  }
}
```

---

## 🧪 Paso 9: Probar Localmente

```bash
# Iniciar funciones localmente
supabase functions serve

# En otra terminal, probar la función
curl -i --location --request POST 'http://localhost:54321/functions/v1/crear-preferencia-pago' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"plan":"mensual","monto":50,"duracion_dias":30,"user_id":"test-user","email":"test@test.com"}'
```

---

## 📊 Paso 10: Verificar en Producción

1. **Verificar funciones desplegadas:**
   - Ve a Supabase Dashboard → Edge Functions
   - Deberías ver: `crear-preferencia-pago` y `webhook-mercadopago`

2. **URL de las funciones:**
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/crear-preferencia-pago
   https://TU_PROJECT_REF.supabase.co/functions/v1/webhook-mercadopago
   ```

3. **Configurar webhook en Mercado Pago:**
   - Ve a Mercado Pago → Desarrolladores → Webhooks
   - Agrega: `https://TU_PROJECT_REF.supabase.co/functions/v1/webhook-mercadopago`

---

## ✅ Ventajas de Usar Supabase Edge Functions

✅ No necesitas servidor adicional
✅ Escalamiento automático
✅ Integración nativa con Supabase
✅ Gratis hasta 500,000 invocaciones/mes
✅ Más simple que Netlify Functions
✅ Ya tienes Supabase configurado

---

## 🎯 Flujo Completo

```
1. Usuario selecciona plan en /registro
   ↓
2. Frontend llama a Edge Function: crear-preferencia-pago
   ↓
3. Edge Function crea preferencia en Mercado Pago
   ↓
4. Usuario es redirigido a Mercado Pago
   ↓
5. Usuario paga (tarjeta/Yape/Plin/etc)
   ↓
6. Mercado Pago envía webhook a: webhook-mercadopago
   ↓
7. Edge Function activa/extiende suscripción en Supabase
   ↓
8. Usuario es redirigido de vuelta a tu app
   ↓
9. ✅ Suscripción activada automáticamente
```

---

## 💡 Próximos Pasos

1. ✅ Instalar Supabase CLI
2. ✅ Crear Edge Functions
3. ✅ Configurar secrets
4. ✅ Desplegar funciones
5. ✅ Actualizar frontend
6. ✅ Probar con tarjetas de prueba
7. ✅ Configurar webhook en Mercado Pago

---

## 🔒 Seguridad

- ✅ Access Token nunca se expone en el frontend
- ✅ Edge Functions corren en servidor seguro
- ✅ Service Role Key solo en backend
- ✅ CORS configurado correctamente

---

## 📞 Soporte

- Documentación Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Documentación Mercado Pago: https://www.mercadopago.com.pe/developers
