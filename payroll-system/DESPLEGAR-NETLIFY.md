# 🚀 Guía de Despliegue en Netlify

## 📋 Requisitos Previos

1. ✅ Cuenta en [Netlify](https://www.netlify.com/) (gratis)
2. ✅ Cuenta en [GitHub](https://github.com/) (opcional, pero recomendado)
3. ✅ Proyecto de Supabase configurado
4. ✅ Variables de entorno configuradas

---

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Verificar que el archivo `.env` NO esté en el repositorio

El archivo `.env` debe estar en `.gitignore` para no exponer tus credenciales.

Verifica que `.gitignore` contenga:
```
.env
.env.local
.env.production
```

### 1.2 Verificar el archivo `.env.example`

Asegúrate de tener un archivo `.env.example` con las variables necesarias (sin valores reales):

```env
VITE_SUPABASE_URL=tu_supabase_url_aqui
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

### 1.3 Construir localmente para verificar

```bash
cd payroll-system
npm run build
```

Si el build es exitoso, estás listo para desplegar.

---

## 🌐 Paso 2: Desplegar en Netlify

### Opción A: Despliegue desde GitHub (Recomendado)

#### 1. Subir el proyecto a GitHub

```bash
# Inicializar git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Preparar proyecto para despliegue en Netlify"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/tu-repositorio.git
git branch -M main
git push -u origin main
```

#### 2. Conectar Netlify con GitHub

1. Ve a [Netlify](https://app.netlify.com/)
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Selecciona **"GitHub"**
4. Autoriza a Netlify para acceder a tus repositorios
5. Selecciona tu repositorio

#### 3. Configurar el Build

Netlify debería detectar automáticamente la configuración desde `netlify.toml`, pero verifica:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: `payroll-system`

#### 4. Agregar Variables de Entorno

En la configuración del sitio en Netlify:

1. Ve a **Site settings** → **Environment variables**
2. Haz clic en **"Add a variable"**
3. Agrega las siguientes variables:

```
VITE_SUPABASE_URL = tu_supabase_url_real
VITE_SUPABASE_ANON_KEY = tu_supabase_anon_key_real
```

**IMPORTANTE**: Usa los valores reales de tu proyecto de Supabase.

#### 5. Desplegar

1. Haz clic en **"Deploy site"**
2. Espera a que termine el build (2-5 minutos)
3. ¡Tu sitio estará en línea!

---

### Opción B: Despliegue Manual (Drag & Drop)

#### 1. Construir el proyecto localmente

```bash
cd payroll-system
npm run build
```

Esto creará una carpeta `dist` con los archivos de producción.

#### 2. Configurar Variables de Entorno Localmente

Antes de construir, crea un archivo `.env.production`:

```env
VITE_SUPABASE_URL=tu_supabase_url_real
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key_real
```

Luego construye nuevamente:

```bash
npm run build
```

#### 3. Desplegar en Netlify

1. Ve a [Netlify](https://app.netlify.com/)
2. Arrastra la carpeta `dist` a la zona de "Drag and drop"
3. Espera a que se suba
4. ¡Tu sitio estará en línea!

**NOTA**: Con esta opción, cada vez que hagas cambios deberás construir y subir manualmente.

---

## 🔒 Paso 3: Configurar Dominio Personalizado (Opcional)

### 3.1 Usar subdominio de Netlify

Por defecto, Netlify te da un dominio como: `random-name-123.netlify.app`

Puedes cambiarlo:
1. Ve a **Site settings** → **Domain management**
2. Haz clic en **"Options"** → **"Edit site name"**
3. Cambia a algo como: `bradatec-payroll.netlify.app`

### 3.2 Usar tu propio dominio

Si tienes un dominio propio:
1. Ve a **Site settings** → **Domain management**
2. Haz clic en **"Add custom domain"**
3. Sigue las instrucciones para configurar los DNS

---

## 🔐 Paso 4: Configurar Supabase para Producción

### 4.1 Agregar URL de Netlify a Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com/)
2. Ve a **Authentication** → **URL Configuration**
3. Agrega tu URL de Netlify a **Site URL**:
   ```
   https://tu-sitio.netlify.app
   ```
4. Agrega también a **Redirect URLs**:
   ```
   https://tu-sitio.netlify.app/**
   ```

### 4.2 Verificar RLS (Row Level Security)

Asegúrate de que todas las políticas RLS estén configuradas correctamente en Supabase.

---

## 🧪 Paso 5: Probar el Sitio en Producción

### Checklist de Pruebas:

- [ ] Login funciona correctamente
- [ ] Registro de empleados funciona
- [ ] Registro de pagos funciona
- [ ] Reconocimiento facial funciona (modelos cargados)
- [ ] Generación de PDFs funciona
- [ ] Historial de asistencias funciona
- [ ] Dashboard muestra datos correctos
- [ ] Responsive funciona en móvil

---

## 🔄 Paso 6: Actualizaciones Futuras

### Con GitHub (Automático):

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push
   ```
3. Netlify detectará los cambios y desplegará automáticamente

### Manual:

1. Haz cambios en tu código local
2. Construye nuevamente:
   ```bash
   npm run build
   ```
3. Arrastra la carpeta `dist` a Netlify

---

## 🐛 Solución de Problemas

### Error: "Build failed"

**Causa**: Falta alguna dependencia o hay errores en el código.

**Solución**:
1. Revisa los logs de build en Netlify
2. Verifica que `npm run build` funcione localmente
3. Asegúrate de que todas las dependencias estén en `package.json`

### Error: "Page not found" al recargar

**Causa**: Falta configuración de redirects para SPA.

**Solución**:
- Verifica que exista el archivo `netlify.toml`
- O crea un archivo `_redirects` en la carpeta `public`

### Error: "Supabase connection failed"

**Causa**: Variables de entorno no configuradas.

**Solución**:
1. Ve a **Site settings** → **Environment variables**
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas
3. Redeploy el sitio

### Modelos de Face-api.js no cargan

**Causa**: Los modelos no se copiaron a la carpeta `dist`.

**Solución**:
- Verifica que la carpeta `public/models` contenga todos los archivos
- Los archivos en `public` se copian automáticamente a `dist` durante el build

### Imágenes o archivos no cargan

**Causa**: Rutas incorrectas.

**Solución**:
- Usa rutas relativas: `/models/...` en lugar de `./models/...`
- Verifica que los archivos estén en la carpeta `public`

---

## 📊 Monitoreo y Analytics

### Netlify Analytics (Opcional - Pago)

Netlify ofrece analytics integrados para ver:
- Visitas
- Páginas más visitadas
- Rendimiento

### Google Analytics (Gratis)

Puedes agregar Google Analytics a tu proyecto:

1. Crea una cuenta en [Google Analytics](https://analytics.google.com/)
2. Obtén tu ID de medición (G-XXXXXXXXXX)
3. Agrega el script en `index.html`

---

## 🎉 ¡Listo!

Tu sistema de gestión de pagos con reconocimiento facial está ahora en producción.

### URLs Importantes:

- **Tu sitio**: https://tu-sitio.netlify.app
- **Panel de Netlify**: https://app.netlify.com/
- **Panel de Supabase**: https://app.supabase.com/

### Próximos Pasos:

1. Comparte la URL con tu equipo
2. Registra los rostros de todos los empleados
3. Comienza a usar el sistema
4. Monitorea el uso y rendimiento

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Netlify
2. Verifica la consola del navegador (F12)
3. Revisa la documentación de [Netlify](https://docs.netlify.com/)
4. Revisa la documentación de [Supabase](https://supabase.com/docs)

---

## 🔐 Seguridad

### Recomendaciones:

- ✅ Nunca compartas tus variables de entorno
- ✅ Usa HTTPS (Netlify lo proporciona gratis)
- ✅ Mantén Supabase RLS habilitado
- ✅ Cambia las contraseñas regularmente
- ✅ Haz backups de tu base de datos

---

¡Felicidades por desplegar tu aplicación! 🎊
