-- Script para verificar y corregir permisos de administrador

-- PASO 1: Ver todos los usuarios registrados
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- PASO 2: Ver todos los administradores actuales
SELECT * FROM administradores;

-- PASO 3: Verificar si admin@gestionpago.com está en administradores
SELECT a.*, u.email 
FROM administradores a
JOIN auth.users u ON a.user_id = u.id
WHERE u.email = 'admin@gestionpago.com';

-- PASO 4: Si NO aparece, agregarlo (ejecuta solo si el paso 3 no devuelve nada)
-- Descomenta las siguientes líneas si necesitas agregarlo:

-- DELETE FROM administradores WHERE user_id IN (
--   SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
-- );

-- INSERT INTO administradores (user_id, email)
-- SELECT id, email 
-- FROM auth.users 
-- WHERE email = 'admin@gestionpago.com';

-- PASO 5: Verificar que se agregó correctamente
SELECT 
  u.id as user_id,
  u.email,
  a.id as admin_id,
  a.created_at as admin_desde,
  CASE 
    WHEN a.id IS NOT NULL THEN '✅ ES ADMINISTRADOR'
    ELSE '❌ NO ES ADMINISTRADOR'
  END as estado
FROM auth.users u
LEFT JOIN administradores a ON u.user_id = a.user_id
WHERE u.email = 'admin@gestionpago.com';
