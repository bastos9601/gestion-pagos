# Script para descargar modelos de Face-api.js
# Ejecutar desde PowerShell en la carpeta payroll-system

Write-Host "🚀 Descargando modelos de Face-api.js..." -ForegroundColor Green

# Crear carpeta models si no existe
$modelsPath = "public\models"
if (-not (Test-Path $modelsPath)) {
    New-Item -ItemType Directory -Path $modelsPath -Force | Out-Null
    Write-Host "✅ Carpeta models creada" -ForegroundColor Green
}

# URL base de GitHub
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Lista de archivos a descargar
$files = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-shard1"
)

$totalFiles = $files.Count
$currentFile = 0

foreach ($file in $files) {
    $currentFile++
    $url = "$baseUrl/$file"
    $output = "$modelsPath\$file"
    
    Write-Host "[$currentFile/$totalFiles] Descargando $file..." -ForegroundColor Cyan
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
        Write-Host "  ✅ Descargado" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Error al descargar $file" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 ¡Descarga completada!" -ForegroundColor Green
Write-Host "Los modelos están en: $modelsPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Archivos descargados:" -ForegroundColor Cyan
Get-ChildItem $modelsPath | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  - $($_.Name) ($size MB)" -ForegroundColor White
}

$totalSize = (Get-ChildItem $modelsPath | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host ""
Write-Host "Tamaño total: $totalSizeMB MB" -ForegroundColor Yellow
