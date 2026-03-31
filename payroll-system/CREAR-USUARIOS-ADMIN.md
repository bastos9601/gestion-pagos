# 🔧 Solución: Error al Crear Usuarios desde Panel Admin

## 🎯 Problema Identificado

El error "User not allowed" ocurre porque:
- `supabase.auth.admin.createUser()` requiere la **Service Role Key**
- El frontend solo tiene acceso a la **Anon Key** (clave pública)
- Por seguridad, no se debe exponer la Service Role Key en el frontend

## ✅ Solución Implementada

He creado una **función de Supabase** que permite crear usuarios de forma segura desde el panel admin sin exponer claves sensibles.

## 🚀 Pasos para Activar

### PASO 1: Ejecutar Scripts en Supabase

Debes ejecutar DOS scripts en orden:

#### 1.1 Primero: Corregir Permisos (si no lo hiciste)

1. Ve a **Supabase** → **SQL Editor**
2. Abre el archivo: `supabase-fix-recursion.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

Este script crea la función `es_administrador()` que necesitamos.

#### 1.2 Segundo: Crear Función de Usuario

1. En el mismo **SQL Editor**
2. Abre el archivo: `supabase-function-crear-usuario.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

Este script crea la función `crear_usuario_admin()`.

### PASO 2: Verificar que Funcionó

Ejecuta este SQL para verificar:

```sql
-- Ver funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('es_administrador', 'crear_usuario_admin');
```

Deberías ver ambas funciones listadas.

### PASO 3: Probar Crear Usuario

1. Ve a tu aplicación: `http://localhost:5173/admin/usuarios`
2. Haz clic en "➕ Nuevo Usuario"
3. Llena el formulario:
   - Email: `prueba@test.com`
   - Contraseña: `test123`
   - Nombre Empresa: `Empresa de Prueba`
   - Duración: `7` días
4. Haz clic en "Crear Usuario"

Si todo está bien, verás: "✅ Usuario creado exitosamente con suscripción activa"

### PASO 4: Verificar el Usuario Creado

1. El usuario debería aparecer en la lista
2. Debería tener estado "✅ Activa"
3. Debería mostrar 7 días restantes

### PASO 5: Probar Inicio de Sesión del Usuario

1. Cierra sesión del panel admin
2. Ve a: `http://localhost:5173/login`
3. Inicia sesión con:
   - Email: `prueba@test.com`
   - Contraseña: `test123`
4. Deberías poder acceder al sistema normalmente

## 🔍 Cómo Funciona

### Antes (No Funcionaba)
```javascript
// ❌ Requiere Service Role Key
supabase.auth.admin.createUser({...})
```

### Ahora (Funciona)
```javascript
// ✅ Usa función segura del servidor
supabase.rpc('crear_usuario_admin', {
  p_email: 'usuario@ejemplo.com',
  p_password: 'contraseña',
  p_nombre_empresa: 'Mi Empresa',
  p_duracion_dias: 30
})
```

## 🛡️ Seguridad

La función `crear_usuario_admin()`:
- ✅ Verifica que quien la llama sea administrador
- ✅ Se ejecuta con `SECURITY DEFINER` (permisos elevados)
- ✅ Crea el usuario en `auth.users`
- ✅ Crea la suscripción automáticamente
- ✅ Crea la configuración de empresa
- ✅ Maneja errores (email duplicado, etc.)

## 📋 Lo que Hace la Función

Cuando creas un usuario, la función:

1. **Verifica permisos**: Confirma que eres administrador
2. **Calcula fechas**: Fecha inicio (hoy) y vencimiento (hoy + días)
3. **Crea usuario**: Inserta en `auth.users` con contraseña encriptada
4. **Crea suscripción**: Estado "activa" con fechas calculadas
5. **Crea configuración**: Datos iniciales de la empresa
6. **Retorna resultado**: JSON con éxito o error

## 🔧 Solución de Problemas

### Error: "function crear_usuario_admin does not exist"
- No ejecutaste el script `supabase-function-crear-usuario.sql`
- Ejecuta el script en Supabase SQL Editor

### Error: "function es_administrador does not exist"
- No ejecutaste el script `supabase-fix-recursion.sql` primero
- Ejecuta ese script antes del de crear usuario

### Error: "No tienes permisos de administrador"
- Tu usuario no está en la tabla `administradores`
- Ejecuta el script de permisos primero

### Error: "El email ya está registrado"
- El email que intentas usar ya existe
- Usa otro email o elimina el usuario existente

### El usuario se crea pero no puede iniciar sesión
- Verifica que la contraseña tenga al menos 6 caracteres
- Verifica que el email esté escrito correctamente

## 📁 Archivos Modificados

- `supabase-function-crear-usuario.sql` - Nueva función SQL
- `src/pages/AdminUsuarios.jsx` - Actualizado para usar la función
- `CREAR-USUARIOS-ADMIN.md` - Esta documentación

## ✅ Checklist

- [ ] Ejecutar `supabase-fix-recursion.sql`
- [ ] Ejecutar `supabase-function-crear-usuario.sql`
- [ ] Verificar que ambas funciones existen
- [ ] Probar crear usuario de prueba
- [ ] Verificar que aparece en la lista
- [ ] Probar iniciar sesión con el usuario creado
- [ ] Verificar que tiene acceso al sistema

## 🎉 Resultado Esperado

Una vez completados los pasos:
- ✅ Puedes crear usuarios desde el panel admin
- ✅ Los usuarios se crean con suscripción activa
- ✅ Los usuarios pueden iniciar sesión inmediatamente
- ✅ Todo funciona de forma segura sin exponer claves

## 💡 Ventajas de Esta Solución

1. **Segura**: No expone Service Role Key en el frontend
2. **Simple**: Un solo llamado a función RPC
3. **Completa**: Crea usuario, suscripción y configuración
4. **Robusta**: Maneja errores automáticamente
5. **Auditable**: Todo queda registrado en la base de datos
