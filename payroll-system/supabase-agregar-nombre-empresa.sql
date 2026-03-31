-- ============================================
-- AGREGAR NOMBRE DE EMPRESA A LA VISTA
-- ============================================

-- Recrear la vista incluyendo el nombre de la empresa
DROP VIEW IF EXISTS vista_usuarios_admin;

CREATE VIEW vista_usuarios_admin AS
SELECT 
  s.id,
  s.user_id,
  s.estado,
  s.fecha_inicio,
  s.fecha_vencimiento,
  s.monto,
  s.created_at,
  s.updated_at,
  u.email,
  c.nombre_empresa
FROM suscripciones s
LEFT JOIN auth.users u ON s.user_id = u.id
LEFT JOIN configuracion_empresa c ON s.user_id = c.user_id;

GRANT SELECT ON vista_usuarios_admin TO authenticated;

-- Verificar que funciona
SELECT email, nombre_empresa, estado, fecha_vencimiento 
FROM vista_usuarios_admin 
ORDER BY created_at DESC 
LIMIT 5;
