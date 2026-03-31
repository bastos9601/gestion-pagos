-- ============================================
-- SCRIPT DE SUSCRIPCIONES CON PAGO POR YAPE
-- ============================================

-- PASO 1: Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'activa', 'vencida', 'cancelada'
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  monto DECIMAL(10,2) DEFAULT 50.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PASO 2: Crear tabla de pagos
CREATE TABLE IF NOT EXISTS pagos_yape (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suscripcion_id UUID REFERENCES suscripciones(id) ON DELETE CASCADE,
  email_usuario VARCHAR(255) NOT NULL,
  celular_yape VARCHAR(15) NOT NULL,
  codigo_operacion VARCHAR(50) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  notas_admin TEXT,
  aprobado_por UUID REFERENCES auth.users(id),
  fecha_aprobacion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PASO 3: Crear tabla de administradores
CREATE TABLE IF NOT EXISTS administradores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- PASO 4: Crear índices
CREATE INDEX IF NOT EXISTS idx_suscripciones_user ON suscripciones(user_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_user ON pagos_yape(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos_yape(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_codigo ON pagos_yape(codigo_operacion);

-- PASO 5: Habilitar RLS
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_yape ENABLE ROW LEVEL SECURITY;
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;

-- PASO 6: Políticas RLS para suscripciones
CREATE POLICY "Users can view their own suscripciones"
  ON suscripciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suscripciones"
  ON suscripciones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PASO 7: Políticas RLS para pagos
CREATE POLICY "Users can view their own pagos"
  ON pagos_yape FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pagos"
  ON pagos_yape FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PASO 8: Políticas para administradores (pueden ver todo)
CREATE POLICY "Admins can view all pagos"
  ON pagos_yape FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update pagos"
  ON pagos_yape FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all suscripciones"
  ON suscripciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update suscripciones"
  ON suscripciones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM administradores 
      WHERE user_id = auth.uid()
    )
  );

-- PASO 9: Función para verificar suscripción activa
CREATE OR REPLACE FUNCTION tiene_suscripcion_activa(usuario_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM suscripciones 
    WHERE user_id = usuario_id 
      AND estado = 'activa' 
      AND fecha_vencimiento >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 10: Función para activar suscripción
CREATE OR REPLACE FUNCTION activar_suscripcion(pago_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_suscripcion_id UUID;
BEGIN
  -- Obtener user_id del pago
  SELECT user_id, suscripcion_id INTO v_user_id, v_suscripcion_id
  FROM pagos_yape
  WHERE id = pago_id;

  -- Actualizar suscripción
  UPDATE suscripciones
  SET 
    estado = 'activa',
    fecha_inicio = CURRENT_DATE,
    fecha_vencimiento = CURRENT_DATE + INTERVAL '30 days',
    updated_at = NOW()
  WHERE id = v_suscripcion_id;

  -- Actualizar pago
  UPDATE pagos_yape
  SET 
    estado = 'aprobado',
    fecha_aprobacion = NOW(),
    aprobado_por = auth.uid()
  WHERE id = pago_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 11: Insertar primer administrador (CAMBIA EL EMAIL)
-- Ejecuta esto después de crear tu primera cuenta
-- INSERT INTO administradores (user_id, email)
-- SELECT id, email FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com