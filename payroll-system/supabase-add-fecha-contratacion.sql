-- Agregar columna fecha_contratacion a la tabla empleados
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS fecha_contratacion DATE;

-- Actualizar empleados existentes con la fecha de creación como fecha de contratación
UPDATE empleados 
SET fecha_contratacion = created_at::DATE 
WHERE fecha_contratacion IS NULL;

-- Comentario: Esta columna permite calcular días trabajados desde la fecha de contratación
COMMENT ON COLUMN empleados.fecha_contratacion IS 'Fecha en que el empleado fue contratado';
