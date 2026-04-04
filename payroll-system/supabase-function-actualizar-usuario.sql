-- Función para actualizar contraseña y monto de usuario desde el panel admin
-- Esta función debe ejecutarse en Supabase SQL Editor

CREATE OR REPLACE FUNCTION actualizar_usuario_admin(
  p_user_id UUID,
  p_nueva_password TEXT DEFAULT NULL,
  p_nuevo_monto DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Actualizar contraseña si se proporcionó
  IF p_nueva_password IS NOT NULL AND LENGTH(p_nueva_password) >= 6 THEN
    -- Actualizar en auth.users usando extensión
    UPDATE auth.users
    SET 
      encrypted_password = crypt(p_nueva_password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Usuario no encontrado'
      );
    END IF;
  END IF;

  -- Actualizar monto en suscripción si se proporcionó
  IF p_nuevo_monto IS NOT NULL THEN
    UPDATE suscripciones
    SET monto = p_nuevo_monto
    WHERE user_id = p_user_id;
  END IF;

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Usuario actualizado correctamente'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION actualizar_usuario_admin TO authenticated;
GRANT EXECUTE ON FUNCTION actualizar_usuario_admin TO service_role;

-- Comentario
COMMENT ON FUNCTION actualizar_usuario_admin IS 'Permite a los administradores actualizar contraseña y monto de usuarios';
