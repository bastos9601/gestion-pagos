-- Script para implementar Multi-Tenancy (Separación de datos por usuario)
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar columna user_id a todas las tablas
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- PASO 2: Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_user_id ON empleados(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_user_id ON pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_user_id ON asistencias(user_id);

-- PASO 3: Eliminar políticas antiguas
DROP POLICY IF EXISTS "Permitir lectura de empleados a usuarios autenticados" ON empleados;
DROP POLICY IF EXISTS "Permitir inserción de empleados a usuarios autenticados" ON empleados;
DROP POLICY IF EXISTS "Permitir actualización de empleados a usuarios autenticados" ON empleados;
DROP POLICY IF EXISTS "Permitir eliminación de empleados a usuarios autenticados" ON empleados;

DROP POLICY IF EXISTS "Permitir lectura de pagos a usuarios autenticados" ON pagos;
DROP POLICY IF EXISTS "Permitir inserción de pagos a usuarios autenticados" ON pagos;
DROP POLICY IF EXISTS "Permitir actualización de pagos a usuarios autenticados" ON pagos;
DROP POLICY IF EXISTS "Permitir eliminación de pagos a usuarios autenticados" ON pagos;

DROP POLICY IF EXISTS "Permitir lectura de asistencias a usuarios autenticados" ON asistencias;
DROP POLICY IF EXISTS "Permitir inserción de asistencias a usuarios autenticados" ON asistencias;
DROP POLICY IF EXISTS "Permitir actualización de asistencias a usuarios autenticados" ON asistencias;
DROP POLICY IF EXISTS "Permitir eliminación de asistencias a usuarios autenticados" ON asistencias;

-- PASO 4: Crear nuevas políticas RLS para multi-tenancy

-- Políticas para EMPLEADOS (cada usuario solo ve sus propios empleados)
CREATE POLICY "Usuarios pueden ver sus propios empleados"
  ON empleados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios empleados"
  ON empleados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios empleados"
  ON empleados FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios empleados"
  ON empleados FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para PAGOS (cada usuario solo ve sus propios pagos)
CREATE POLICY "Usuarios pueden ver sus propios pagos"
  ON pagos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios pagos"
  ON pagos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios pagos"
  ON pagos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios pagos"
  ON pagos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para ASISTENCIAS (cada usuario solo ve sus propias asistencias)
CREATE POLICY "Usuarios pueden ver sus propias asistencias"
  ON asistencias FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias asistencias"
  ON asistencias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias asistencias"
  ON asistencias FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias asistencias"
  ON asistencias FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PASO 5: Crear función para obtener el user_id actual
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 6: Crear trigger para auto-asignar user_id en empleados
CREATE OR REPLACE FUNCTION set_user_id_empleados()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_user_id_empleados ON empleados;
CREATE TRIGGER trigger_set_user_id_empleados
  BEFORE INSERT ON empleados
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_empleados();

-- PASO 7: Crear trigger para auto-asignar user_id en pagos
CREATE OR REPLACE FUNCTION set_user_id_pagos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_user_id_pagos ON pagos;
CREATE TRIGGER trigger_set_user_id_pagos
  BEFORE INSERT ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_pagos();

-- PASO 8: Crear trigger para auto-asignar user_id en asistencias
CREATE OR REPLACE FUNCTION set_user_id_asistencias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_user_id_asistencias ON asistencias;
CREATE TRIGGER trigger_set_user_id_asistencias
  BEFORE INSERT ON asistencias
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_asistencias();

-- NOTA IMPORTANTE:
-- Si ya tienes datos existentes en las tablas, necesitas asignarles un user_id manualmente.
-- Ejemplo para asignar todos los datos existentes a un usuario específico:
-- UPDATE empleados SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE pagos SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
-- UPDATE asistencias SET user_id = 'TU_USER_ID_AQUI' WHERE user_id IS NULL;
