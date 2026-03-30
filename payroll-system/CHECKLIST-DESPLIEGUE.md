# ✅ Checklist Pre-Despliegue

Usa esta lista para verificar que todo esté listo antes de desplegar a Netlify.

## 📦 Archivos y Configuración

- [ ] Archivo `netlify.toml` existe en la raíz del proyecto
- [ ] Archivo `.env.example` existe con las variables necesarias
- [ ] Archivo `.env` está en `.gitignore` (NO debe subirse a GitHub)
- [ ] Archivo `_redirects` existe (opcional, ya está en netlify.toml)

## 🔧 Variables de Entorno

- [ ] `VITE_SUPABASE_URL` está configurada
- [ ] `VITE_SUPABASE_ANON_KEY` está configurada
- [ ] Las variables están en formato correcto (VITE_ al inicio)

## 🗄️ Supabase

- [ ] Proyecto de Supabase creado
- [ ] Todas las tablas creadas:
  - [ ] empleados
  - [ ] pagos
  - [ ] asistencias
  - [ ] configuracion_empresa
- [ ] RLS (Row Level Security) habilitado en todas las tablas
- [ ] Políticas RLS configuradas correctamente
- [ ] Authentication habilitado
- [ ] Al menos un usuario creado para login

## 📁 Modelos de Face-api.js

- [ ] Carpeta `public/models` existe
- [ ] Contiene todos los archivos de modelos:
  - [ ] tiny_face_detector_model-shard1
  - [ ] tiny_face_detector_model-weights_manifest.json
  - [ ] face_landmark_68_model-shard1
  - [ ] face_landmark_68_model-weights_manifest.json
  - [ ] face_recognition_model-shard1
  - [ ] face_recognition_model-shard2
  - [ ] face_recognition_model-weights_manifest.json
  - [ ] face_expression_model-shard1
  - [ ] face_expression_model-weights_manifest.json

## 🧪 Pruebas Locales

- [ ] `npm install` ejecutado sin errores
- [ ] `npm run dev` funciona correctamente
- [ ] `npm run build` se completa sin errores
- [ ] Login funciona
- [ ] Registro de empleados funciona
- [ ] Registro de pagos funciona
- [ ] Reconocimiento facial funciona
- [ ] Generación de PDFs funciona
- [ ] No hay errores en la consola del navegador

## 🌐 GitHub (si usas despliegue automático)

- [ ] Repositorio creado en GitHub
- [ ] Código subido a GitHub
- [ ] `.env` NO está en el repositorio
- [ ] Rama principal es `main` o `master`

## 📝 Documentación

- [ ] README.md actualizado
- [ ] Instrucciones de instalación claras
- [ ] Variables de entorno documentadas

## 🚀 Listo para Desplegar

Si marcaste todas las casillas, ¡estás listo para desplegar!

### Comando de Build Local (Verificación Final)

```bash
cd payroll-system
npm run build
```

Si este comando se ejecuta sin errores, puedes proceder con el despliegue.

### Próximo Paso

Sigue las instrucciones en `DESPLEGAR-NETLIFY.md`

---

## 🐛 Si algo falla

### Build falla localmente

1. Revisa los errores en la terminal
2. Verifica que todas las dependencias estén instaladas
3. Asegúrate de que no haya errores de sintaxis
4. Verifica que las importaciones sean correctas

### Build falla en Netlify

1. Revisa los logs de build en Netlify
2. Verifica que las variables de entorno estén configuradas
3. Asegúrate de que `netlify.toml` esté configurado correctamente
4. Verifica que el comando de build sea correcto

### La aplicación no funciona después del despliegue

1. Abre la consola del navegador (F12)
2. Busca errores relacionados con:
   - Supabase (credenciales incorrectas)
   - Modelos de Face-api.js (no se cargan)
   - Rutas (404 errors)
3. Verifica que las variables de entorno estén configuradas en Netlify
4. Verifica que la URL de Netlify esté agregada en Supabase

---

¡Buena suerte con tu despliegue! 🎉
