# 👥 Panel de Administración de Usuarios

## 📋 Descripción

Panel para que el administrador pueda crear usuarios directamente con suscripción activa, sin necesidad de que pasen por el proceso de pago. Útil para clientes que pagan en efectivo o por otros medios.

## ✨ Funcionalidades

### 1. Crear Usuarios
- Crear cuenta con email y contraseña
- Activar suscripción automáticamente
- Configurar duración personalizada (días)
- Crear configuración de empresa básica

### 2. Gestionar Suscripciones
- Ver todos los usuarios y sus suscripciones
- Extender suscripciones (agregar más días)
- Cancelar suscripciones
- Ver días restantes

### 3. Monitoreo
- Estado de cada suscripción (Activa/Vencida/Cancelada)
- Fechas de inicio y vencimiento
- Alertas visuales para suscripciones por vencer

## 🚀 Cómo Usar

### Acceder al Panel

Navega a: `http://localhost:5173/admin/usuarios`

### Crear un Nuevo Usuario

1. Haz clic en "➕ Nuevo Usuario"
2. Completa el formulario:
   - **Email**: Email del usuario (será su login)
   - **Contraseña**: Contraseña temporal (el usuario puede cambiarla)
   - **Nombre de Empresa**: Opcional (se puede cambiar después)
   - **Duración**: Días de suscripción (por defecto 30)
3. Haz clic en "Crear Usuario"
4. El usuario puede iniciar sesión inmediatamente

### Extender Suscripción

1. Encuentra el usuario en la lista
2. Haz clic en "⏰ Extender"
3. Ingresa los días a agregar (ej: 30 para 1 mes más)
4. Confirma

**Nota**: Los días se agregan desde la fecha de vencimiento actual, no desde hoy.

### Cancelar Suscripción

1. Encuentra el usuario en la lista
2. Haz clic en "❌ Cancelar"
3. Confirma la acción
4. El usuario perderá acceso al sistema

## 🎨 Interfaz

### Tarjetas de Usuario

Cada usuario se muestra en una tarjeta con:
- **Email**: Identificador del usuario
- **Estado**: Badge de color según estado
  - 🟢 Verde: Activa
  - 🟡 Amarillo: Por vencer (≤5 días)
  - 🔴 Rojo: Vencida o cancelada
- **Fechas**: Inicio y vencimiento
- **Días restantes**: Contador en tiempo real
- **Acciones**: Botones para extender o cancelar

### Estados de Suscripción

- **✅ Activa**: Suscripción vigente con días restantes
- **⏰ Vencida**: Fecha de vencimiento pasada
- **⏳ Pendiente**: Pago registrado pero no aprobado
- **❌ Cancelada**: Suscripción cancelada manualmente

## 🔐 Seguridad

### Permisos Requeridos

Para acceder a este panel, el usuario debe ser administrador. Verifica que tu cuenta esté en la tabla `administradores`:

```sql
-- Ejecuta en Supabase SQL Editor:
INSERT INTO administradores (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com';
```

### Políticas RLS

Las políticas de seguridad aseguran que:
- Solo administradores pueden ver todos los usuarios
- Solo administradores pueden crear/modificar suscripciones
- Usuarios normales solo ven sus propios datos

## 💡 Casos de Uso

### Caso 1: Cliente Paga en Efectivo
1. Cliente te paga S/ 50 en efectivo
2. Entras al panel de admin
3. Creas su cuenta con 30 días de suscripción
4. Le das su email y contraseña
5. Cliente puede usar el sistema inmediatamente

### Caso 2: Renovación Manual
1. Cliente te avisa que quiere renovar
2. Te paga por transferencia bancaria
3. Entras al panel
4. Extiendes su suscripción 30 días más
5. Cliente sigue usando sin interrupciones

### Caso 3: Cliente de Prueba
1. Quieres dar acceso de prueba
2. Creas cuenta con 7 días de suscripción
3. Cliente prueba el sistema
4. Si le gusta, extiendes a 30 días

### Caso 4: Cancelación
1. Cliente solicita cancelar
2. Entras al panel
3. Cancelas su suscripción
4. Cliente pierde acceso inmediatamente

## 📊 Reportes

Puedes ver estadísticas como:
- Total de usuarios activos
- Suscripciones por vencer esta semana
- Ingresos mensuales estimados
- Tasa de renovación

## 🔄 Flujo Completo

### Flujo Normal (Con Pago Yape)
```
Usuario → Registro → Pago Yape → Admin Aprueba → Suscripción Activa
```

### Flujo Directo (Panel Admin)
```
Admin → Crear Usuario → Suscripción Activa Inmediata
```

## 🛠️ Mantenimiento

### Verificar Suscripciones Vencidas

Puedes crear un script para notificar suscripciones por vencer:

```sql
-- Ver suscripciones que vencen en los próximos 5 días
SELECT 
  s.*,
  u.email
FROM suscripciones s
JOIN auth.users u ON s.user_id = u.id
WHERE s.estado = 'activa'
  AND s.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '5 days'
ORDER BY s.fecha_vencimiento;
```

### Limpiar Suscripciones Vencidas

```sql
-- Marcar como vencidas las suscripciones pasadas
UPDATE suscripciones
SET estado = 'vencida'
WHERE estado = 'activa'
  AND fecha_vencimiento < CURRENT_DATE;
```

## 📧 Notificaciones (Opcional)

Puedes agregar notificaciones automáticas:
- Email cuando se crea un usuario
- Email 5 días antes de vencer
- Email cuando se extiende la suscripción
- Email cuando se cancela

## 🎯 Mejoras Futuras

- Historial de pagos por usuario
- Notas internas sobre cada cliente
- Descuentos y promociones
- Suscripciones anuales con descuento
- Exportar lista de usuarios a Excel
- Gráficos de crecimiento

## ⚠️ Notas Importantes

1. **Contraseñas**: Las contraseñas que crees son temporales. Recomienda al usuario cambiarla después del primer login.

2. **Emails**: Asegúrate de usar emails válidos. Supabase puede enviar emails de verificación.

3. **Duración**: Puedes crear suscripciones de cualquier duración (7 días, 30 días, 365 días, etc.)

4. **Extensiones**: Al extender, los días se suman a la fecha de vencimiento actual, no a la fecha actual.

5. **Cancelaciones**: Son permanentes. Si quieres reactivar, debes crear una nueva suscripción.

## 🆘 Solución de Problemas

### Error: "No tienes permisos"
- Verifica que tu cuenta esté en la tabla `administradores`
- Ejecuta el SQL para agregarte como admin

### Error al crear usuario: "Email already exists"
- El email ya está registrado
- Usa otro email o elimina el usuario existente

### Usuario no puede iniciar sesión
- Verifica que la contraseña sea correcta
- Verifica que el email esté confirmado
- Revisa que la suscripción esté activa

### Suscripción no aparece como activa
- Verifica la fecha de vencimiento
- Verifica el estado en la base de datos
- Refresca la página

## ✅ Checklist

- [ ] Ejecutar `supabase-suscripciones.sql`
- [ ] Agregarte como administrador en la BD
- [ ] Acceder a `/admin/usuarios`
- [ ] Crear un usuario de prueba
- [ ] Verificar que puede iniciar sesión
- [ ] Probar extender suscripción
- [ ] Probar cancelar suscripción

¡Tu panel de administración está listo para usar!
