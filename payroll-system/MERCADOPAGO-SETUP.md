# 🚀 Configuración de Mercado Pago - Guía Completa

## 📋 Resumen

Esta guía te ayudará a integrar Mercado Pago en tu sistema de nómina para pagos automáticos de suscripciones.

---

## ✅ Paso 1: Configurar Variables de Entorno

### 1.1 Crear archivo `.env` en la raíz del proyecto

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

### 1.2 Editar `.env` con tus credenciales reales

```env
# Supabase (ya las tienes)
VITE_SUPABASE_URL=tu_url_real_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_real

# Mercado Pago - Credenciales de Prueba
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-c095fb37-ef26-43fe-abee-802feef85e30
MERCADOPAGO_ACCESS_TOKEN=APP_USR-5247527903416342-040323-011a15411154235aa21505f4a0d55c1a-3313854526
```

---

## 🔧 Paso 2: Instalar Dependencias

```bash
cd payroll-system
npm install mercadopago
```

---

## 🖥️ Paso 3: Crear Servidor Backend (API)

Mercado Pago requiere un servidor backend para crear preferencias de pago y recibir webhooks.

### Opción A: Usar Netlify Functions (Recomendado)

#### 3.1 Crear carpeta para funciones

```bash
mkdir -p payroll-system/netlify/functions
```

#### 3.2 Crear función para crear preferencias de pago

Archivo: `payroll-system/netlify/functions/crear-preferencia-pago.js`

```javascript
const mercadopago = require('mercadopago');

exports.handler = async (event) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { plan, monto, duracion_dias, user_id, email } = JSON.parse(event.body);

    // Configurar Mercado Pago
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    // Crear preferencia de pago
    const preference = {
      items: [
        {
          title: `Suscripción ${plan.charAt(0).toUpperCase() + plan.slice(1)} - Sistema de Nómina`,
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
        success: `${process.env.URL}/pago-exitoso`,
        failure: `${process.env.URL}/pago-fallido`,
        pending: `${process.env.URL}/pago-pendiente`
      },
      auto_return: 'approved',
      notification_url: `${process.env.URL}/.netlify/functions/webhook-mercadopago`
    };

    const response = await mercadopago.preferences.create(preference);

    return {
      statusCode: 200,
      body: JSON.stringify({
        init_point: response.body.init_point,
        preference_id: response.body.id
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 3.3 Crear función webhook para recibir notificaciones

Archivo: `payroll-system/netlify/functions/webhook-mercadopago.js`

```javascript
const mercadopago = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  try {
    // Configurar Mercado Pago
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    // Configurar Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Necesitas esta key
    );

    const { type, data } = JSON.parse(event.body);

    // Solo procesar pagos
    if (type === 'payment') {
      const payment = await mercadopago.payment.get(data.id);
      
      if (payment.body.status === 'approved') {
        // Extraer información del external_reference
        const [user_id, plan, duracion_dias] = payment.body.external_reference.split('_');

        // Calcular fechas
        const hoy = new Date();
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + parseInt(duracion_dias));

        // Actualizar o crear suscripción
        const { data: subExistente } = await supabase
          .from('suscripciones')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (subExistente) {
          // Extender suscripción existente
          const fechaBase = subExistente.fecha_vencimiento > hoy.toISOString().split('T')[0]
            ? new Date(subExistente.fecha_vencimiento + 'T00:00:00')
            : hoy;

          const nuevaFecha = new Date(fechaBase);
          nuevaFecha.setDate(nuevaFecha.getDate() + parseInt(duracion_dias));

          await supabase
            .from('suscripciones')
            .update({
              estado: 'activa',
              fecha_vencimiento: nuevaFecha.toISOString().split('T')[0],
              monto: payment.body.transaction_amount
            })
            .eq('user_id', user_id);
        } else {
          // Crear nueva suscripción
          await supabase
            .from('suscripciones')
            .insert({
              user_id: user_id,
              estado: 'activa',
              fecha_inicio: hoy.toISOString().split('T')[0],
              fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
              monto: payment.body.transaction_amount
            });
        }

        console.log('✅ Suscripción activada para user:', user_id);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Error en webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

#### 3.4 Actualizar `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
```

---

## 📱 Paso 4: Agregar Ruta de Suscripción

### 4.1 Actualizar rutas en `App.jsx`

```javascript
import { Suscripcion } from './pages/Suscripcion'

// Dentro de las rutas:
<Route path="/suscripcion" element={<Suscripcion />} />
```

### 4.2 Agregar enlace en el menú

En tu componente de navegación, agrega:

```javascript
<Link to="/suscripcion">💳 Suscripción</Link>
```

---

## 🧪 Paso 5: Probar con Tarjetas de Prueba

Mercado Pago proporciona tarjetas de prueba para simular pagos:

### Tarjetas de Prueba (Perú)

**Visa (Aprobada):**
- Número: `4009 1753 3280 7358`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: APRO

**Mastercard (Rechazada):**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: OTHE

**Más tarjetas de prueba:**
https://www.mercadopago.com.pe/developers/es/docs/checkout-pro/additional-content/test-cards

---

## 🚀 Paso 6: Desplegar en Netlify

### 6.1 Configurar variables de entorno en Netlify

1. Ve a tu sitio en Netlify
2. Site settings → Environment variables
3. Agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MERCADOPAGO_PUBLIC_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY` (obtener de Supabase)

### 6.2 Desplegar

```bash
git add .
git commit -m "Integración Mercado Pago"
git push
```

---

## ✅ Paso 7: Activar Credenciales de Producción

Una vez que todo funcione con las credenciales de prueba:

1. Ve a Mercado Pago → Credenciales
2. Activa las credenciales de producción
3. Copia las nuevas credenciales (APP_USR-...)
4. Actualiza las variables de entorno en Netlify
5. Redespliega

---

## 🎯 Flujo Completo

```
1. Usuario hace clic en "Suscribirse"
   ↓
2. Frontend llama a /api/crear-preferencia-pago
   ↓
3. Backend crea preferencia en Mercado Pago
   ↓
4. Usuario es redirigido a Mercado Pago
   ↓
5. Usuario paga (tarjeta/Yape/Plin/etc)
   ↓
6. Mercado Pago envía webhook a tu servidor
   ↓
7. Webhook activa/extiende suscripción en Supabase
   ↓
8. Usuario es redirigido de vuelta a tu app
   ↓
9. ✅ Suscripción activada automáticamente
```

---

## 🔒 Seguridad

- ✅ Nunca expongas el Access Token en el frontend
- ✅ Usa HTTPS siempre
- ✅ Valida webhooks con la firma de Mercado Pago
- ✅ Usa Service Role Key de Supabase solo en backend
- ✅ Regenera credenciales si se exponen

---

## 📞 Soporte

- Documentación Mercado Pago: https://www.mercadopago.com.pe/developers
- Soporte Mercado Pago: https://www.mercadopago.com.pe/ayuda

---

## ✨ Próximos Pasos

1. ✅ Configurar variables de entorno
2. ✅ Instalar dependencias
3. ✅ Crear funciones de Netlify
4. ✅ Probar con tarjetas de prueba
5. ✅ Desplegar en Netlify
6. ✅ Activar credenciales de producción
