// Generador de reporte HTML para asistencias
export const generarReporteAsistenciasHTML = (asistencias, config, filtro, fechaInicio = '', fechaFin = '') => {
  // Calcular resumen
  const totalRegistros = asistencias.length
  const registrosCompletos = asistencias.filter(a => a.horas_trabajadas >= 10).length
  const registrosIncompletos = asistencias.filter(a => a.horas_trabajadas && a.horas_trabajadas < 10).length
  const registrosEnCurso = asistencias.filter(a => !a.hora_salida).length
  const totalHoras = asistencias.reduce((sum, a) => sum + (parseFloat(a.horas_trabajadas) || 0), 0)
  const totalTardanzas = asistencias.filter(a => a.estado_entrada === 'tardanza').length
  const totalHorasExtras = asistencias.reduce((sum, a) => sum + (parseFloat(a.horas_extras) || 0), 0)

  const fechaReporte = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let periodoTexto = ''
  if (filtro === 'hoy') {
    periodoTexto = 'Hoy'
  } else if (filtro === 'semana') {
    periodoTexto = 'Última semana'
  } else if (filtro === 'mes') {
    periodoTexto = 'Último mes'
  } else if (filtro === 'personalizado' && fechaInicio && fechaFin) {
    const fechaInicioFormat = new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const fechaFinFormat = new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    periodoTexto = `Del ${fechaInicioFormat} al ${fechaFinFormat}`
  } else {
    periodoTexto = 'Todos los registros'
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    if (timeString.includes('T')) {
      return timeString.split('T')[1].substring(0, 5)
    }
    return timeString.substring(0, 5)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getEstadoAsistencia = (asistencia) => {
    if (!asistencia.hora_salida) {
      return { texto: 'En curso', clase: 'en-curso' }
    }
    if (asistencia.horas_trabajadas >= 10) {
      return { texto: 'Completo', clase: 'completo' }
    }
    return { texto: 'Incompleto', clase: 'incompleto' }
  }

  // Generar filas de la tabla
  const filasHTML = asistencias.map((asistencia, index) => {
    const estado = getEstadoAsistencia(asistencia)
    const esTardanza = asistencia.estado_entrada === 'tardanza'
    const tieneHorasExtras = asistencia.estado_salida === 'horas_extras'
    const minutosTardanza = asistencia.minutos_tardanza || 0
    const horasExtras = asistencia.horas_extras || 0

    return `
      <tr class="${index % 2 === 0 ? 'fila-par' : 'fila-impar'}">
        <td>${formatDate(asistencia.fecha)}</td>
        <td>${asistencia.empleados.nombre}</td>
        <td>${asistencia.empleados.dni}</td>
        <td class="hora-entrada ${esTardanza ? 'tardanza' : ''}">
          ${formatTime(asistencia.hora_entrada)}
          ${esTardanza ? `<span class="badge badge-tardanza">⚠️ +${minutosTardanza}m</span>` : ''}
        </td>
        <td class="hora-salida ${tieneHorasExtras ? 'horas-extras' : ''}">
          ${formatTime(asistencia.hora_salida)}
          ${tieneHorasExtras ? `<span class="badge badge-horas-extras">⏰ +${horasExtras.toFixed(1)}h</span>` : ''}
        </td>
        <td>${asistencia.horas_trabajadas ? parseFloat(asistencia.horas_trabajadas).toFixed(1) + 'h' : '-'}</td>
        <td><span class="estado-badge ${estado.clase}">${estado.texto}</span></td>
      </tr>
    `
  }).join('')

  // HTML completo
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Asistencias - ${config.nombre || 'EMPRESA'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 2rem;
      background: #f3f4f6;
      color: #1f2937;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.8rem;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .header .empresa-info {
      color: #6b7280;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .titulo-reporte {
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #3b82f6;
      margin: 1.5rem 0;
    }

    .info-reporte {
      background: #f9fafb;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .info-reporte div {
      font-size: 0.9rem;
      color: #4b5563;
    }

    .info-reporte strong {
      color: #1f2937;
    }

    .resumen {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }

    .resumen h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #1e40af;
    }

    .resumen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .resumen-item {
      background: white;
      padding: 1rem;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .resumen-item .label {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .resumen-item .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
    }

    .resumen-item.tardanzas .value {
      color: #dc2626;
    }

    .resumen-item.horas-extras .value {
      color: #4f46e5;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
      font-size: 0.9rem;
    }

    thead {
      background: #3b82f6;
      color: white;
    }

    thead th {
      padding: 1rem 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tbody td {
      padding: 0.875rem 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .fila-par {
      background: #f9fafb;
    }

    .fila-impar {
      background: white;
    }

    tbody tr:hover {
      background: #f3f4f6;
    }

    .hora-entrada {
      color: #10b981;
      font-weight: 600;
    }

    .hora-entrada.tardanza {
      color: #dc2626;
    }

    .hora-salida {
      color: #ef4444;
      font-weight: 600;
    }

    .hora-salida.horas-extras {
      color: #4f46e5;
    }

    .badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.25rem;
      font-weight: 500;
    }

    .badge-tardanza {
      background: #fee2e2;
      color: #991b1b;
    }

    .badge-horas-extras {
      background: #e0e7ff;
      color: #3730a3;
    }

    .estado-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .estado-badge.completo {
      background: #d1fae5;
      color: #065f46;
    }

    .estado-badge.incompleto {
      background: #fed7aa;
      color: #92400e;
    }

    .estado-badge.en-curso {
      background: #dbeafe;
      color: #1e40af;
    }

    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.85rem;
    }

    .btn-imprimir {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 2rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .btn-imprimir:hover {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }

    @media print {
      body {
        background: white;
        padding: 0;
      }

      .container {
        box-shadow: none;
        padding: 1rem;
      }

      .btn-imprimir {
        display: none;
      }
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      .container {
        padding: 1rem;
      }

      table {
        font-size: 0.8rem;
      }

      thead th, tbody td {
        padding: 0.5rem 0.25rem;
      }

      .resumen-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.nombre || 'MI EMPRESA S.A.C.'}</h1>
      <div class="empresa-info">
        ${config.ruc ? `<div>RUC: ${config.ruc}</div>` : ''}
        ${config.direccion ? `<div>${config.direccion}</div>` : ''}
        ${config.telefono || config.email ? `<div>${config.telefono || ''} ${config.email || ''}</div>` : ''}
      </div>
    </div>

    <div class="titulo-reporte">
      📅 REPORTE DE ASISTENCIAS
    </div>

    <div class="info-reporte">
      <div><strong>Fecha de generación:</strong> ${fechaReporte}</div>
      <div><strong>Período:</strong> ${periodoTexto}</div>
    </div>

    <div class="resumen">
      <h2>📊 Resumen</h2>
      <div class="resumen-grid">
        <div class="resumen-item">
          <div class="label">Total de registros</div>
          <div class="value">${totalRegistros}</div>
        </div>
        <div class="resumen-item">
          <div class="label">Completos (≥10h)</div>
          <div class="value">${registrosCompletos}</div>
        </div>
        <div class="resumen-item">
          <div class="label">Incompletos (<10h)</div>
          <div class="value">${registrosIncompletos}</div>
        </div>
        <div class="resumen-item">
          <div class="label">En curso</div>
          <div class="value">${registrosEnCurso}</div>
        </div>
        <div class="resumen-item">
          <div class="label">Total horas trabajadas</div>
          <div class="value">${totalHoras.toFixed(1)}h</div>
        </div>
        <div class="resumen-item tardanzas">
          <div class="label">Tardanzas</div>
          <div class="value">${totalTardanzas}</div>
        </div>
        <div class="resumen-item horas-extras">
          <div class="label">Total horas extras</div>
          <div class="value">${totalHorasExtras.toFixed(1)}h</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Empleado</th>
          <th>DNI</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Horas</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${filasHTML}
      </tbody>
    </table>

    <div class="footer">
      <p>Reporte generado automáticamente por el Sistema de Gestión de Nómina</p>
      <p>${config.nombre || 'MI EMPRESA S.A.C.'} - ${fechaReporte}</p>
    </div>
  </div>

  <button class="btn-imprimir" onclick="window.print()">
    🖨️ Imprimir Reporte
  </button>
</body>
</html>
  `

  // Abrir en nueva ventana
  const ventana = window.open('', '_blank')
  ventana.document.write(html)
  ventana.document.close()
}
