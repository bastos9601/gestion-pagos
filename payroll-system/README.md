# 💼 Sistema de Gestión de Pagos de Personal

Sistema web completo para gestionar empleados, pagos, adelantos y bonos usando React + Vite + Supabase.

## 🚀 Características

- ✅ Autenticación con Supabase Auth
- 👥 Gestión completa de empleados (CRUD)
- 💰 Registro de pagos, adelantos y bonos
- 📊 Dashboard con estadísticas en tiempo real
- 📋 Historial de pagos con filtros
- 📥 Exportación a CSV
- � Greneración de boletas de pago en PDF
- 📱 Envío de boletas por WhatsApp
- 🔒 Protección de rutas
- 🎨 Interfaz moderna y responsiva

## 📋 Requisitos Previos

- Node.js 16+ instalado
- Cuenta en Supabase (gratis en https://supabase.com)

## ⚙️ Configuración de Supabase

### 1. Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Crea un nuevo proyecto
3. Guarda tu **URL** y **ANON KEY** (los necesitarás después)

### 2. Crear las tablas en Supabase

1. Ve al **SQL Editor** en tu proyecto de Supabase
2. Copia todo el contenido del archivo `supabase-setup.sql`
3. Pégalo en el editor y haz clic en **Run**
4. Verifica que las tablas se crearon correctamente en la sección **Table Editor**

### 3. Configurar autenticación

1. Ve a **Authentication** > **Providers**
2. Asegúrate de que **Email** esté habilitado
3. Opcionalmente, desactiva la confirmación de email para desarrollo:
   - Ve a **Authentication** > **Settings**
   - Desactiva "Enable email confirmations"

## 🔧 Instalación del Proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**¿Dónde encontrar estos valores?**
1. Ve a tu proyecto en Supabase
2. Click en **Settings** > **API**
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Ejecutar el proyecto

```bash
npm run dev
```

El proyecto estará disponible en **http://localhost:5173**

## 📱 Uso del Sistema

### Primera vez

1. Abre http://localhost:5173
2. Haz clic en **"Regístrate"**
3. Crea una cuenta con tu email y contraseña (mínimo 6 caracteres)
4. Si habilitaste confirmación de email, revisa tu bandeja de entrada
5. Inicia sesión

### Gestión de Empleados

- Ve a la sección **"Empleados"**
- Haz clic en **"+ Nuevo Empleado"**
- Completa el formulario:
  - Nombre completo
  - DNI (único)
  - Teléfono (opcional)
  - Cargo
  - Sueldo base
- Guarda y el empleado aparecerá en la tabla
- Puedes **editar** (✏️) o **eliminar** (🗑️) empleados

### Registrar Pagos

- Ve a la sección **"Pagos"**
- Selecciona un empleado del dropdown
- Elige el tipo:
  - **Pago**: Pago regular de sueldo
  - **Adelanto**: Adelanto de sueldo
  - **Bono**: Bonificación extra
- Ingresa el monto y fecha
- Agrega una descripción opcional
- Haz clic en **"Registrar Pago"**
- Después de registrar, podrás:
  - **📄 Descargar Boleta PDF**: Genera y descarga la boleta en formato PDF
  - **📱 Enviar por WhatsApp**: Abre WhatsApp con el empleado y descarga el PDF para adjuntar

### Enviar Boletas por WhatsApp

**Desde la página de Pagos (después de registrar):**
1. Registra un pago
2. Aparecerá un mensaje de confirmación
3. Haz clic en **"📱 Enviar por WhatsApp"**
4. Se abrirá WhatsApp Web con el mensaje
5. El PDF se descargará automáticamente
6. Adjunta el PDF descargado en el chat de WhatsApp

**Desde el Historial:**
1. Ve a **"Historial"**
2. Busca el pago que deseas enviar
3. Haz clic en el botón **📱** en la columna "Acciones"
4. Se abrirá WhatsApp y se descargará el PDF
5. Adjunta el archivo en el chat

**Nota:** El empleado debe tener un teléfono registrado para usar esta función.

### Ver Historial

- Ve a la sección **"Historial"**
- Usa los filtros para buscar:
  - Por empleado
  - Por tipo de pago
  - Por rango de fechas
- Haz clic en **"Filtrar"** para aplicar
- Exporta los datos con **"📥 Exportar CSV"**

### Dashboard

- Ve a **"Dashboard"** para ver:
  - Total de empleados
  - Total pagado
  - Total de adelantos
  - Total de bonos
  - Resumen general

## 📁 Estructura del Proyecto

```
payroll-system/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Layout con sidebar
│   │   └── ProtectedRoute.jsx  # Protección de rutas
│   ├── context/
│   │   └── AuthContext.jsx     # Context de autenticación
│   ├── pages/
│   │   ├── Login.jsx           # Login y registro
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Empleados.jsx       # Gestión de empleados
│   │   ├── Pagos.jsx           # Registro de pagos
│   │   └── Historial.jsx       # Historial de pagos
│   ├── services/
│   │   └── supabaseClient.js   # Cliente de Supabase
│   ├── styles/
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   ├── Empleados.css
│   │   ├── Historial.css
│   │   ├── Layout.css
│   │   └── Pagos.css
│   ├── App.jsx                 # Configuración de rutas
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales
├── .env                        # Variables de entorno (crear)
├── .env.example                # Ejemplo de variables
├── supabase-setup.sql          # Script SQL para Supabase
└── package.json
```

## 🔒 Seguridad

El sistema implementa:

- **Row Level Security (RLS)** en Supabase
- Solo usuarios autenticados pueden acceder a los datos
- Protección de rutas en el frontend
- Validación de formularios
- Manejo seguro de sesiones

## 🛠️ Tecnologías Utilizadas

- **React 19** - Framework frontend
- **Vite** - Build tool
- **React Router DOM** - Navegación
- **Supabase** - Backend as a Service
  - PostgreSQL (Base de datos)
  - Auth (Autenticación)
  - Row Level Security
- **CSS** - Estilos personalizados

## 📝 Scripts Disponibles

```bash
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
npm run lint     # Ejecutar linter
```

## 🐛 Solución de Problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno en `.env` sean correctas
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo después de crear el `.env`

### Error: "relation does not exist"
- Verifica que ejecutaste el script SQL en Supabase
- Revisa que las tablas se crearon correctamente en Table Editor

### No puedo registrarme
- Verifica que la autenticación por email esté habilitada en Supabase
- Revisa tu bandeja de spam si no llega el email de confirmación
- Considera desactivar la confirmación de email para desarrollo

### Los datos no se cargan
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de estar autenticado
- Revisa la consola del navegador para ver errores

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 👨‍💻 Autor

Sistema desarrollado con React + Vite + Supabase

---

**¡Listo para usar!** 🎉

Si tienes problemas, revisa la consola del navegador (F12) para ver los errores detallados.
