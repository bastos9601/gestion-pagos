-- Función para eliminar usuario desde el panel admin
-- Esta función debe ejecutarse en Supabase SQL Editor

CREATE OR REPLACE FUNCTION eliminar_usuario_admin(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Primero eliminar la suscripción
  DELETE FROM suscripciones WHERE user_id = p_user_id;

  -- Luego eliminar el usuario de auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'message', 'Usuario eliminado correctamente'
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
GRANT EXECUTE ON FUNCTION eliminar_usuario_admin TO authenticated;
GRANT EXECUTE ON FUNCTION eliminar_usuario_admin TO service_role;

-- Comentario
COMMENT ON FUNCTION eliminar_usuario_admin IS 'Permite a los administradores eliminar usuarios y sus suscripciones';
