# 🕐 Sistema de Control de Horarios

## Descripción

El sistema de control de horarios permite configurar horarios laborales y detectar automáticamente:
- ✅ Asistencias a tiempo
- ⚠️ Tardanzas
- ⏰ Horas extras
- 🔴 Salidas tempranas

## Configuración

### 1. Ejecutar Script SQL

Primero, ejecuta el script en Supabase SQL Editor:

```sql
-- Ejecuta este archivo
supabase-horarios-control.sql
```

Este script agrega:
- Columnas de horario a `configuracion_empresa`
- Columnas de estado a `asistencias`
- Funciones para calcular estados automáticamente

### 2. Configurar Horarios

Ve a **Configuración** en la aplicación y establece:

- **Hora de Entrada**: Ejemplo: 08:00
- **Hora de Salida**: Ejemplo: 18:00
- **Tolerancia**: Ejemplo: 15 minutos

## Cómo Funciona

### Entrada (Marca de Asistencia)

Cuando un empleado marca entrada, el sistema compara la hora con el horario configurado:

**Ejemplo 1 - A Tiempo:**
```
Hora configurada: 08:00
Tolerancia: 15 min
Hora marcada: 07:55
Estado: ✅ A TIEMPO
```

**Ejemplo 2 - Dentro de Tolerancia:**
```
Hora configurada: 08:00
Tolerancia: 15 min
Hora marcada: 08:10
Estado: ✅ A TIEMPO (+10 min)
Minutos tardanza: 10
```

**Ejemplo 3 - Tardanza:**
```
Hora configurada: 08:00
Tolerancia: 15 min
Hora marcada: 08:25
Estado: ⚠️ TARDANZA (25 min)
Minutos tardanza: 25
```

### Salida (Marca de Salida)

Cuando un empleado marca salida, el sistema detecta:

**Ejemplo 1 - Normal:**
```
Hora configurada: 18:00
Hora marcada: 18:05
Estado: ✅ NORMAL
```

**Ejemplo 2 - Horas Extras:**
```
Hora configurada: 18:00
Hora marcada: 20:30
Estado: ⏰ HORAS EXTRAS (+2.5h)
Horas extras: 2.5
```

**Ejemplo 3 - Salida Temprana:**
```
Hora configurada: 18:00
Hora marcada: 17:15
Estado: 🔴 SALIDA TEMPRANA
```

## Visualización en Historial

En el historial de asistencias verás badges de colores:

### Estados de Entrada:
- 🟢 **Verde**: A tiempo
- 🟡 **Amarillo**: A tiempo (dentro de tolerancia)
- 🔴 **Rojo**: Tardanza

### Estados de Salida:
- 🔵 **Azul**: Normal
- 🟣 **Morado**: Horas extras
- 🟠 **Naranja**: Salida temprana

## Ejemplo Visual

```
Fecha: 30 Mar 2026
Empleado: Juan Pérez
DNI: 12345678

Entrada: 08:20
⚠️ TARDANZA (20 min)

Salida: 20:30
⏰ HORAS EXTRAS (+2.5h)

Horas trabajadas: 12.17h
Estado: COMPLETO
```

## Campos en Base de Datos

### Tabla: configuracion_empresa
- `hora_entrada_laboral` (TIME): Hora de entrada configurada
- `hora_salida_laboral` (TIME): Hora de salida configurada
- `tolerancia_minutos` (INTEGER): Minutos de tolerancia

### Tabla: asistencias
- `estado_entrada` (VARCHAR): 'a_tiempo' o 'tardanza'
- `minutos_tardanza` (INTEGER): Minutos de tardanza
- `estado_salida` (VARCHAR): 'normal', 'horas_extras', 'temprano'
- `horas_extras` (DECIMAL): Horas extras trabajadas

## Reportes y Estadísticas

### En Dashboard (Futuro)
- Total de tardanzas del mes
- Total de horas extras del mes
- Empleados más puntuales
- Empleados con más tardanzas

### En Pagos (Futuro)
- Descuentos automáticos por tardanzas
- Bonos por horas extras
- Bonos por puntualidad

## Ventajas

✅ Control automático de puntualidad
✅ Cálculo preciso de horas extras
✅ Reportes detallados de asistencia
✅ Base para sistema de incentivos/descuentos
✅ Transparencia en el control de horarios
✅ Reducción de errores manuales

## Notas Importantes

1. Los horarios se configuran por empresa (todos los empleados comparten el mismo horario)
2. La tolerancia se aplica solo a la entrada, no a la salida
3. Las horas extras se calculan cuando la salida es más de 30 minutos después del horario
4. La salida temprana se marca cuando es más de 30 minutos antes del horario
5. Todos los cálculos usan la zona horaria de Perú (America/Lima)

## Próximas Mejoras

- [ ] Horarios diferentes por empleado
- [ ] Horarios diferentes por día de la semana
- [ ] Turnos rotativos
- [ ] Justificación de tardanzas
- [ ] Aprobación de horas extras
- [ ] Reportes estadísticos en Dashboard
- [ ] Integración con cálculo de pagos
