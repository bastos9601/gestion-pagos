# 🔐 Cómo Obtener Acceso de Administrador

## ⚠️ Problema

Ves el mensaje: "No tienes permisos de administrador"

## ✅ Solución

Necesitas agregar tu cuenta a la tabla de administradores en Supabase.

### Paso 1: Ir a Supabase

1. Abre tu proyecto en Supabase: https://supabase.com
2. Ve a la sección **SQL Editor** (icono de código en el menú lateral)

### Paso 2: Ejecutar el SQL

Copia y pega este código en el SQL Editor:

```sql
-- IMPORTANTE: Cambia 'admin@gestionpago.com' por TU email
INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';
```

**⚠️ MUY IMPORTANTE**: Cambia `'admin@gestionpago.com'` por el email que usaste para registrarte.

### Paso 3: Ejecutar

1. Haz clic en el botón **"Run"** o presiona `Ctrl + Enter`
2. Deberías ver un mensaje de éxito

### Paso 4: Verificar

Ejecuta este SQL para verificar que fuiste agregado:

```sql
SELECT * FROM administradores;
```

Deberías ver tu email en la lista.

### Paso 5: Volver a Intentar

1. Cierra sesión en tu aplicación
2. Vuelve a iniciar sesión
3. Intenta acceder a `/admin/usuarios` o `/admin/pagos`
4. Ahora deberías tener acceso

## 🎯 Accesos Rápidos

Una vez que seas administrador, puedes acceder a:

- **Panel de Usuarios**: `http://localhost:5173/admin/usuarios`
  - Crear usuarios directamente
  - Extender suscripciones
  - Cancelar suscripciones

- **Panel de Pagos**: `http://localhost:5173/admin/pagos`
  - Ver pagos pendientes de Yape
  - Aprobar pagos
  - Rechazar pagos

## 🔍 Solución de Problemas

### Error: "duplicate key value"
Ya eres administrador. Cierra sesión y vuelve a entrar.

### Error: "no rows returned"
El email no existe. Verifica que:
1. Te hayas registrado con ese email
2. El email esté escrito correctamente (sin espacios)

### Sigo sin acceso después de agregarlo
1. Cierra sesión completamente
2. Cierra el navegador
3. Abre de nuevo y vuelve a iniciar sesión

## 📝 Agregar Más Administradores

Para agregar otro administrador:

```sql
INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'otro-admin@ejemplo.com';
```

## 🗑️ Remover Administrador

Para quitar permisos de administrador:

```sql
DELETE FROM administradores 
WHERE email = 'usuario@ejemplo.com';
```

## ✅ Checklist

- [ ] Ejecutar `supabase-suscripciones.sql` (si no lo hiciste)
- [ ] Registrarte en la aplicación
- [ ] Ejecutar el SQL para agregarte como admin
- [ ] Cerrar sesión
- [ ] Volver a iniciar sesión
- [ ] Acceder a `/admin/usuarios`
- [ ] ¡Listo!

## 🎉 ¡Ya Eres Administrador!

Ahora puedes:
- ✅ Crear usuarios sin pago
- ✅ Aprobar pagos de Yape
- ✅ Extender suscripciones
- ✅ Gestionar todos los usuarios
