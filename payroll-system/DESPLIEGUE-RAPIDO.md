# 🚀 Despliegue Rápido en Netlify

## Opción 1: Desde GitHub (Recomendado)

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "Preparar para despliegue"
git remote add origin https://github.com/tu-usuario/tu-repo.git
git push -u origin main
```

### 2. Conectar con Netlify
1. Ve a https://app.netlify.com/
2. Click en "Add new site" → "Import an existing project"
3. Selecciona GitHub y tu repositorio
4. Configuración detectada automáticamente desde `netlify.toml`

### 3. Agregar Variables de Entorno en Netlify
```
VITE_SUPABASE_URL = tu_url_de_supabase
VITE_SUPABASE_ANON_KEY = tu_key_de_supabase
```

### 4. Deploy!
Click en "Deploy site" y espera 2-5 minutos.

---

## Opción 2: Manual (Drag & Drop)

### 1. Construir localmente
```bash
cd payroll-system
npm run build
```

### 2. Subir a Netlify
1. Ve a https://app.netlify.com/
2. Arrastra la carpeta `dist` a la zona de drop
3. ¡Listo!

**NOTA**: Con esta opción necesitas reconstruir y subir manualmente cada vez que hagas cambios.

---

## ⚠️ IMPORTANTE

### Antes de desplegar:

1. ✅ Verifica que `npm run build` funcione sin errores
2. ✅ Asegúrate de que `.env` NO esté en GitHub
3. ✅ Configura las variables de entorno en Netlify
4. ✅ Agrega la URL de Netlify en Supabase (Authentication → URL Configuration)

### Después de desplegar:

1. ✅ Prueba el login
2. ✅ Verifica que el reconocimiento facial funcione
3. ✅ Prueba todas las funcionalidades principales

---

## 🔗 URLs Importantes

- **Netlify**: https://app.netlify.com/
- **Supabase**: https://app.supabase.com/
- **Documentación completa**: Ver `DESPLEGAR-NETLIFY.md`
- **Checklist**: Ver `CHECKLIST-DESPLIEGUE.md`

---

## 🆘 Problemas Comunes

### "Build failed"
→ Ejecuta `npm run build` localmente y revisa los errores

### "Supabase connection failed"
→ Verifica las variables de entorno en Netlify

### "Page not found" al recargar
→ Ya está configurado en `netlify.toml`, redeploy el sitio

### Modelos de Face-api.js no cargan
→ Verifica que la carpeta `public/models` tenga todos los archivos

---

¡Eso es todo! Tu aplicación estará en línea en minutos. 🎉
