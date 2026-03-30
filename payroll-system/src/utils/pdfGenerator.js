// Generador de boletas de pago en PDF
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generarBoletaPDF = (empleado, pago, empresa = {}) => {
  const doc = new jsPDF()
  
  // Configuración de empresa (personalizable)
  const nombreEmpresa = empresa.nombre || 'MI EMPRESA S.A.C.'
  const rucEmpresa = empresa.ruc || '20XXXXXXXXX'
  const direccionEmpresa = empresa.direccion || 'Av. Principal 123, Lima - Perú'
  const firmaUrl = empresa.firma_url || null
  
  // Calcular periodo (mes y año del pago)
  const fechaPago = new Date(pago.fecha)
  const periodo = fechaPago.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()
  
  // Días y horas trabajadas
  const diasTrabajados = pago.dias_trabajados || 0
  const horasTrabajadas = pago.horas_trabajadas || 0
  
  // Calcular montos
  const sueldoBase = empleado.sueldo_base
  const montoBruto = pago.tipo === 'pago' && diasTrabajados > 0
    ? (sueldoBase / 30) * diasTrabajados
    : sueldoBase
  
  const descuentosPersonalizados = parseFloat(pago.descuentos || 0)
  
  // Parsear bonos desde la descripción
  const bonosArray = []
  let totalBonos = 0
  if (pago.descripcion) {
    const lineasBonos = pago.descripcion.split('\n')
    lineasBonos.forEach(linea => {
      const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
      if (match) {
        const concepto = match[1].trim()
        const monto = parseFloat(match[2].replace(/,/g, ''))
        bonosArray.push({ concepto, monto })
        totalBonos += monto
      }
    })
  }
  
  const totalIngresos = pago.tipo === 'pago' ? montoBruto + totalBonos : pago.monto
  const netoAPagar = totalIngresos - descuentosPersonalizados
  
  // ========== ENCABEZADO ==========
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(10, 10, 190, 28)
  
  // Datos de la empresa
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreEmpresa, 105, 17, { align: 'center' })
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`RUC: ${rucEmpresa}`, 105, 22, { align: 'center' })
  doc.text(direccionEmpresa, 105, 26, { align: 'center' })
  
  // Título
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('BOLETA DE PAGO', 105, 35, { align: 'center' })
  
  // ========== DATOS DEL TRABAJADOR ==========
  let yPos = 42
  
  // Caja de datos del trabajador
  doc.rect(10, yPos, 190, 38)
  doc.line(10, yPos + 6, 200, yPos + 6) // Línea horizontal
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL TRABAJADOR', 12, yPos + 4)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  
  // Columna izquierda
  doc.text('APELLIDOS Y NOMBRES:', 12, yPos + 11)
  doc.text(empleado.nombre.toUpperCase(), 55, yPos + 11)
  
  doc.text('DOCUMENTO DE IDENTIDAD:', 12, yPos + 16)
  doc.text(empleado.dni, 55, yPos + 16)
  
  doc.text('CARGO:', 12, yPos + 21)
  doc.text(empleado.cargo.toUpperCase(), 55, yPos + 21)
  
  doc.text('SUELDO BASE:', 12, yPos + 26)
  doc.text(`S/. ${empleado.sueldo_base.toFixed(2)}`, 55, yPos + 26)
  
  // Columna derecha
  doc.text('PERIODO:', 110, yPos + 11)
  doc.text(periodo, 145, yPos + 11)
  
  doc.text('FECHA DE PAGO:', 110, yPos + 16)
  doc.text(fechaPago.toLocaleDateString('es-PE'), 145, yPos + 16)
  
  doc.text('DÍAS TRABAJADOS:', 110, yPos + 21)
  doc.text(diasTrabajados.toString(), 145, yPos + 21)
  
  doc.text('HORAS TRABAJADAS:', 110, yPos + 26)
  doc.text(horasTrabajadas.toFixed(2), 145, yPos + 26)
  
  doc.text('TIPO:', 110, yPos + 32)
  doc.text(pago.tipo.toUpperCase(), 145, yPos + 32)
  
  // ========== DETALLE DE ASISTENCIA ==========
  yPos += 42
  
  doc.rect(10, yPos, 190, 16)
  doc.line(10, yPos + 6, 200, yPos + 6) // Línea horizontal
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE ASISTENCIA', 12, yPos + 4)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  
  // Columna izquierda
  doc.text('DÍAS TRABAJADOS:', 12, yPos + 12)
  doc.text(`${diasTrabajados} días`, 55, yPos + 12)
  
  // Columna derecha
  doc.text('HORAS TRABAJADAS:', 110, yPos + 12)
  doc.text(`${horasTrabajadas.toFixed(2)} horas`, 160, yPos + 12)
  
  // ========== DETALLE DEL PAGO ==========
  yPos += 19
  
  // Tabla de Ingresos
  const ingresosData = []
  
  if (pago.tipo === 'pago') {
    ingresosData.push([`SUELDO BÁSICO (${diasTrabajados} días trabajados)`, `S/. ${montoBruto.toFixed(2)}`])
    
    // Agregar bonos individuales
    bonosArray.forEach(bono => {
      ingresosData.push([bono.concepto.toUpperCase(), `S/. ${bono.monto.toFixed(2)}`])
    })
  } else if (pago.tipo === 'adelanto') {
    ingresosData.push(['ADELANTO DE SUELDO', `S/. ${pago.monto.toFixed(2)}`])
  } else if (pago.tipo === 'bono') {
    ingresosData.push(['BONIFICACIÓN ESPECIAL', `S/. ${pago.monto.toFixed(2)}`])
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['INGRESOS', 'MONTO']],
    body: ingresosData,
    foot: [['TOTAL INGRESOS', `S/. ${totalIngresos.toFixed(2)}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 140, halign: 'left' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 10, right: 10 }
  })
  
  // Tabla de Descuentos
  yPos = doc.lastAutoTable.finalY + 3
  
  const descuentosData = []
  if (descuentosPersonalizados > 0 && pago.descripcion_descuento) {
    // Parsear descuentos individuales desde la descripción
    const lineasDescuentos = pago.descripcion_descuento.split('\n')
    lineasDescuentos.forEach(linea => {
      const match = linea.match(/(.+?):\s*S\/\.\s*([\d,.]+)/)
      if (match) {
        const concepto = match[1].trim()
        const monto = parseFloat(match[2].replace(/,/g, ''))
        descuentosData.push([concepto.toUpperCase(), `S/. ${monto.toFixed(2)}`])
      }
    })
  }
  
  if (descuentosData.length === 0) {
    descuentosData.push(['SIN DESCUENTOS', 'S/. 0.00'])
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['DESCUENTOS', 'MONTO']],
    body: descuentosData,
    foot: [['TOTAL DESCUENTOS', `S/. ${descuentosPersonalizados.toFixed(2)}`]],
    theme: 'grid',
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 140, halign: 'left' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 10, right: 10 }
  })
  
  // ========== TOTAL A PAGAR ==========
  yPos = doc.lastAutoTable.finalY + 3
  
  doc.setFillColor(50, 50, 50)
  doc.rect(10, yPos, 190, 12, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('NETO A PAGAR:', 15, yPos + 8)
  doc.text(`S/. ${netoAPagar.toFixed(2)}`, 195, yPos + 8, { align: 'right' })
  
  // Resetear color
  doc.setTextColor(0, 0, 0)
  
  // ========== OBSERVACIONES ==========
  yPos = yPos + 15
  
  if (pago.descripcion) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', 10, yPos)
    doc.setFont('helvetica', 'normal')
    const splitText = doc.splitTextToSize(pago.descripcion, 190)
    doc.text(splitText, 10, yPos + 4)
    yPos += 8 + (splitText.length * 3)
  }
  
  // ========== FIRMAS ==========
  yPos += 12
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  
  // Firma empleador (con imagen si existe)
  if (firmaUrl && firmaUrl.startsWith('data:image')) {
    try {
      doc.addImage(firmaUrl, 'PNG', 25, yPos, 50, 15)
      doc.line(20, yPos + 17, 80, yPos + 17)
    } catch (error) {
      console.error('Error al agregar firma:', error)
      doc.line(20, yPos + 17, 80, yPos + 17)
    }
  } else {
    doc.line(20, yPos + 17, 80, yPos + 17)
  }
  doc.text('FIRMA DEL EMPLEADOR', 50, yPos + 22, { align: 'center' })
  
  // Firma empleado
  doc.line(120, yPos + 17, 180, yPos + 17)
  doc.text('FIRMA DEL TRABAJADOR', 150, yPos + 22, { align: 'center' })
  
  // ========== PIE DE PÁGINA ==========
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Documento generado electrónicamente el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}`,
    105,
    285,
    { align: 'center' }
  )
  
  return doc
}

