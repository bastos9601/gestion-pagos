# 🚀 INSTRUCCIONES RÁPIDAS DE INSTALACIÓN

## Paso 1: Configurar Supabase (5 minutos)

1. **Crear cuenta y proyecto**
   - Ve a https://supabase.com
   - Crea una cuenta gratis
   - Crea un nuevo proyecto
   - Espera a que se inicialice (2-3 minutos)

2. **Ejecutar el script SQL**
   - En tu proyecto, ve a **SQL Editor** (icono de base de datos)
   - Abre el archivo `supabase-setup.sql` de este proyecto
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **"Run"** (botón verde)
   - Deberías ver: "Success. No rows returned"

3. **Obtener credenciales**
   - Ve a **Settings** (⚙️) > **API**
   - Copia estos dos valores:
     - **Project URL** (ejemplo: https://xxxxx.supabase.co)
     - **anon public** key (una cadena larga)

4. **Configurar autenticación (opcional para desarrollo)**
   - Ve a **Authentication** > **Settings**
   - Desactiva "Enable email confirmations" para no tener que confirmar emails

## Paso 2: Configurar el Proyecto (2 minutos)

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Crear archivo .env**
   - Crea un archivo llamado `.env` en la raíz del proyecto
   - Copia este contenido y reemplaza con tus valores:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
   ```

3. **Ejecutar el proyecto**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   - Ve a http://localhost:5173
   - ¡Listo! 🎉

## Paso 3: Primer Uso

1. **Registrarte**
   - Haz clic en "Regístrate"
   - Usa cualquier email y contraseña (mínimo 6 caracteres)
   - Si desactivaste la confirmación de email, podrás entrar inmediatamente

2. **Crear tu primer empleado**
   - Ve a "Empleados"
   - Clic en "+ Nuevo Empleado"
   - Llena el formulario
   - Guarda

3. **Registrar un pago**
   - Ve a "Pagos"
   - Selecciona el empleado
   - Ingresa el monto
   - Registra

4. **Ver estadísticas**
   - Ve a "Dashboard"
   - Verás las estadísticas actualizadas

## ⚠️ Problemas Comunes

### "Invalid API key"
- Verifica que copiaste bien las credenciales en el `.env`
- Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

### "relation empleados does not exist"
- No ejecutaste el script SQL en Supabase
- Ve al Paso 1.2 y ejecuta el script completo

### No puedo registrarme
- Verifica que la autenticación esté habilitada en Supabase
- Ve a Authentication > Providers > Email (debe estar ON)

### Los datos no aparecen
- Verifica que estés logueado
- Abre la consola del navegador (F12) para ver errores
- Verifica que las políticas RLS se crearon (están en el script SQL)

## 📞 ¿Necesitas ayuda?

1. Abre la consola del navegador (F12) y busca errores en rojo
2. Verifica que las tablas existan en Supabase (Table Editor)
3. Revisa que las variables de entorno estén correctas
4. Lee el README.md completo para más detalles

---

**¡Disfruta tu sistema de gestión de pagos!** 💼
