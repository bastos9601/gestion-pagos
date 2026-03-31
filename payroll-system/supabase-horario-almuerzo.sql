-- Script para agregar configuración de horario de almuerzo
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar columnas de horario de almuerzo a configuracion_empresa
ALTER TABLE configuracion_empresa 
ADD COLUMN IF NOT EXISTS hora_inicio_almuerzo TIME DEFAULT '13:00:00',
ADD COLUMN IF NOT EXISTS duracion_almuerzo_minutos INTEGER DEFAULT 90;

-- PASO 2: Actualizar registros existentes con valores por defecto
UPDATE configuracion_empresa 
SET 
  hora_inicio_almuerzo = '13:00:00',
  duracion_almuerzo_minutos = 90
WHERE hora_inicio_almuerzo IS NULL;

-- Comentarios sobre el funcionamiento:
-- hora_inicio_almuerzo: Hora en que inicia el almuerzo (ej: 13:00 = 1:00 PM)
-- duracion_almuerzo_minutos: Duración del almuerzo en minutos (ej: 90 = 1.5 horas)
-- 
-- El sistema restará automáticamente este tiempo del cálculo de horas trabajadas
-- cuando el empleado marque su salida.
