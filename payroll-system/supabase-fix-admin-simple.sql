-- ============================================
-- FIX SIMPLE: Agregar administrador sin bloques complejos
-- ============================================

-- PASO 1: Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view their own admin status" ON administradores;
DROP POLICY IF EXISTS "Admins can view all admins" ON administradores;
DROP POLICY IF EXISTS "Admins can insert admins" ON administradores;

-- PASO 2: Crear política simple para que usuarios vean su propio registro
CREATE POLICY "Users can view their own admin status"
  ON administradores FOR SELECT
  USING (auth.uid() = user_id);

-- PASO 3: Crear política para que admins vean todo
CREATE POLICY "Admins can view all admins"
  ON administradores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

-- PASO 4: Permitir que admins inserten nuevos admins
CREATE POLICY "Admins can insert admins"
  ON administradores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

-- PASO 5: Eliminar registro duplicado si existe
DELETE FROM administradores 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
);

-- PASO 6: Insertar el administrador
INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';

-- PASO 7: Verificar que se agregó correctamente
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
LEFT JOIN administradores a ON u.id = a.user_id
WHERE u.email = 'admin@gestionpago.com';
