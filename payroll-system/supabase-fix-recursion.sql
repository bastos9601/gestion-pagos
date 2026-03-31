-- ============================================
-- FIX: Eliminar recursión infinita en políticas RLS
-- ============================================

-- PASO 1: Eliminar TODAS las políticas de administradores
DROP POLICY IF EXISTS "Users can view their own admin status" ON administradores;
DROP POLICY IF EXISTS "Admins can view all admins" ON administradores;
DROP POLICY IF EXISTS "Admins can insert admins" ON administradores;
DROP POLICY IF EXISTS "Users can view their own suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Users can insert their own suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Admins can view all suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Admins can update suscripciones" ON suscripciones;

-- PASO 2: Crear UNA SOLA política simple para administradores
-- Esta política NO causa recursión porque solo verifica el user_id directamente
CREATE POLICY "Allow users to view own admin record"
  ON administradores FOR SELECT
  USING (user_id = auth.uid());

-- PASO 3: Permitir a cualquier usuario autenticado insertar en administradores
-- (esto es temporal, luego lo restringiremos desde la aplicación)
CREATE POLICY "Allow authenticated users to insert admin"
  ON administradores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- PASO 4: Recrear políticas de suscripciones SIN recursión
CREATE POLICY "Users can view own suscripciones"
  ON suscripciones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- PASO 5: Para admins, usar una función que NO cause recursión
-- Crear función helper que verifica admin sin causar recursión
CREATE OR REPLACE FUNCTION es_administrador(usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM administradores 
    WHERE user_id = usuario_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Políticas para admins usando la función helper
CREATE POLICY "Admins can view all suscripciones"
  ON suscripciones FOR SELECT
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can update suscripciones"
  ON suscripciones FOR UPDATE
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can insert suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (es_administrador(auth.uid()));

-- PASO 7: Limpiar y reinsertar el administrador
DELETE FROM administradores 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
);

INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';

-- PASO 8: Verificación final
SELECT 
  u.id as user_id,
  u.email,
  a.id as admin_id,
  CASE 
    WHEN a.id IS NOT NULL THEN '✅ ES ADMINISTRADOR'
    ELSE '❌ NO ES ADMINISTRADOR'
  END as estado
FROM auth.users u
LEFT JOIN administradores a ON u.id = a.user_id
WHERE u.email = 'admin@gestionpago.com';

-- PASO 9: Probar la función
SELECT es_administrador(
  (SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com')
) as es_admin;
