-- ============================================
-- SCRIPT DE ASISTENCIAS CON RECONOCIMIENTO FACIAL
-- ============================================

-- PASO 1: Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS asistencias CASCADE;

-- PASO 2: Crear tabla de asistencias
CREATE TABLE asistencias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_entrada TIMESTAMP,
  hora_salida TIMESTAMP,
  horas_trabajadas DECIMAL(5,2),
  metodo_registro VARCHAR(20) DEFAULT 'facial',
  foto_verificacion TEXT,
  confianza_reconocimiento DECIMAL(5,2),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, empleado_id, fecha)
);

-- PASO 3: Agregar columnas a empleados para reconocimiento facial
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS face_descriptors JSONB;

ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS foto_referencia TEXT;

ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- PASO 4: Crear índices
CREATE INDEX idx_asistencias_empleado ON asistencias(empleado_id);
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_user ON asistencias(user_id);

-- PASO 5: Habilitar RLS
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- PASO 6: Crear políticas RLS
CREATE POLICY "Users can view their own asistencias"
  ON asistencias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own asistencias"
  ON asistencias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own asistencias"
  ON asistencias FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own asistencias"
  ON asistencias FOR DELETE
  USING (auth.uid() = user_id);

-- PASO 7: Crear trigger para auto-asignar user_id
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
