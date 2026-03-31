-- ============================================
-- VISTA: Usuarios con emails para panel admin
-- ============================================

-- Crear vista que combina suscripciones con emails de auth.users
CREATE OR REPLACE VIEW vista_usuarios_admin AS
SELECT 
  s.id,
  s.user_id,
  s.estado,
  s.fecha_inicio,
  s.fecha_vencimiento,
  s.monto,
  s.created_at,
  s.updated_at,
  u.email
FROM suscripciones s
LEFT JOIN auth.users u ON s.user_id = u.id;

-- Dar permisos de lectura a usuarios autenticados
GRANT SELECT ON vista_usuarios_admin TO authenticated;

-- Crear política RLS para la vista
ALTER VIEW vista_usuarios_admin SET (security_invoker = on);

-- Verificar que funciona
SELECT * FROM vista_usuarios_admin ORDER BY created_at DESC LIMIT 5;
