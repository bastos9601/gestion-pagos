-- Script para agregar columnas de descuentos a la tabla pagos existente
-- Ejecuta este script si ya tienes la tabla pagos creada

-- Agregar columna de descuentos
ALTER TABLE pagos 
ADD COLUMN IF NOT EXISTS descuentos DECIMAL(10, 2) DEFAULT 0;

-- Agregar columna de descripción del descuento
ALTER TABLE pagos 
ADD COLUMN IF NOT EXISTS descripcion_descuento TEXT;
