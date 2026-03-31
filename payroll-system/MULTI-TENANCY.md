# Multi-Tenancy - Separación de Datos por Usuario

## ¿Qué es Multi-Tenancy?

Multi-tenancy significa que cada usuario registrado tiene su propia base de datos completamente separada. Los datos de un usuario NUNCA se mezclan con los de otro usuario.

## ¿Cómo funciona?

Cada tabla tiene una columna `user_id` que identifica al propietario de los datos:

- **empleados**: Cada usuario solo ve sus propios empleados
- **pagos**: Cada usuario solo ve sus propios pagos
- **asistencias**: Cada usuario solo ve sus propias asistencias
- **configuracion_empresa**: Cada usuario tiene su propia configuración

## Implementación

### Para Base de Datos Nueva

Si estás creando la base de datos desde cero, simplemente ejecuta:

```sql
-- Ejecuta este archivo en el SQL Editor de Supabase
supabase-setup.sql
```

Este archivo ya incluye todo el multi-tenancy configurado.

### Para Base de Datos Existente

Si ya tienes datos en tu base de datos, ejecuta:

```sql
-- Ejecuta este archivo en el SQL Editor de Supabase
supabase-multi-tenancy.sql
```

**IMPORTANTE**: Si ya tienes datos existentes, necesitas asignarles un `user_id`:

```sql
-- Obtén tu user_id desde la tabla auth.users
SELECT id, email FROM auth.users;

-- Asigna todos los datos existentes a tu usuario
UPDATE empleados SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
UPDATE pagos SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
UPDATE asistencias SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
```

## Seguridad (RLS - Row Level Security)

Las políticas RLS garantizan que:

1. ✅ Cada usuario solo puede VER sus propios datos
2. ✅ Cada usuario solo puede CREAR datos para sí mismo
3. ✅ Cada usuario solo puede ACTUALIZAR sus propios datos
4. ✅ Cada usuario solo puede ELIMINAR sus propios datos

## Triggers Automáticos

Los triggers se encargan de asignar automáticamente el `user_id` cuando se crea un nuevo registro:

```sql
-- Cuando insertas un empleado, automáticamente se asigna tu user_id
INSERT INTO empleados (nombre, dni, telefono, cargo, sueldo_base)
VALUES ('Juan Pérez', '12345678', '987654321', 'Operario', 1500.00);
-- El trigger asigna user_id = auth.uid() automáticamente
```

## Ventajas

✅ **Privacidad Total**: Los datos de cada empresa están completamente aislados
✅ **Seguridad**: Imposible que un usuario vea datos de otro
✅ **Escalabilidad**: Puedes tener miles de usuarios sin problemas
✅ **Simplicidad**: No necesitas código adicional en el frontend

## Verificación

Para verificar que funciona correctamente:

1. Crea dos usuarios diferentes (email1@test.com y email2@test.com)
2. Inicia sesión con el primer usuario y crea algunos empleados
3. Cierra sesión e inicia con el segundo usuario
4. Verifica que NO veas los empleados del primer usuario
5. Crea empleados con el segundo usuario
6. Vuelve al primer usuario y verifica que solo veas tus empleados

## Código Frontend

El código frontend NO necesita cambios. Los triggers y políticas RLS se encargan de todo automáticamente.

La aplicación ya está lista para multi-tenancy. Solo necesitas ejecutar el script SQL correspondiente.
