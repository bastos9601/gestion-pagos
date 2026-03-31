-- ============================================
-- SETUP COMPLETO PARA PANEL ADMINISTRATIVO
-- ============================================
-- Ejecuta este script UNA SOLA VEZ en Supabase SQL Editor
-- Incluye: permisos, funciones y corrección de recursión

-- ============================================
-- PARTE 1: Eliminar políticas problemáticas
-- ============================================

DROP POLICY IF EXISTS "Users can view their own admin status" ON administradores;
DROP POLICY IF EXISTS "Admins can view all admins" ON administradores;
DROP POLICY IF EXISTS "Admins can insert admins" ON administradores;
DROP POLICY IF EXISTS "Users can view their own suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Users can insert their own suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Admins can view all suscripciones" ON suscripciones;
DROP POLICY IF EXISTS "Admins can update suscripciones" ON suscripciones;

-- ============================================
-- PARTE 2: Crear políticas simples sin recursión
-- ============================================

CREATE POLICY "Allow users to view own admin record"
  ON administradores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to insert admin"
  ON administradores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own suscripciones"
  ON suscripciones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PARTE 3: Crear función helper para verificar admin
-- ============================================

CREATE OR REPLACE FUNCTION es_administrador(usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM administradores 
    WHERE user_id = usuario_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 4: Políticas para admins usando función helper
-- ============================================

CREATE POLICY "Admins can view all suscripciones"
  ON suscripciones FOR SELECT
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can update suscripciones"
  ON suscripciones FOR UPDATE
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can insert suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (es_administrador(auth.uid()));

-- ============================================
-- PARTE 5: Función para crear usuarios desde panel admin
-- ============================================

CREATE OR REPLACE FUNCTION crear_usuario_admin(
  p_email TEXT,
  p_password TEXT,
  p_nombre_empresa TEXT DEFAULT 'MI EMPRESA S.A.C.',
  p_duracion_dias INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_fecha_inicio DATE;
  v_fecha_vencimiento DATE;
  v_result JSON;
BEGIN
  -- Verificar que quien llama es administrador
  IF NOT es_administrador(auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  -- Calcular fechas
  v_fecha_inicio := CURRENT_DATE;
  v_fecha_vencimiento := CURRENT_DATE + (p_duracion_dias || ' days')::INTERVAL;

  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  -- Crear suscripción activa
  INSERT INTO suscripciones (
    user_id,
    estado,
    fecha_inicio,
    fecha_vencimiento,
    monto
  ) VALUES (
    v_user_id,
    'activa',
    v_fecha_inicio,
    v_fecha_vencimiento,
    50.00
  );

  -- Crear configuración de empresa
  INSERT INTO configuracion_empresa (
    user_id,
    nombre_empresa,
    ruc,
    direccion
  ) VALUES (
    v_user_id,
    p_nombre_empresa,
    '20XXXXXXXXX',
    'Av. Principal 123, Lima - Perú'
  );

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'message', 'Usuario creado exitosamente'
  );

  RETURN v_result;

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El email ya está registrado'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION crear_usuario_admin TO authenticated;
GRANT EXECUTE ON FUNCTION es_administrador TO authenticated;

-- ============================================
-- PARTE 6: Crear vista para obtener emails
-- ============================================

-- Crear vista que combina suscripciones con emails
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

-- Dar permisos de lectura
GRANT SELECT ON vista_usuarios_admin TO authenticated;

-- ============================================
-- PARTE 7: Agregar tu usuario como administrador
-- ============================================
-- IMPORTANTE: Cambia 'admin@gestionpago.com' por TU email

DELETE FROM administradores 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
);

INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';

-- ============================================
-- PARTE 8: Verificación final
-- ============================================

-- Ver tu registro de administrador
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

-- Probar función es_administrador
SELECT es_administrador(
  (SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com')
) as es_admin;

-- Ver funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('es_administrador', 'crear_usuario_admin');

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- Si ves:
-- - "✅ ES ADMINISTRADOR" en la primera consulta
-- - "true" en la segunda consulta
-- - Dos funciones en la tercera consulta
-- 
-- ¡Todo está listo! Ahora puedes:
-- 1. Cerrar sesión en tu aplicación
-- 2. Iniciar sesión en /admin/login
-- 3. Crear usuarios desde el panel admin
-- ============================================

-- Ver funciones creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('es_administrador', 'crear_usuario_admin');

-- Ver vista creada
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'vista_usuarios_admin';

-- Probar vista (ver usuarios con emails)
SELECT * FROM vista_usuarios_admin ORDER BY created_at DESC LIMIT 3;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- Si ves:
-- - "✅ ES ADMINISTRADOR" en la primera consulta
-- - "true" en la segunda consulta
-- - Dos funciones en la tercera consulta
-- - Una vista en la cuarta consulta
-- - Usuarios con emails en la quinta consulta
-- 
-- ¡Todo está listo! Ahora puedes:
-- 1. Cerrar sesión en tu aplicación
-- 2. Iniciar sesión en /admin/login
-- 3. Crear usuarios desde el panel admin
-- 4. Ver los emails correctamente (no más N/A)
-- ============================================
