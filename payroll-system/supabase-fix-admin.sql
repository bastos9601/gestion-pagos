-- ============================================
-- FIX: Agregar user_id al administrador
-- ============================================

-- OPCIÓN 1: Si ya tienes un usuario creado con email admin@gestionpago.com
-- Actualizar el registro existente con el user_id correcto
UPDATE administradores
SET user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
)
WHERE email = 'admin@gestionpago.com';

-- OPCIÓN 2: Si no tienes el usuario creado, primero créalo en Supabase Auth
-- Ve a Authentication > Users > Add User en el dashboard de Supabase
-- Email: admin@gestionpago.com
-- Password: admin123 (o la que prefieras)
-- Luego ejecuta la query de OPCIÓN 1

-- OPCIÓN 3: Eliminar el registro actual e insertar uno nuevo correctamente
-- DELETE FROM administradores WHERE email = 'admin@gestionpago.com';
-- INSERT INTO administradores (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'admin@gestionpago.com';

-- Verificar que quedó bien
SELECT 
  a.id,
  a.user_id,
  a.email,
  u.email as auth_email,
  a.created_at
FROM administradores a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE a.email = 'admin@gestionpago.com';
