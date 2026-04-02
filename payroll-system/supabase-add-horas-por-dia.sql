-- Agregar columna horas_por_dia a la tabla configuracion_empresa
ALTER TABLE configuracion_empresa 
ADD COLUMN IF NOT EXISTS horas_por_dia DECIMAL(4, 2) DEFAULT 8.0;

-- Actualizar configuraciones existentes con 8 horas por defecto
UPDATE configuracion_empresa 
SET horas_por_dia = 8.0 
WHERE horas_por_dia IS NULL;

-- Comentario: Esta columna define cuántas horas tiene un día laboral estándar
COMMENT ON COLUMN configuracion_empresa.horas_por_dia IS 'Horas estándar de trabajo por día (usado para calcular pago por hora)';
