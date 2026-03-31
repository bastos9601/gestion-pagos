# 🚀 Setup Completo del Sistema de Suscripciones

## 📋 Pasos en Orden

Sigue estos pasos **en orden** para configurar todo el sistema.

---

## PASO 1: Ejecutar SQL de Suscripciones

### 1.1 Ir a Supabase
1. Abre https://supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (icono de código `</>` en el menú lateral)

### 1.2 Ejecutar el Script
1. Haz clic en **"+ New Query"**
2. Copia TODO el contenido del archivo: `supabase-suscripciones.sql`
3. Pégalo en el editor
4. Haz clic en **"Run"** o presiona `Ctrl + Enter`
5. Espera a que termine (debería decir "Success")

### 1.3 Verificar
Ejecuta este SQL para verificar que las tablas se crearon:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('suscripciones', 'pagos_yape', 'administradores');
```

Deberías ver las 3 tablas listadas.

---

## PASO 2: Agregarte como Administrador

### 2.1 Obtener tu Email
El email que usaste para registrarte. En tu caso parece ser: `admin@gestionpago.com`

### 2.2 Ejecutar SQL
En el mismo SQL Editor, ejecuta:

```sql
-- CAMBIA EL EMAIL POR EL TUYO
INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';
```

**⚠️ IMPORTANTE**: Cambia `'admin@gestionpago.com'` por tu email real.

### 2.3 Verificar
```sql
SELECT * FROM administradores;
```

Deberías ver tu email en la lista.

---

## PASO 3: Configurar Número de Yape

### 3.1 Abrir el Archivo
Abre: `src/pages/PagoYape.jsx`

### 3.2 Cambiar el Número
Busca la línea 18 y cambia:

```javascript
const NUMERO_YAPE = '921146588' // CAMBIA ESTO POR TU NÚMERO
```

Por tu número de Yape real.

### 3.3 Cambiar el Monto (Opcional)
Si quieres cambiar el precio mensual:

```javascript
const MONTO = 50.00 // Cambia el precio aquí
```

---

## PASO 4: Reiniciar la Aplicación

### 4.1 Cerrar Sesión
1. En tu aplicación, cierra sesión
2. Cierra el navegador completamente

### 4.2 Volver a Iniciar
1. Abre el navegador
2. Ve a `http://localhost:5173`
3. Inicia sesión con tu email y contraseña

---

## PASO 5: Probar el Sistema

### 5.1 Acceder al Panel de Admin
Ve a: `http://localhost:5173/admin/usuarios`

Deberías ver el panel sin errores.

### 5.2 Crear un Usuario de Prueba
1. Haz clic en "➕ Nuevo Usuario"
2. Completa:
   - Email: `prueba@test.com`
   - Contraseña: `prueba123`
   - Empresa: `Empresa de Prueba`
   - Días: `7`
3. Haz clic en "Crear Usuario"

### 5.3 Verificar que Funciona
1. Cierra sesión
2. Inicia sesión con `prueba@test.com` / `prueba123`
3. Deberías poder acceder al dashboard

---

## PASO 6: Probar el Flujo de Pago

### 6.1 Registrar un Usuario Nuevo
1. Cierra sesión
2. Ve a `/login`
3. Haz clic en "Registrarse"
4. Ingresa un email y contraseña
5. Haz clic en "Registrarse"

### 6.2 Verificar Redirección
Deberías ser redirigido a la página de pago con Yape.

### 6.3 Simular Pago
1. Ingresa un número de celular (ej: 987654321)
2. Ingresa un código de operación (ej: ABC123XYZ)
3. Haz clic en "Continuar"

### 6.4 Aprobar el Pago
1. Abre otra pestaña
2. Inicia sesión como admin
3. Ve a `/admin/pagos`
4. Deberías ver el pago pendiente
5. Haz clic en "✅ Aprobar"

### 6.5 Verificar Activación
1. Vuelve a la pestaña del usuario
2. La página debería detectar que fue aprobado
3. Redirige al dashboard automáticamente

---

## ✅ Checklist Final

Marca cada paso que completes:

- [ ] Ejecutar `supabase-suscripciones.sql` en Supabase
- [ ] Verificar que las 3 tablas se crearon
- [ ] Agregarte como administrador
- [ ] Verificar que apareces en la tabla administradores
- [ ] Cambiar número de Yape en el código
- [ ] Cerrar sesión y volver a entrar
- [ ] Acceder a `/admin/usuarios` sin errores
- [ ] Crear un usuario de prueba desde el panel
- [ ] Verificar que el usuario puede iniciar sesión
- [ ] Probar el flujo de registro + pago
- [ ] Aprobar un pago desde el panel admin
- [ ] Verificar que el usuario obtiene acceso

---

## 🎯 URLs Importantes

Una vez configurado, estas son las URLs principales:

### Para Usuarios Normales:
- Login: `http://localhost:5173/login`
- Dashboard: `http://localhost:5173/dashboard`
- Pago: `http://localhost:5173/pago-yape`
- Espera: `http://localhost:5173/pago-pendiente`

### Para Administradores:
- Gestión de Usuarios: `http://localhost:5173/admin/usuarios`
- Gestión de Pagos: `http://localhost:5173/admin/pagos`

---

## 🆘 Problemas Comunes

### "No tienes permisos de administrador"
**Solución**: Ejecuta el SQL del PASO 2 para agregarte como admin.

### "Table 'administradores' does not exist"
**Solución**: Ejecuta el SQL del PASO 1 primero.

### "Email already exists"
**Solución**: El email ya está registrado. Usa otro o elimina el usuario existente.

### Usuario no puede iniciar sesión después de crearlo
**Solución**: Verifica que la suscripción esté activa en la tabla `suscripciones`.

### Pago no aparece en el panel
**Solución**: Verifica que ejecutaste el SQL correctamente y que las políticas RLS están activas.

---

## 🎉 ¡Sistema Listo!

Una vez completados todos los pasos, tu sistema estará completamente funcional con:

✅ Registro de usuarios con pago por Yape
✅ Panel de administración para crear usuarios
✅ Panel para aprobar pagos
✅ Gestión de suscripciones
✅ Control de acceso por suscripción

---

## 📞 Siguiente Paso

Después de completar el setup, lee:
- `PANEL-ADMIN-USUARIOS.md` - Guía del panel de usuarios
- `SISTEMA-SUSCRIPCIONES.md` - Guía del sistema de pagos
- `ACCESO-ADMIN.md` - Cómo agregar más administradores
