# Sistema de Farmacia Portable - Guía de Construcción

## Estructura del Proyecto

```
pharmacy-system/
├── backend/              # Backend Node.js + Express
├── frontend/             # Frontend HTML/CSS/JS
├── db/                   # Scripts SQL
└── installer/
    ├── launcher/         # Aplicación Python del launcher
    ├── license_generator/ # Generador de seriales
    ├── portable/         # Node.js y MariaDB portables
    ├── resources/        # Iconos y recursos
    └── Output/           # Instalador final
```

## Paso 1: Preparar Componentes Portables

### Node.js Portable
1. Descargar Node.js 20 Windows Binary (.zip): https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip
2. Extraer en `installer/portable/node/`
3. Instalar dependencias del backend:
```bash
cd backend
npm install
```

### MariaDB Portable
1. Descargar MariaDB 11 Windows ZIP: https://mariadb.org/download/
2. Extraer en `installer/portable/mariadb/`

## Paso 2: Construir el Launcher

```bash
cd installer/launcher
pip install -r requirements.txt
build_launcher.bat o .\build_launcher.bat
```

Esto generará `dist/FarmaciaLauncher.exe`

## Paso 3: Crear Instalador con Inno Setup

1. Instalar Inno Setup: https://jrsoftware.org/isdl.php
2. Abrir `installer/installer_script.iss` con Inno Setup
3. Compilar (Build > Compile)

El instalador final estará en `installer/Output/Instalador_SistemaFarmacia.exe`

## Uso del Sistema de Licencias

### Generar Serial para Cliente

1. El cliente ejecuta el instalador
2. Le aparece una ventana mostrando su HWID (ej: `8C16459F2AD71A2B`)
3. El cliente te envía ese HWID por WhatsApp
4. Tú ejecutas:

```bash
cd installer/license_generator
python generate_serial.py 8C16459F2AD71A2B
```

5. Te mostrará el serial (ej: `FARM-BOL-2025-1A2B-3C4D-5E6F`)
6. Envías ese serial al cliente
7. El cliente lo ingresa y activa su licencia

### Características del Sistema de Licencia

- **Anti-reventa**: El serial solo funciona en la PC donde se generó el HWID
- **Encriptación**: La licencia se guarda encriptada con Fernet
- **Hardware binding**: Usa MAC address, UUID, CPU ID y Serial de disco
- **Persistente**: Una vez activado, no vuelve a pedir licencia
- **Seguro**: El algoritmo de generación está en tu servidor, no en el cliente

## Distribución Final

Entregar solo: `Instalador_SistemaFarmacia.exe` (~150-200 MB)

El instalador:
- Instala todo automáticamente
- Crea acceso directo en escritorio
- Solicita activación en primer uso
- Inicia el launcher después de instalar

## Notas Importantes

- El SECRET_SALT en `hwid_manager.py` y `generate_serial.py` DEBE SER EL MISMO
- Nunca distribuyas el código fuente del generador de seriales
- Mantén backups de las licencias generadas
- El HWID es único por PC, cada instalación en nueva PC requiere nuevo serial
