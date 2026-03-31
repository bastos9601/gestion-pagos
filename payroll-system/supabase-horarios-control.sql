-- Script para agregar control de horarios laborales
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar columnas de horario a configuracion_empresa
ALTER TABLE configuracion_empresa 
ADD COLUMN IF NOT EXISTS hora_entrada_laboral TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS hora_salida_laboral TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS tolerancia_minutos INTEGER DEFAULT 15;

-- PASO 2: Agregar columnas de control a asistencias
ALTER TABLE asistencias
ADD COLUMN IF NOT EXISTS estado_entrada VARCHAR(20) DEFAULT 'a_tiempo',
ADD COLUMN IF NOT EXISTS minutos_tardanza INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estado_salida VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS horas_extras DECIMAL(5,2) DEFAULT 0;

-- PASO 3: Crear función para calcular estado de entrada
CREATE OR REPLACE FUNCTION calcular_estado_entrada(
  hora_entrada TIMESTAMP,
  hora_laboral TIME,
  tolerancia INTEGER
)
RETURNS TABLE (
  estado VARCHAR(20),
  minutos_tarde INTEGER
) AS $$
DECLARE
  hora_entrada_time TIME;
  hora_limite TIME;
  diferencia_minutos INTEGER;
BEGIN
  -- Extraer solo la hora de la entrada
  hora_entrada_time := hora_entrada::TIME;
  
  -- Calcular hora límite con tolerancia
  hora_limite := hora_laboral + (tolerancia || ' minutes')::INTERVAL;
  
  -- Calcular diferencia en minutos
  diferencia_minutos := EXTRACT(EPOCH FROM (hora_entrada_time - hora_laboral)) / 60;
  
  IF diferencia_minutos <= 0 THEN
    -- Llegó antes o a tiempo
    RETURN QUERY SELECT 'a_tiempo'::VARCHAR(20), 0::INTEGER;
  ELSIF diferencia_minutos <= tolerancia THEN
    -- Dentro de la tolerancia
    RETURN QUERY SELECT 'a_tiempo'::VARCHAR(20), diferencia_minutos::INTEGER;
  ELSE
    -- Tardanza
    RETURN QUERY SELECT 'tardanza'::VARCHAR(20), diferencia_minutos::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Crear función para calcular estado de salida
CREATE OR REPLACE FUNCTION calcular_estado_salida(
  hora_salida TIMESTAMP,
  hora_laboral TIME
)
RETURNS TABLE (
  estado VARCHAR(20),
  horas_extra DECIMAL(5,2)
) AS $$
DECLARE
  hora_salida_time TIME;
  diferencia_minutos INTEGER;
  horas_extras_calc DECIMAL(5,2);
BEGIN
  -- Extraer solo la hora de la salida
  hora_salida_time := hora_salida::TIME;
  
  -- Calcular diferencia en minutos
  diferencia_minutos := EXTRACT(EPOCH FROM (hora_salida_time - hora_laboral)) / 60;
  
  IF diferencia_minutos < -30 THEN
    -- Salió más de 30 minutos antes
    RETURN QUERY SELECT 'temprano'::VARCHAR(20), 0::DECIMAL(5,2);
  ELSIF diferencia_minutos > 30 THEN
    -- Horas extras (más de 30 minutos después)
    horas_extras_calc := diferencia_minutos / 60.0;
    RETURN QUERY SELECT 'horas_extras'::VARCHAR(20), horas_extras_calc;
  ELSE
    -- Normal
    RETURN QUERY SELECT 'normal'::VARCHAR(20), 0::DECIMAL(5,2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Crear índices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_asistencias_estado_entrada ON asistencias(estado_entrada);
CREATE INDEX IF NOT EXISTS idx_asistencias_estado_salida ON asistencias(estado_salida);

-- PASO 6: Actualizar registros existentes con valores por defecto
UPDATE configuracion_empresa 
SET 
  hora_entrada_laboral = '08:00:00',
  hora_salida_laboral = '18:00:00',
  tolerancia_minutos = 15
WHERE hora_entrada_laboral IS NULL;

UPDATE asistencias
SET 
  estado_entrada = 'a_tiempo',
  minutos_tardanza = 0,
  estado_salida = 'normal',
  horas_extras = 0
WHERE estado_entrada IS NULL;

-- Comentarios sobre los estados:
-- estado_entrada: 'a_tiempo', 'tardanza'
-- estado_salida: 'normal', 'temprano', 'horas_extras'
