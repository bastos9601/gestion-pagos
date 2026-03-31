-- ============================================
-- SETUP COMPLETO - VERSION LIMPIA
-- ============================================
-- Este script elimina todo y lo recrea desde cero

-- PASO 1: Eliminar TODAS las politicas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'administradores') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON administradores';
    END LOOP;
    
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'suscripciones') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON suscripciones';
    END LOOP;
END $$;

-- PASO 2: Eliminar funciones si existen
DROP FUNCTION IF EXISTS crear_usuario_admin(TEXT, TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS es_administrador(UUID);

-- PASO 3: Eliminar vista si existe
DROP VIEW IF EXISTS vista_usuarios_admin;

-- PASO 4: Crear funcion es_administrador
CREATE FUNCTION es_administrador(usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM administradores 
    WHERE user_id = usuario_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear politicas para administradores
CREATE POLICY "Allow users to view own admin record"
  ON administradores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Allow authenticated users to insert admin"
  ON administradores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- PASO 6: Crear politicas para suscripciones
CREATE POLICY "Users can view own suscripciones"
  ON suscripciones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all suscripciones"
  ON suscripciones FOR SELECT
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can update suscripciones"
  ON suscripciones FOR UPDATE
  USING (es_administrador(auth.uid()));

CREATE POLICY "Admins can insert suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (es_administrador(auth.uid()));

-- PASO 7: Crear funcion para crear usuarios
CREATE FUNCTION crear_usuario_admin(
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
  IF NOT es_administrador(auth.uid()) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador';
  END IF;

  v_fecha_inicio := CURRENT_DATE;
  v_fecha_vencimiento := CURRENT_DATE + (p_duracion_dias || ' days')::INTERVAL;

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

  INSERT INTO configuracion_empresa (
    user_id,
    nombre_empresa,
    ruc,
    direccion
  ) VALUES (
    v_user_id,
    p_nombre_empresa,
    '20XXXXXXXXX',
    'Av. Principal 123, Lima - Peru'
  );

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
      'error', 'El email ya esta registrado'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 8: Dar permisos
GRANT EXECUTE ON FUNCTION crear_usuario_admin TO authenticated;
GRANT EXECUTE ON FUNCTION es_administrador TO authenticated;

-- PASO 9: Crear vista para emails
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
  u.email
FROM suscripciones s
LEFT JOIN auth.users u ON s.user_id = u.id;

GRANT SELECT ON vista_usuarios_admin TO authenticated;

-- PASO 10: Agregar como administrador
-- CAMBIA 'admin@gestionpago.com' POR TU EMAIL

DELETE FROM administradores 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com'
);

INSERT INTO administradores (user_id, email)
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@gestionpago.com';

-- PASO 11: Verificaciones
SELECT 'VERIFICACION 1: Tu estado de administrador' as verificacion;
SELECT 
  u.email,
  CASE 
    WHEN a.id IS NOT NULL THEN 'ES ADMINISTRADOR'
    ELSE 'NO ES ADMINISTRADOR'
  END as estado
FROM auth.users u
LEFT JOIN administradores a ON u.id = a.user_id
WHERE u.email = 'admin@gestionpago.com';

SELECT 'VERIFICACION 2: Funcion es_administrador' as verificacion;
SELECT es_administrador(
  (SELECT id FROM auth.users WHERE email = 'admin@gestionpago.com')
) as es_admin;

SELECT 'VERIFICACION 3: Funciones creadas' as verificacion;
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('es_administrador', 'crear_usuario_admin');

SELECT 'VERIFICACION 4: Vista creada' as verificacion;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'vista_usuarios_admin';

SELECT 'VERIFICACION 5: Usuarios con emails' as verificacion;
SELECT email, estado, fecha_vencimiento 
FROM vista_usuarios_admin 
ORDER BY created_at DESC 
LIMIT 3;
