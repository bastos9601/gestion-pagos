-- Script SQL para crear las tablas en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  dni VARCHAR(8) NOT NULL,
  telefono VARCHAR(9) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  sueldo_base DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dni)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pago', 'adelanto', 'bono')),
  dias_trabajados INTEGER DEFAULT 0,
  horas_trabajadas DECIMAL(5, 2) DEFAULT 0,
  descuentos DECIMAL(10, 2) DEFAULT 0,
  descripcion_descuento TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencias (opcional)
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('presente', 'ausente', 'tardanza', 'permiso')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, empleado_id, fecha)
);

-- Tabla de configuración de la empresa
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nombre_empresa VARCHAR(255) NOT NULL DEFAULT 'MI EMPRESA S.A.C.',
  ruc VARCHAR(11) NOT NULL DEFAULT '20XXXXXXXXX',
  direccion TEXT NOT NULL DEFAULT 'Av. Principal 123, Lima - Perú',
  telefono VARCHAR(15),
  email VARCHAR(100),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_empleados_user_id ON empleados(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_user_id ON pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_empleado_id ON pagos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_user_id ON asistencias(user_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado_id ON asistencias(empleado_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_configuracion_user_id ON configuracion_empresa(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_empresa ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permite acceso a usuarios autenticados)
-- IMPORTANTE: Ajusta estas políticas según tus necesidades de seguridad

-- Eliminar políticas existentes si existen
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

DROP POLICY IF EXISTS "Usuarios pueden ver su propia configuración" ON configuracion_empresa;
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia configuración" ON configuracion_empresa;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia configuración" ON configuracion_empresa;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su propia configuración" ON configuracion_empresa;

-- Políticas para empleados (cada usuario solo ve sus propios empleados)
CREATE POLICY "Permitir lectura de empleados a usuarios autenticados"
  ON empleados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de empleados a usuarios autenticados"
  ON empleados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de empleados a usuarios autenticados"
  ON empleados FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir eliminación de empleados a usuarios autenticados"
  ON empleados FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para pagos (cada usuario solo ve sus propios pagos)
CREATE POLICY "Permitir lectura de pagos a usuarios autenticados"
  ON pagos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de pagos a usuarios autenticados"
  ON pagos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de pagos a usuarios autenticados"
  ON pagos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir eliminación de pagos a usuarios autenticados"
  ON pagos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para asistencias (cada usuario solo ve sus propias asistencias)
CREATE POLICY "Permitir lectura de asistencias a usuarios autenticados"
  ON asistencias FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserción de asistencias a usuarios autenticados"
  ON asistencias FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualización de asistencias a usuarios autenticados"
  ON asistencias FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Permitir eliminación de asistencias a usuarios autenticados"
  ON asistencias FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para configuración de empresa (solo el usuario puede ver y modificar su propia configuración)
CREATE POLICY "Usuarios pueden ver su propia configuración"
  ON configuracion_empresa FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su propia configuración"
  ON configuracion_empresa FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su propia configuración"
  ON configuracion_empresa FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propia configuración"
  ON configuracion_empresa FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- Triggers para auto-asignar user_id automáticamente

-- Trigger para empleados
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

-- Trigger para pagos
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

-- Trigger para asistencias
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
