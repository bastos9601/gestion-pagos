// Generador de PDF para reportes de asistencias
import { jsPDF } from 'jspdf'

export const generarReporteAsistenciasPDF = (asistencias, config, filtro) => {
  const doc = new jsPDF()
  
  // Configuración
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  // Encabezado - Información de la empresa
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(config.nombre || 'EMPRESA', margin, yPos)
  
  yPos += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (config.ruc) doc.text(`RUC: ${config.ruc}`, margin, yPos)
  
  yPos += 4
  if (config.direccion) doc.text(config.direccion, margin, yPos)
  
  yPos += 4
  if (config.telefono || config.email) {
    doc.text(`${config.telefono || ''} ${config.email || ''}`, margin, yPos)
  }

  // Línea separadora
  yPos += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // Título del reporte
  yPos += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE ASISTENCIAS', pageWidth / 2, yPos, { align: 'center' })

  // Información del filtro
  yPos += 7
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const fechaReporte = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Fecha de generación: ${fechaReporte}`, margin, yPos)
  
  yPos += 4
  let periodoTexto = ''
  if (filtro === 'hoy') {
    periodoTexto = 'Hoy'
  } else if (filtro === 'semana') {
    periodoTexto = 'Última semana'
  } else if (filtro === 'mes') {
    periodoTexto = 'Último mes'
  } else {
    periodoTexto = 'Período personalizado'
  }
  doc.text(`Período: ${periodoTexto}`, margin, yPos)

  // Resumen
  yPos += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN', margin, yPos)
  
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  const totalRegistros = asistencias.length
  const registrosCompletos = asistencias.filter(a => a.horas_trabajadas >= 10).length
  const registrosIncompletos = asistencias.filter(a => a.horas_trabajadas && a.horas_trabajadas < 10).length
  const registrosEnCurso = asistencias.filter(a => !a.hora_salida).length
  const totalHoras = asistencias.reduce((sum, a) => sum + (parseFloat(a.horas_trabajadas) || 0), 0)

  doc.text(`Total de registros: ${totalRegistros}`, margin, yPos)
  yPos += 4
  doc.text(`Completos (≥10h): ${registrosCompletos}`, margin, yPos)
  yPos += 4
  doc.text(`Incompletos (<10h): ${registrosIncompletos}`, margin, yPos)
  yPos += 4
  doc.text(`En curso: ${registrosEnCurso}`, margin, yPos)
  yPos += 4
  doc.text(`Total horas trabajadas: ${totalHoras.toFixed(1)}h`, margin, yPos)

  // Tabla de asistencias
  yPos += 8

  // Encabezados de tabla
  const colWidths = [25, 55, 25, 20, 20, 15, 25]
  const headers = ['Fecha', 'Empleado', 'DNI', 'Entrada', 'Salida', 'Horas', 'Estado']
  
  // Dibujar encabezado de tabla
  doc.setFillColor(59, 130, 246)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  
  let xPos = margin + 2
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5)
    xPos += colWidths[i]
  })
  
  yPos += 7
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  // Dibujar filas
  asistencias.forEach((asistencia, index) => {
    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }

    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F')
    }

    const fecha = new Date(asistencia.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    
    const entrada = asistencia.hora_entrada 
      ? (asistencia.hora_entrada.includes('T') 
          ? asistencia.hora_entrada.split('T')[1].substring(0, 5)
          : asistencia.hora_entrada.substring(0, 5))
      : '-'
    
    const salida = asistencia.hora_salida
      ? (asistencia.hora_salida.includes('T')
          ? asistencia.hora_salida.split('T')[1].substring(0, 5)
          : asistencia.hora_salida.substring(0, 5))
      : '-'
    
    const horas = asistencia.horas_trabajadas 
      ? `${parseFloat(asistencia.horas_trabajadas).toFixed(1)}h`
      : '-'
    
    let estado = ''
    if (!asistencia.hora_salida) {
      estado = 'En curso'
    } else if (asistencia.horas_trabajadas >= 10) {
      estado = 'Completo'
    } else {
      estado = 'Incompleto'
    }

    xPos = margin + 2
    
    // Fecha
    doc.setTextColor(0, 0, 0)
    doc.text(fecha, xPos, yPos + 4)
    xPos += colWidths[0]
    
    // Empleado (truncar si es muy largo)
    const nombreTruncado = asistencia.empleados.nombre.length > 25 
      ? asistencia.empleados.nombre.substring(0, 22) + '...'
      : asistencia.empleados.nombre
    doc.text(nombreTruncado, xPos, yPos + 4)
    xPos += colWidths[1]
    
    // DNI
    doc.text(asistencia.empleados.dni, xPos, yPos + 4)
    xPos += colWidths[2]
    
    // Entrada (verde)
    doc.setTextColor(16, 185, 129)
    doc.setFont('helvetica', 'bold')
    doc.text(entrada, xPos, yPos + 4)
    xPos += colWidths[3]
    
    // Salida (rojo)
    doc.setTextColor(239, 68, 68)
    doc.text(salida, xPos, yPos + 4)
    xPos += colWidths[4]
    
    // Horas
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(horas, xPos, yPos + 4)
    xPos += colWidths[5]
    
    // Estado (con color)
    if (estado === 'Completo') {
      doc.setTextColor(6, 95, 70)
    } else if (estado === 'Incompleto') {
      doc.setTextColor(146, 64, 14)
    } else {
      doc.setTextColor(30, 64, 175)
    }
    doc.text(estado, xPos, yPos + 4)

    yPos += 6
  })

  // Línea final de tabla
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // Pie de página
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Generar nombre del archivo
  const fechaArchivo = new Date().toISOString().split('T')[0]
  const nombreArchivo = `Reporte_Asistencias_${fechaArchivo}.pdf`

  // Descargar
  doc.save(nombreArchivo)
}
