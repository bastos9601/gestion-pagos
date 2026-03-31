-- ============================================
-- FIX: Políticas RLS para tabla administradores
-- ============================================

-- PASO 1: Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Users can view their own admin status" ON administradores;
DROP POLICY IF EXISTS "Admins can view all admins" ON administradores;

-- PASO 2: Crear política para que usuarios puedan ver si son administradores
CREATE POLICY "Users can view their own admin status"
  ON administradores FOR SELECT
  USING (auth.uid() = user_id);

-- PASO 3: Crear política para que administradores puedan ver todos los admins
CREATE POLICY "Admins can view all admins"
  ON administradores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

-- PASO 4: Permitir que administradores inserten nuevos admins
DROP POLICY IF EXISTS "Admins can insert admins" ON administradores;
CREATE POLICY "Admins can insert admins"
  ON administradores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

-- PASO 5: Verificar que el usuario admin@gestionpago.com existe
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar el user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@gestionpago.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario admin@gestionpago.com NO existe en auth.users';
  ELSE
    RAISE NOTICE '✅ Usuario encontrado: %', v_user_id;
    
    -- Verificar si ya está en administradores
    IF EXISTS (SELECT 1 FROM administradores WHERE user_id = v_user_id) THEN
      RAISE NOTICE '✅ Ya está en tabla administradores';
    ELSE
      RAISE NOTICE '⚠️ NO está en tabla administradores, agregando...';
      
      -- Agregar a administradores
      INSERT INTO administradores (user_id, email)
      VALUES (v_user_id, 'admin@gestionpago.com');
      
      RAISE NOTICE '✅ Agregado exitosamente a administradores';
    END IF;
  END IF;
END $$;

-- PASO 6: Verificación final
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

-- PASO 7: Mostrar todas las políticas de la tabla administradores
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'administradores';
