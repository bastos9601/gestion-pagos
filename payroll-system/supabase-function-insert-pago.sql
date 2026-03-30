-- Función para insertar pagos sin problemas de schema cache
CREATE OR REPLACE FUNCTION insertar_pago(
  p_empleado_id UUID,
  p_monto DECIMAL,
  p_tipo VARCHAR,
  p_fecha DATE,
  p_dias_trabajados INTEGER DEFAULT 0,
  p_horas_trabajadas DECIMAL DEFAULT 0,
  p_descuentos DECIMAL DEFAULT 0,
  p_descripcion_descuento TEXT DEFAULT NULL,
  p_descripcion TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  empleado_id UUID,
  monto DECIMAL,
  tipo VARCHAR,
  fecha DATE,
  dias_trabajados INTEGER,
  horas_trabajadas DECIMAL,
  descuentos DECIMAL,
  descripcion_descuento TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ,
  empleado_nombre VARCHAR,
  empleado_cargo VARCHAR,
  empleado_dni VARCHAR,
  empleado_telefono VARCHAR,
  empleado_sueldo_base DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_pago_id UUID;
BEGIN
  INSERT INTO pagos (
    empleado_id,
    monto,
    tipo,
    fecha,
    dias_trabajados,
    horas_trabajadas,
    descuentos,
    descripcion_descuento,
    descripcion
  ) VALUES (
    p_empleado_id,
    p_monto,
    p_tipo,
    p_fecha,
    p_dias_trabajados,
    p_horas_trabajadas,
    p_descuentos,
    p_descripcion_descuento,
    p_descripcion
  )
  RETURNING pagos.id INTO v_pago_id;

  RETURN QUERY
  SELECT 
    p.id,
    p.empleado_id,
    p.monto,
    p.tipo,
    p.fecha,
    p.dias_trabajados,
    p.horas_trabajadas,
    p.descuentos,
    p.descripcion_descuento,
    p.descripcion,
    p.created_at,
    e.nombre as empleado_nombre,
    e.cargo as empleado_cargo,
    e.dni as empleado_dni,
    e.telefono as empleado_telefono,
    e.sueldo_base as empleado_sueldo_base
  FROM pagos p
  JOIN empleados e ON e.id = p.empleado_id
  WHERE p.id = v_pago_id;
END;
$$;
