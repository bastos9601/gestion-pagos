# 📅 Cómo Usar el Sistema de Asistencias

## 🚀 Inicio Rápido

### 1. Acceder al Sistema
- Inicia sesión en la aplicación
- Haz clic en "📅 Asistencias" en el menú lateral

### 2. Primera Vez: Registrar Rostros de Empleados

#### Paso a Paso:
1. Ve a la pestaña **"📸 Registrar Rostros"**
2. Verás una lista de todos los empleados activos
3. Haz clic en **"📸 Registrar"** en el empleado que deseas registrar
4. Sigue las instrucciones en pantalla:
   - **Foto 1**: Mira directamente a la cámara
   - **Foto 2**: Gira ligeramente tu cabeza hacia la izquierda
   - **Foto 3**: Gira ligeramente tu cabeza hacia la derecha
5. El sistema capturará automáticamente las fotos cuando detecte tu rostro
6. Una vez completado, verás un mensaje de confirmación

#### Consejos para un buen registro:
- ✅ Buena iluminación (luz natural o LED frontal)
- ✅ Fondo simple y sin distracciones
- ✅ Rostro completamente visible (sin lentes oscuros, gorras, etc.)
- ✅ Mantén la cabeza quieta durante la captura
- ❌ Evita contraluz (ventana detrás)
- ❌ No uses mascarilla durante el registro

---

## 📍 Marcar Asistencia Diaria

### Para Empleados:

#### Marcar Entrada (Inicio del día):
1. Ve a la pestaña **"🎯 Marcar Asistencia"**
2. Haz clic en **"🎯 Iniciar Reconocimiento"**
3. Colócate frente a la cámara
4. El sistema te reconocerá automáticamente en 1-2 segundos
5. Verás tu nombre, DNI y hora de entrada
6. ¡Listo! Tu entrada fue registrada

#### Marcar Salida (Fin del día):
1. Repite el mismo proceso
2. El sistema detectará que ya marcaste entrada
3. Registrará tu salida y calculará las horas trabajadas automáticamente

### Información Mostrada:
- ✅ Nombre del empleado
- ✅ DNI
- ✅ Tipo de marca (Entrada/Salida)
- ✅ Hora exacta
- ✅ Confianza del reconocimiento (%)

---

## 📊 Ver Historial de Asistencias

### Para Administradores:

1. Ve a la pestaña **"📋 Historial"**
2. Selecciona el período que deseas ver:
   - **Hoy**: Asistencias del día actual
   - **Última semana**: Últimos 7 días
   - **Último mes**: Últimos 30 días
   - **Personalizado**: Selecciona fechas específicas

### Información en el Historial:
- 📅 Fecha
- 👤 Nombre del empleado
- 🆔 DNI
- 🟢 Hora de entrada
- 🔴 Hora de salida
- ⏱️ Horas trabajadas
- 📊 Estado (Completo/Incompleto/En curso)

### Estados de Asistencia:
- **Completo** (verde): 10 o más horas trabajadas
- **Incompleto** (amarillo): Menos de 10 horas trabajadas
- **En curso** (azul): Solo marcó entrada, aún no sale

---

## 🔧 Solución de Problemas

### "No se detectó ningún rostro"
- Verifica que haya buena iluminación
- Asegúrate de estar frente a la cámara
- Quita lentes oscuros, gorras o mascarillas
- Acércate un poco más a la cámara

### "No se pudo acceder a la cámara"
- Verifica los permisos del navegador
- En Chrome: Haz clic en el candado junto a la URL → Permisos → Cámara → Permitir
- Cierra otras aplicaciones que puedan estar usando la cámara
- Recarga la página

### "Error al cargar modelos"
- Verifica tu conexión a internet (solo la primera vez)
- Recarga la página
- Limpia el caché del navegador

### "Ya marcaste entrada y salida hoy"
- Solo puedes marcar una entrada y una salida por día
- Si necesitas corregir, contacta al administrador

### El sistema no me reconoce
- Verifica que tu rostro esté registrado (pestaña "Registrar Rostros")
- Si está registrado, intenta re-registrarte con mejor iluminación
- Asegúrate de que tu apariencia sea similar al registro (barba, lentes, etc.)

---

## 💡 Mejores Prácticas

### Para Empleados:
1. **Puntualidad**: Marca tu entrada al llegar y salida al irte
2. **Consistencia**: Usa el mismo dispositivo/ubicación si es posible
3. **Apariencia**: Mantén una apariencia similar a tu registro
4. **Iluminación**: Marca en un lugar bien iluminado

### Para Administradores:
1. **Registro inicial**: Registra a todos los empleados el primer día
2. **Ubicación**: Coloca el dispositivo en un lugar estratégico (entrada)
3. **Iluminación**: Asegura buena iluminación en el área de marcado
4. **Revisión**: Revisa el historial diariamente para detectar problemas
5. **Re-registro**: Si un empleado cambia mucho su apariencia, re-regístralo

---

## 📈 Integración con Nómina

El sistema de asistencias se integra automáticamente con el módulo de pagos:

1. Al registrar un pago mensual, el sistema puede sugerir:
   - Días trabajados (basado en asistencias del mes)
   - Horas trabajadas totales
   
2. Esto facilita el cálculo de salarios proporcionales

3. Puedes verificar las asistencias antes de procesar pagos

---

## 🔒 Seguridad y Privacidad

- ✅ Los descriptores faciales son datos matemáticos, no fotos
- ✅ Solo se guarda una foto de referencia por empleado
- ✅ Los datos están encriptados en la base de datos
- ✅ Solo administradores pueden ver el historial completo
- ✅ El sistema funciona offline (no envía datos a terceros)

---

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa esta guía primero
2. Verifica la sección de "Solución de Problemas"
3. Contacta al administrador del sistema
4. Revisa el archivo `ASISTENCIAS-FACIAL-README.md` para detalles técnicos

---

## 🎯 Resumen Rápido

### Primera vez:
1. Registrar rostros de empleados (pestaña "Registrar Rostros")

### Uso diario:
1. Empleado llega → Marcar Asistencia → Entrada registrada
2. Empleado se va → Marcar Asistencia → Salida registrada

### Revisión:
1. Administrador → Historial → Ver asistencias del período

¡Es así de simple! 🎉
