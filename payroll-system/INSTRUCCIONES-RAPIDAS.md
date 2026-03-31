# ⚡ Instrucciones Rápidas - Panel Admin

## 🎯 Problema Actual

Cuando intentas crear un usuario desde el panel admin, sale el error:
```
Error al crear usuario: User not allowed
```

## ✅ Solución en 3 Pasos

### PASO 1: Ejecutar Script en Supabase

1. Abre tu proyecto en **Supabase**: https://supabase.com
2. Ve a **SQL Editor** (icono de código en el menú lateral)
3. Abre el archivo: `supabase-setup-completo-admin.sql`
4. **IMPORTANTE**: En la línea 175, cambia `'admin@gestionpago.com'` por TU email
5. Copia TODO el contenido del archivo
6. Pégalo en el SQL Editor de Supabase
7. Haz clic en **"Run"** o presiona `Ctrl + Enter`

### PASO 2: Verificar Resultados

Al final del script verás 3 tablas de resultados:

**Tabla 1: Tu estado de administrador**
```
✅ ES ADMINISTRADOR
```

**Tabla 2: Verificación de función**
```
es_admin: true
```

**Tabla 3: Funciones creadas**
```
es_administrador        | function
crear_usuario_admin     | function
```

Si ves estos resultados, ¡todo está bien!

### PASO 3: Probar Crear Usuario

1. Ve a tu aplicación: `http://localhost:5173/admin/usuarios`
2. Haz clic en "➕ Nuevo Usuario"
3. Llena el formulario:
   - Email: `prueba@test.com`
   - Contraseña: `test123`
   - Nombre Empresa: `Empresa de Prueba`
   - Duración: `7` días
4. Haz clic en "Crear Usuario"

Deberías ver: **"✅ Usuario creado exitosamente con suscripción activa"**

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Crear usuarios desde el panel admin
- ✅ Los usuarios tienen suscripción activa inmediatamente
- ✅ Los usuarios pueden iniciar sesión de inmediato

## 🔍 Verificar Usuario Creado

1. El usuario aparece en la lista con estado "✅ Activa"
2. Muestra los días restantes correctamente
3. Puedes extender o cancelar su suscripción

## 🧪 Probar Inicio de Sesión

1. Cierra sesión del panel admin
2. Ve a: `http://localhost:5173/login`
3. Inicia sesión con:
   - Email: `prueba@test.com`
   - Contraseña: `test123`
4. Deberías acceder al sistema normalmente

## ❓ Si Algo Sale Mal

### Error: "function crear_usuario_admin does not exist"
- No ejecutaste el script completo
- Vuelve a ejecutar `supabase-setup-completo-admin.sql`

### Error: "No tienes permisos de administrador"
- No cambiaste el email en la línea 175 del script
- Edita el script y pon TU email
- Vuelve a ejecutar

### Error: "El email ya está registrado"
- El email que intentas usar ya existe
- Usa otro email diferente

## 📁 Archivo a Ejecutar

Solo necesitas ejecutar UN archivo:
```
supabase-setup-completo-admin.sql
```

Este archivo incluye TODO lo necesario:
- Corrección de permisos RLS
- Función para verificar administradores
- Función para crear usuarios
- Te agrega como administrador
- Verificaciones automáticas

## 💡 Tip

Guarda el archivo `supabase-setup-completo-admin.sql` porque si en el futuro necesitas agregar otro administrador, solo tienes que:
1. Cambiar el email en la línea 175
2. Ejecutar solo la PARTE 6 del script

## 🚀 Siguiente Paso

Una vez que funcione, puedes:
- Crear usuarios reales para tus clientes
- Gestionar sus suscripciones
- Aprobar pagos de Yape
- Ver estadísticas en el dashboard
