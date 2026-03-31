-- ============================================
-- FUNCIÓN: Crear usuario desde panel admin
-- ============================================

-- Esta función permite a los administradores crear usuarios
-- sin necesidad de usar la Service Role Key en el frontend

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

  -- Crear usuario en auth.users usando la extensión pgcrypto
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

-- Probar la función (descomenta para probar)
-- SELECT crear_usuario_admin(
--   'prueba@test.com',
--   'test123',
--   'Empresa de Prueba',
--   30
-- );
