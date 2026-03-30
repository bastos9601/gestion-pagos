-- Agregar campo para firma digital del empleador
ALTER TABLE configuracion_empresa 
ADD COLUMN IF NOT EXISTS firma_url TEXT;

-- Verificar la columna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'configuracion_empresa' 
ORDER BY ordinal_position;