// Función para descargar el PDF
export const descargarBoletaPDF = (empleado, pago, empresa = {}) => {
  const doc = generarBoletaPDF(empleado, pago, empresa)
  const nombreArchivo = `Boleta_${empleado.nombre.replace(/\s+/g, '_')}_${new Date(pago.fecha).toISOString().split('T')[0]}.pdf`
  doc.save(nombreArchivo)
}

// Función para obtener el PDF como blob (para WhatsApp)
export const obtenerBoletaPDFBlob = (empleado, pago, empresa = {}) => {
  const doc = generarBoletaPDF(empleado, pago, empresa)
  return doc.output('blob')
}

// Función para enviar por WhatsApp
export const enviarBoletaPorWhatsApp = (empleado, pago, empresa = {}) => {
  // Generar el PDF
  const doc = generarBoletaPDF(empleado, pago, empresa)
  const pdfBlob = doc.output('blob')
  
  // Crear URL del blob
  const pdfUrl = URL.createObjectURL(pdfBlob)
  
  // Formatear el número de teléfono (eliminar espacios y caracteres especiales)
  let telefono = empleado.telefono?.replace(/\D/g, '') || ''
  
  // Si el teléfono no tiene código de país, agregar +51 (Perú)
  if (telefono.length === 9) {
    telefono = '51' + telefono
  }
  
  // Calcular neto a pagar
  const descuentos = parseFloat(pago.descuentos || 0)
  const netoAPagar = pago.monto - descuentos
  
  // Mensaje para WhatsApp
  const mensaje = `Hola ${empleado.nombre}, te enviamos tu boleta de pago del ${new Date(pago.fecha).toLocaleDateString('es-PE')}. Monto neto: S/. ${netoAPagar.toFixed(2)}`
  
  // Abrir WhatsApp Web con el mensaje
  const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
  
  // Abrir en nueva pestaña
  window.open(whatsappUrl, '_blank')
  
  // Descargar el PDF automáticamente para que el usuario lo pueda adjuntar
  const nombreArchivo = `Boleta_${empleado.nombre.replace(/\s+/g, '_')}_${new Date(pago.fecha).toISOString().split('T')[0]}.pdf`
  
  // Crear link temporal para descargar
  const link = document.createElement('a')
  link.href = pdfUrl
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Limpiar el URL del blob después de un tiempo
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100)
  
  return {
    success: true,
    mensaje: 'Se abrió WhatsApp y se descargó el PDF. Por favor, adjunta el archivo descargado en el chat.'
  }
}
