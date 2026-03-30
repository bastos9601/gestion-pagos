# 📱 Guía: Envío de Boletas por WhatsApp

## ¿Cómo funciona?

El sistema genera boletas de pago profesionales en formato PDF y facilita su envío por WhatsApp.

## 📄 Contenido de la Boleta PDF

Cada boleta incluye:

- **Encabezado de la empresa** (personalizable)
- **Datos del trabajador**:
  - Nombre completo
  - DNI
  - Cargo
  - Teléfono
- **Detalle del pago**:
  - Fecha
  - Tipo (Pago/Adelanto/Bono)
  - Descripción
  - Monto total
- **Tabla de conceptos**
- **Espacios para firmas** (empleador y trabajador)
- **Fecha y hora de generación**

## 🔧 Configuración

### Requisitos previos

1. **Teléfono del empleado**: Debe estar registrado en el sistema
2. **Formato del teléfono**: 
   - 9 dígitos para Perú (ejemplo: 987654321)
   - El sistema agrega automáticamente el código +51
   - Para otros países, incluye el código completo

### Personalizar datos de la empresa

Edita el archivo `src/utils/pdfGenerator.js`:

```javascript
const nombreEmpresa = empresa.nombre || 'TU EMPRESA S.A.C.'
const rucEmpresa = empresa.ruc || 'RUC: 20XXXXXXXXX'
const direccionEmpresa = empresa.direccion || 'Tu dirección'
```

## 📱 Formas de enviar boletas

### Opción 1: Desde la página de Pagos

1. Registra un nuevo pago
2. Aparecerá un cuadro verde de confirmación
3. Haz clic en **"📱 Enviar por WhatsApp"**
4. Se abrirá WhatsApp Web automáticamente
5. El PDF se descargará en tu computadora
6. Adjunta el archivo descargado en el chat

### Opción 2: Desde el Historial

1. Ve a **Historial**
2. Busca el pago usando los filtros
3. En la columna "Acciones", haz clic en **📱**
4. Se abrirá WhatsApp y se descargará el PDF
5. Adjunta el archivo en el chat

### Opción 3: Solo descargar PDF

- Haz clic en el botón **📄** para solo descargar
- El PDF se guardará en tu carpeta de Descargas
- Puedes enviarlo manualmente por cualquier medio

## 💬 Mensaje predeterminado

El sistema envía este mensaje automáticamente:

```
Hola [Nombre del Empleado], te enviamos tu boleta de pago 
del [Fecha]. Monto: S/ [Monto]
```

Para personalizar el mensaje, edita `src/utils/pdfGenerator.js`:

```javascript
const mensaje = `Tu mensaje personalizado aquí`
```

## 🌍 Configurar para otros países

### Argentina (+54)
```javascript
if (telefono.length === 10) {
  telefono = '54' + telefono
}
```

### Colombia (+57)
```javascript
if (telefono.length === 10) {
  telefono = '57' + telefono
}
```

### México (+52)
```javascript
if (telefono.length === 10) {
  telefono = '52' + telefono
}
```

## ⚠️ Solución de problemas

### El botón de WhatsApp está deshabilitado
- Verifica que el empleado tenga teléfono registrado
- Ve a "Empleados" y edita el empleado para agregar su teléfono

### WhatsApp no se abre
- Asegúrate de tener WhatsApp Web configurado
- Verifica que el navegador permita abrir ventanas emergentes
- Prueba con otro navegador (Chrome recomendado)

### El PDF no se descarga
- Verifica los permisos de descarga del navegador
- Revisa tu carpeta de Descargas
- Intenta con otro navegador

### El número no es válido
- Verifica que el teléfono tenga 9 dígitos (Perú)
- No incluyas espacios ni guiones
- Solo números

### El PDF se ve mal
- Verifica que los datos del empleado estén completos
- Revisa que el monto sea un número válido
- Abre la consola del navegador (F12) para ver errores

## 🎨 Personalización avanzada

### Cambiar colores del PDF

En `src/utils/pdfGenerator.js`:

```javascript
const colorPrimario = [102, 126, 234] // RGB
const colorSecundario = [118, 75, 162] // RGB
```

### Agregar logo de la empresa

```javascript
// Después de crear el doc
const imgData = 'data:image/png;base64,...' // Tu logo en base64
doc.addImage(imgData, 'PNG', 15, 10, 30, 30)
```

### Cambiar moneda

Busca todas las apariciones de `S/` y reemplaza por tu moneda:
- `$` para dólares
- `€` para euros
- `Bs.` para bolívares
- etc.

## 📊 Estadísticas de envío

Para llevar un registro de boletas enviadas, puedes agregar una tabla en Supabase:

```sql
CREATE TABLE envios_boletas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pago_id UUID REFERENCES pagos(id),
  empleado_id UUID REFERENCES empleados(id),
  fecha_envio TIMESTAMP DEFAULT NOW(),
  metodo VARCHAR(20) -- 'whatsapp', 'email', 'descarga'
);
```

## 🔐 Seguridad

- Las boletas se generan en el navegador del usuario
- No se almacenan en ningún servidor
- Los datos se obtienen directamente de Supabase
- El PDF se descarga localmente

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que las dependencias estén instaladas: `npm install`
3. Asegúrate de tener la última versión del código
4. Prueba en modo incógnito para descartar extensiones

---

**¡Listo para enviar boletas profesionales por WhatsApp!** 🎉
