# 🍽️ Sistema de Horario de Almuerzo

## 📋 Descripción

El sistema ahora incluye un descuento automático del tiempo de almuerzo en el cálculo de horas trabajadas.

## ⚙️ Configuración

### 1. Ejecutar Script SQL

Ejecuta el archivo `supabase-horario-almuerzo.sql` en el SQL Editor de Supabase para agregar las columnas necesarias.

### 2. Configurar en la Aplicación

Ve a **Configuración** y encontrarás una nueva sección llamada **"🍽️ Horario de Almuerzo"** con dos campos:

- **Hora de Inicio de Almuerzo**: Hora en que inicia el almuerzo (ej: 13:00 = 1:00 PM)
- **Duración del Almuerzo**: Minutos de duración (ej: 90 = 1.5 horas)

## 🔄 Funcionamiento

### Ejemplo Práctico

**Configuración:**
- Entrada: 8:00 AM
- Salida: 7:00 PM
- Inicio almuerzo: 1:00 PM
- Duración almuerzo: 90 minutos (1.5 horas)

**Cálculo:**
1. Horas brutas: 7:00 PM - 8:00 AM = 11 horas
2. Descuento almuerzo: 1.5 horas
3. **Horas trabajadas netas: 11 - 1.5 = 9.5 horas**

### Proceso de Marcado

1. **Entrada (8:00 AM)**: El empleado marca su entrada con reconocimiento facial
2. **Salida (7:00 PM)**: El empleado marca su salida con reconocimiento facial
3. **Cálculo automático**: El sistema resta automáticamente el tiempo de almuerzo configurado

## ✅ Ventajas

- ✅ **Simple**: El empleado solo marca 2 veces (entrada y salida)
- ✅ **Automático**: El sistema descuenta el almuerzo sin intervención manual
- ✅ **Flexible**: Puedes configurar diferentes duraciones de almuerzo
- ✅ **Preciso**: Las horas trabajadas reflejan el tiempo real de trabajo

## 📊 Visualización

En el historial de asistencias verás:
- Hora de entrada
- Hora de salida
- Horas trabajadas (ya con el descuento de almuerzo aplicado)
- Badges de tardanzas y horas extras

## 🔧 Ajustes

Si necesitas cambiar el horario de almuerzo:
1. Ve a **Configuración**
2. Modifica los campos en la sección **"🍽️ Horario de Almuerzo"**
3. Guarda los cambios
4. Los nuevos cálculos se aplicarán a partir de la siguiente marca de salida

## ⚠️ Notas Importantes

- El descuento de almuerzo se aplica **solo cuando el empleado marca su salida**
- Si el empleado trabaja menos horas que la duración del almuerzo, las horas trabajadas serán 0 (no negativas)
- El sistema no valida si el empleado realmente tomó el almuerzo, solo descuenta el tiempo configurado
- Para horarios especiales o excepciones, puedes editar manualmente las asistencias desde el historial
