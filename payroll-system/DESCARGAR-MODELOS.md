# Descargar Modelos de Face-api.js

Para que el reconocimiento facial funcione, necesitas descargar los modelos pre-entrenados.

## Pasos:

### Opción 1: Descarga Manual (Recomendada)

1. Ve a: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

2. Descarga estos archivos y colócalos en `payroll-system/public/models/`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

3. La estructura debe quedar así:
```
payroll-system/
└── public/
    └── models/
        ├── tiny_face_detector_model-weights_manifest.json
        ├── tiny_face_detector_model-shard1
        ├── face_landmark_68_model-weights_manifest.json
        ├── face_landmark_68_model-shard1
        ├── face_recognition_model-weights_manifest.json
        ├── face_recognition_model-shard1
        ├── face_recognition_model-shard2
        ├── face_expression_model-weights_manifest.json
        └── face_expression_model-shard1
```

### Opción 2: Descarga con Script

Ejecuta en la terminal (desde la carpeta payroll-system):

```bash
# Crear carpeta models
mkdir -p public/models

# Descargar modelos (requiere curl o wget)
cd public/models

# Tiny Face Detector
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Face Landmark 68
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Face Recognition
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2

# Face Expression
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
```

## Verificación

Los modelos ocupan aproximadamente 6-8 MB en total. Una vez descargados, la aplicación los cargará automáticamente al iniciar el módulo de asistencias.

## Nota Importante

⚠️ **NO subas estos archivos a Git** si tu repositorio es público, ya que son archivos grandes. Agrega `public/models/` a tu `.gitignore`.
