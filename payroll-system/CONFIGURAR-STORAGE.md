# Configurar Storage en Supabase para Firmas Digitales

## Pasos para configurar el almacenamiento de firmas:

### 1. Crear el Bucket de Storage

1. Ve a tu proyecto en Supabase Dashboard
2. En el menú lateral, haz clic en "Storage"
3. Haz clic en "Create a new bucket"
4. Configura el bucket:
   - **Name**: `public`
   - **Public bucket**: ✅ Activado (para que las firmas sean accesibles públicamente)
5. Haz clic en "Create bucket"

### 2. Crear la carpeta para firmas

1. Entra al bucket `public` que acabas de crear
2. Haz clic en "Create folder"
3. Nombre de la carpeta: `firmas`
4. Haz clic en "Create"

### 3. Configurar políticas de acceso (RLS)

Ejecuta este SQL en el SQL Editor de Supabase:

```sql
-- Política para permitir que usuarios autenticados suban firmas
CREATE POLICY "Usuarios pueden subir sus firmas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public' AND (storage.foldername(name))[1] = 'firmas');

-- Política para permitir lectura pública de firmas
CREATE POLICY "Firmas son públicamente accesibles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'firmas');

-- Política para permitir actualizar firmas propias
CREATE POLICY "Usuarios pueden actualizar sus firmas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'firmas');

-- Política para permitir eliminar firmas propias
CREATE POLICY "Usuarios pueden eliminar sus firmas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'firmas');
```

### 4. Agregar columna firma_url a la tabla

Ejecuta el script `supabase-add-firma.sql` en el SQL Editor:

```sql
ALTER TABLE configuracion_empresa 
ADD COLUMN IF NOT EXISTS firma_url TEXT;
```

### 5. Probar la funcionalidad

1. Ve a la página de Configuración en tu aplicación
2. Sube una imagen de firma (PNG o JPG, máximo 2MB)
3. Guarda la configuración
4. La firma aparecerá en las boletas de pago generadas

## Formatos de imagen recomendados:

- **PNG con fondo transparente** (recomendado)
- JPG con fondo blanco
- Tamaño recomendado: 400x150 píxeles
- Peso máximo: 2MB

## Notas:

- La firma se almacena en Supabase Storage
- Es accesible públicamente para que aparezca en las boletas
- Cada usuario puede tener su propia firma
- La firma se muestra automáticamente en todas las boletas generadas
