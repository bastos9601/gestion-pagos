-- Script para prevenir marcas dobles de entrada/salida
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_prevenir_marca_duplicada ON asisteas;
DROP FUNCTION IF EXISTS p

-- PASO 2: Crear licadas
CREATE OR REPLACE FUNCTION prevenir
RETURNS TRIGGER AS $$
DECLARE
  registro_existente RECORD;
BEGIN
hoy
  SELECT * INTO registro_existente
  FROM asistencias
  WHERE empleado_id =_id
    AND
  LIMIT 1;

  IF FOUND THEN
    -- Ya existe un registro
    IF registro_exN
      -- Ya tiene entrada y salida coas
      RAISE EXCEPTION 'Ya
    ELSE
      -- Ya tiene entrada o salida
      RAIS;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGEql;

gger
CREATE TRIGGE
  BEcias
  FOR EACH ROW
icada();

-- PASO 4: Limpiar registros duplicados existentes (mantener solo el pr
DELETE FROM asistencias a
USING asistencias b
WHERE a.id > b.id
  AND a.empleado_id = b.empleado_id
cha
  AND a.hora_entrada IS NOT NULL
  AND b.hora_entrada IS NOT NULL;

dimiento
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado_fecha_hora 
ON asistencias(empleado_id, fecha, hora_entrada);ficar que funciona'Triggerus;
S statente' Arectamnstalado cor i
SELECT 
-- Veri
