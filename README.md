# 💊 Pharmacy System - Sistema de Farmacia Local Portable

Sistema de gestión de farmacia 100% offline y portable para Windows 10/11.

---

## 📋 Tabla de Contenidos

1. [Características](#-características)
2. [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación Paso a Paso](#-instalación-paso-a-paso)
5. [Configuración](#-configuración)
6. [Ejecución del Sistema](#-ejecución-del-sistema)
7. [Estructura de Carpetas](#-estructura-de-carpetas)
8. [Base de Datos](#-base-de-datos)
9. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
10. [Paleta de Colores](#-paleta-de-colores)

---

## ✨ Características

- ✅ **100% Offline** - Funciona sin conexión a internet
- ✅ **Portable** - Copia la carpeta a un USB y funciona en cualquier PC
- ✅ **Multi-dispositivo** - Acceso desde celulares/tablets en red local
- ✅ **Roles de Usuario** - Admin, Cajero, Inventario
- ✅ **Punto de Venta** - Con lector de código de barras
- ✅ **Control de Inventario** - Stock, lotes, vencimientos
- ✅ **Reportes** - PDF y Excel
- ✅ **Backup con un clic** - Respaldo y restauración fácil

---

## 🏗 Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                               │
│         HTML5 + CSS3 + JavaScript Vanilla                   │
│              PrimeReact/PrimeFlex (CDN)                     │
│                    Puerto: 3000                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                      BACKEND                                │
│                 Node.js + Express                           │
│                    Puerto: 3000                             │
│                                                             │
│  ┌──────────┐ ┌────────────┐ ┌────────────┐ ┌─────────┐     │
│  │  Routes  │→│ Middleware │→│ Controller │→│  Model  │     │
│  └──────────┘ └────────────┘ └────────────┘ └────┬────┘     │
└──────────────────────────────────────────────────┼──────────┘
                                                   │ SQL
┌──────────────────────────────────────────────────▼──────────┐
│                     BASE DE DATOS                           │
│                  MariaDB (Puerto 3306)                      │
│                   Database: farmacia_db                     │
└─────────────────────────────────────────────────────────────┘
```

### Patrón de Arquitectura Backend

| Carpeta | Responsabilidad | Ejemplo |
|---------|-----------------|---------|
| `config/` | Configuración global (conexión BD, JWT) | `database.js`, `jwt.js` |
| `middleware/` | Filtros antes de controladores | Verificar JWT, proteger rutas |
| `routes/` | Definición de rutas REST | `router.get('/productos', ...)` |
| `controllers/` | **Toda la lógica de negocio** | Validar stock, calcular totales |
| `models/` | Solo consultas SQL puras | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| `utils/` | Funciones reutilizables | Formatear fechas, generar PDFs |

---

## 📌 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Software | Versión | Descarga |
|----------|---------|----------|
| Node.js | 18.x o superior | [nodejs.org](https://nodejs.org/) |
| MariaDB | 10.11 o superior | [mariadb.org](https://mariadb.org/download/) |

### Verificar instalaciones

```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
mysql --version   # Debe mostrar MariaDB o MySQL
```

---

## 🚀 Instalación Paso a Paso

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/FreddyMachaca/Pharmacy-System.git
cd Pharmacy-System
```

### Paso 2: Instalar dependencias del Backend

```bash
cd backend
npm install
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env

# O en PowerShell:
Copy-Item .env.example .env
```

Luego edita el archivo `.env` con tus credenciales:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=farmacia_db

JWT_SECRET=cambia_esta_clave_por_una_segura
JWT_EXPIRES=24h

PORT=3000
```

### Paso 4: Crear la Base de Datos

Abre tu cliente de MariaDB/MySQL y ejecuta el script SQL:

**Opción A: Desde línea de comandos**
```bash
mysql -u root -p < ../db/pharmacy.sql
```

**Opción B: Desde HeidiSQL, DBeaver o phpMyAdmin**
1. Abre el archivo `db/pharmacy.sql`
2. Ejecuta todo el contenido

### Paso 5: Verificar la base de datos

```sql
USE farmacia_db;
SHOW TABLES;
SELECT * FROM usuarios;
```

Deberías ver el usuario admin creado.

---

## ⚙ Configuración

### Archivo `.env`

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host de la base de datos | `127.0.0.1` |
| `DB_PORT` | Puerto de MariaDB | `3306` |
| `DB_USER` | Usuario de la BD | `root` |
| `DB_PASSWORD` | Contraseña de la BD | (vacío) |
| `DB_NAME` | Nombre de la base de datos | `farmacia_db` |
| `JWT_SECRET` | Clave secreta para tokens | (cambiar en producción) |
| `JWT_EXPIRES` | Tiempo de expiración del token | `24h` |
| `PORT` | Puerto del servidor | `3000` |

⚠️ **IMPORTANTE:** Nunca subas el archivo `.env` a Git. Ya está en `.gitignore`.

---

## ▶ Ejecución del Sistema

### Iniciar el servidor

```bash
cd backend
npm start
```

Verás en consola:

```
========================================
   PHARMACY SYSTEM
   Sistema de Farmacia Local Portable
========================================
Conexión a MariaDB exitosa
Servidor iniciado en puerto 3000
Frontend: http://localhost:3000
API: http://localhost:3000/api
========================================
```

### Acceder al sistema

1. Abre tu navegador
2. Ve a: **http://localhost:3000**
3. Inicia sesión con las credenciales por defecto

### Acceso desde otros dispositivos (red local)

1. Obtén tu IP local: `ipconfig` (Windows)
2. Desde otro dispositivo en la misma red, accede a: `http://TU_IP:3000`

---

## 📁 Estructura de Carpetas

```
Pharmacy-System/
├── backend/
│   ├── config/
│   │   ├── database.js      # Conexión a MariaDB
│   │   └── jwt.js           # Configuración JWT
│   ├── controllers/
│   │   └── AuthController.js # Lógica de autenticación
│   ├── middleware/
│   │   └── authMiddleware.js # Verificación de JWT
│   ├── models/
│   │   └── UsuarioModel.js   # Consultas SQL de usuarios
│   ├── routes/
│   │   └── authRoutes.js     # Rutas de autenticación
│   ├── utils/
│   │   └── helpers.js        # Funciones utilitarias
│   ├── .env                  # Variables de entorno (NO subir a Git)
│   ├── .env.example          # Ejemplo de variables de entorno
│   ├── package.json          # Dependencias Node.js
│   └── server.js             # Punto de entrada del servidor
│
├── frontend/
│   ├── css/
│   │   ├── variables.css     # Variables CSS (colores, tamaños)
│   │   ├── main.css          # Estilos globales
│   │   ├── login.css         # Estilos del login
│   │   └── layout.css        # Estilos del layout principal
│   ├── js/
│   │   ├── api.js            # Cliente HTTP para API
│   │   ├── auth.js           # Gestión de sesión/autenticación
│   │   ├── app.js            # Inicialización de la aplicación
│   │   └── components/
│   │       ├── login.js      # Componente de Login
│   │       ├── sidebar.js    # Menú lateral
│   │       ├── topbar.js     # Barra superior
│   │       └── layout.js     # Layout principal y páginas
│   └── index.html            # Página principal
│
├── db/
│   └── pharmacy.sql          # Script completo de la base de datos
│
├── .gitignore                # Archivos ignorados por Git
└── README.md                 # Este archivo
```

---

## 🗄 Base de Datos

### Tablas Disponibles

| Tabla | Descripción |
|-------|-------------|
| `roles` | Roles del sistema (admin, cajero, inventario) |
| `usuarios` | Usuarios del sistema |
| `categorias` | Categorías de productos |
| `laboratorios` | Fabricantes de medicamentos |
| `productos` | Catálogo de productos |
| `lotes` | Control de lotes y vencimientos |
| `clientes` | Base de clientes |
| `proveedores` | Proveedores de medicamentos |
| `ventas` | Registro de ventas |
| `detalle_ventas` | Productos vendidos por venta |
| `compras` | Registro de compras |
| `detalle_compras` | Productos comprados |
| `movimientos_inventario` | Entradas y salidas de stock |
| `caja` | Apertura y cierre de caja |
| `configuracion` | Parámetros del sistema |

---

## 🛠 Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MariaDB** - Base de datos relacional
- **mysql2** - Driver de MySQL para Node.js
- **bcrypt** - Encriptación de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **cors** - Manejo de CORS
- **dotenv** - Variables de entorno

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos (Vanilla, sin frameworks)
- **JavaScript** - Lógica (Vanilla, sin frameworks)
- **PrimeReact CSS** - Clases de estilos via CDN
- **PrimeFlex** - Sistema de grid via CDN
- **PrimeIcons** - Iconos via CDN

---

## 🎨 Paleta de Colores

| Color | HEX | Uso |
|-------|-----|-----|
| Azul Médico Primario | `#00C2FF` | Botones principales, acentos |
| Azul Profundo | `#256EFF` | Encabezados, hover, enlaces |
| Violeta Suave | `#8C78FF` | Fondos secundarios, tarjetas |
| Blanco Puro | `#FFFFFF` | Fondos y tarjetas |
| Gris Claro | `#F5F9FF` | Fondo general de la app |
| Texto Oscuro | `#1E2532` | Todo el texto principal |

Las variables están definidas en `frontend/css/variables.css`.

---