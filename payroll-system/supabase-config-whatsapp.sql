-- ============================================
-- CONFIGURACIÓN DE WHATSAPP PARA ADMINISTRADOR
-- ============================================

-- Crear tabla para configuración global del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer la configuración (sin autenticación requerida)
CREATE POLICY "Anyone can read system config"
  ON configuracion_sistema FOR SELECT
  USING (true);

-- Política: Solo administradores pueden actualizar
CREATE POLICY "Admins can update system config"
  ON configuracion_sistema FOR UPDATE
  USING (es_administrador(auth.uid()));

-- Política: Solo administradores pueden insertar
CREATE POLICY "Admins can insert system config"
  ON configuracion_sistema FOR INSERT
  WITH CHECK (es_administrador(auth.uid()));

-- Insertar configuración de WhatsApp por defecto
INSERT INTO configuracion_sistema (clave, valor, descripcion)
VALUES 
  ('whatsapp_admin', '51921146588', 'Número de WhatsApp del administrador para soporte (con código de país)'),
  ('modo_mantenimiento', 'false', 'Activa o desactiva el modo mantenimiento del sistema')
ON CONFLICT (clave) DO NOTHING;

-- Verificar
SELECT * FROM configuracion_sistema WHERE clave IN ('whatsapp_admin', 'modo_mantenimiento');
