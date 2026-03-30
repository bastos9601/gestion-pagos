-- Script para agregar TODAS las columnas necesarias a la tabla pagos
-- Ejecuta este script completo en el SQL Editor de Supabase

-- Agregar dias_trabajados si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'dias_trabajados'
    ) THEN
        ALTER TABLE pagos ADD COLUMN dias_trabajados INTEGER DEFAULT 0;
    END IF;
END $$;

-- Agregar horas_trabajadas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'horas_trabajadas'
    ) THEN
        ALTER TABLE pagos ADD COLUMN horas_trabajadas DECIMAL(5, 2) DEFAULT 0;
    END IF;
END $$;

-- Agregar descuentos si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'descuentos'
    ) THEN
        ALTER TABLE pagos ADD COLUMN descuentos DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Agregar descripcion_descuento si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagos' AND column_name = 'descripcion_descuento'
    ) THEN
        ALTER TABLE pagos ADD COLUMN descripcion_descuento TEXT;
    END IF;
END $$;

-- Verificar las columnas creadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'pagos' 
ORDER BY ordinal_position;
