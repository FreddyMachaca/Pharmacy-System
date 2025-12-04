-- =====================================================
-- PHARMACY SYSTEM
-- Sistema de Farmacia Local Portable
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS farmacia_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE farmacia_db;

-- =====================================================
-- TABLA: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    es_sistema TINYINT(1) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: modulos
-- =====================================================
CREATE TABLE IF NOT EXISTS modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: permisos_rol
-- =====================================================
CREATE TABLE IF NOT EXISTS permisos_rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    modulo_id INT NOT NULL,
    puede_ver TINYINT(1) DEFAULT 0,
    puede_crear TINYINT(1) DEFAULT 0,
    puede_editar TINYINT(1) DEFAULT 0,
    puede_eliminar TINYINT(1) DEFAULT 0,
    UNIQUE KEY unique_rol_modulo (rol_id, modulo_id),
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    ultimo_acceso DATETIME,
    token_version INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: laboratorios
-- =====================================================
CREATE TABLE IF NOT EXISTS laboratorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    pais VARCHAR(100),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(150),
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id INT,
    laboratorio_id INT,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    requiere_receta TINYINT(1) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: lotes
-- =====================================================
CREATE TABLE IF NOT EXISTS lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    numero_lote VARCHAR(100) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE NOT NULL,
    cantidad_inicial INT NOT NULL DEFAULT 0,
    cantidad_actual INT NOT NULL DEFAULT 0,
    precio_compra DECIMAL(10,2),
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento VARCHAR(20) DEFAULT 'CI',
    numero_documento VARCHAR(20) UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion TEXT,
    ciudad VARCHAR(100),
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: proveedores
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    direccion TEXT,
    ciudad VARCHAR(100),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    correo VARCHAR(150),
    contacto VARCHAR(150),
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: caja
-- =====================================================
CREATE TABLE IF NOT EXISTS caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monto_ventas DECIMAL(12,2) DEFAULT 0.00,
    monto_gastos DECIMAL(12,2) DEFAULT 0.00,
    monto_final DECIMAL(12,2) DEFAULT 0.00,
    estado ENUM('abierta', 'cerrada') DEFAULT 'abierta',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: movimientos_caja
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caja_id INT NOT NULL,
    tipo ENUM('ingreso', 'egreso') NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    descripcion VARCHAR(255),
    usuario_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (caja_id) REFERENCES caja(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_venta VARCHAR(20) UNIQUE NOT NULL,
    cliente_id INT,
    usuario_id INT NOT NULL,
    caja_id INT,
    fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
    monto_recibido DECIMAL(12,2) DEFAULT 0.00,
    cambio DECIMAL(12,2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'Completada',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (caja_id) REFERENCES caja(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: detalle_ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    lote_id INT,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(12,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: compras
-- =====================================================
CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_compra VARCHAR(20) UNIQUE NOT NULL,
    proveedor_id INT,
    usuario_id INT NOT NULL,
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'Recibida',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: detalle_compras
-- =====================================================
CREATE TABLE IF NOT EXISTS detalle_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT NOT NULL,
    lote_id INT,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: movimientos_inventario
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    lote_id INT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'ajuste',
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia_tipo VARCHAR(50),
    referencia_id INT,
    motivo TEXT,
    usuario_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: configuracion
-- =====================================================
CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion VARCHAR(255),
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO roles (nombre, descripcion, es_sistema) VALUES
('admin', 'Administrador con acceso total al sistema', 1),
('cajero', 'Acceso a punto de venta y consulta de productos', 1);

INSERT INTO modulos (codigo, nombre, descripcion, icono, orden) VALUES
('dashboard', 'Dashboard', 'Panel principal', 'pi-home', 1),
('punto-venta', 'Punto de Venta', 'Realizar ventas', 'pi-shopping-cart', 2),
('ventas', 'Historial Ventas', 'Ver historial de ventas', 'pi-list', 3),
('clientes', 'Clientes', 'Gestión de clientes', 'pi-users', 4),
('productos', 'Productos', 'Gestión de productos', 'pi-box', 5),
('categorias', 'Categorías', 'Gestión de categorías', 'pi-tags', 6),
('laboratorios', 'Laboratorios', 'Gestión de laboratorios', 'pi-building', 7),
('lotes', 'Lotes', 'Gestión de lotes', 'pi-calendar', 8),
('movimientos', 'Movimientos', 'Movimientos de inventario', 'pi-arrows-h', 9),
('reporte-ventas', 'Reporte Ventas', 'Reportes de ventas', 'pi-chart-bar', 10),
('reporte-inventario', 'Reporte Inventario', 'Reportes de inventario', 'pi-chart-pie', 11),
('reporte-vencimientos', 'Próximos a Vencer', 'Productos por vencer', 'pi-exclamation-triangle', 12),
('reportes-profesionales', 'Reportes Exportables', 'Exportar reportes PDF/Excel', 'pi-file-pdf', 13),
('usuarios', 'Usuarios', 'Gestión de usuarios y roles', 'pi-user-edit', 14),
('caja', 'Caja', 'Control de caja', 'pi-wallet', 15),
('configuracion', 'Configuración', 'Configuración del sistema', 'pi-cog', 16);

INSERT INTO permisos_rol (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, id, 1, 1, 1, 1 FROM modulos;

INSERT INTO permisos_rol (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
(2, 1, 1, 0, 0, 0),
(2, 2, 1, 1, 0, 0),
(2, 3, 1, 0, 0, 0),
(2, 4, 1, 1, 1, 0),
(2, 5, 1, 0, 0, 0),
(2, 15, 1, 1, 0, 0);

INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol_id) VALUES
('Administrador', 'Sistema', 'admin@gmail.com', '$2b$10$dBa05e56IjqpXzi9Hzzbh.HjFfTr7Lc5kevXlMakQinv/ajQy/I0q', 1);

INSERT INTO categorias (nombre, descripcion) VALUES
('Analgésicos', 'Medicamentos para el dolor'),
('Antibióticos', 'Medicamentos antibacterianos'),
('Antiinflamatorios', 'Medicamentos antiinflamatorios'),
('Vitaminas', 'Suplementos vitamínicos'),
('Dermatológicos', 'Productos para la piel'),
('Gastrointestinales', 'Medicamentos digestivos'),
('Respiratorios', 'Medicamentos para vías respiratorias'),
('Oftálmicos', 'Productos para los ojos'),
('Higiene', 'Productos de higiene personal'),
('Antiparasitarios', 'Medicamentos antiparasitarios'),
('Cardiovasculares', 'Medicamentos para el corazón'),
('Diabetes', 'Medicamentos para diabéticos'),
('Otros', 'Otros productos');

INSERT INTO laboratorios (nombre, pais) VALUES
('Inti', 'Bolivia'),
('Vita', 'Bolivia'),
('Cofar', 'Bolivia'),
('Droguería INTI', 'Bolivia'),
('Laboratorios Bagó', 'Argentina'),
('Bayer', 'Alemania'),
('Pfizer', 'Estados Unidos'),
('Roche', 'Suiza'),
('Novartis', 'Suiza'),
('GlaxoSmithKline', 'Reino Unido'),
('Sanofi', 'Francia'),
('Roemmers', 'Argentina'),
('Genérico', 'Bolivia');

INSERT INTO configuracion (clave, valor, descripcion) VALUES
('nombre_farmacia', 'Farmacia Central', 'Nombre de la farmacia'),
('direccion', 'Av. Principal 123', 'Dirección de la farmacia'),
('ciudad', 'La Paz', 'Ciudad de la farmacia'),
('departamento', 'La Paz', 'Departamento'),
('telefono', '(2) 234-5678', 'Teléfono principal'),
('celular', '70012345', 'Celular de contacto'),
('nit', '1234567890', 'NIT de la empresa'),
('moneda', 'Bs.', 'Símbolo de moneda (Bolivianos)'),
('iva', '13', 'Porcentaje de IVA Bolivia'),
('impresora_tickets', 'POS-80', 'Nombre de impresora de tickets');

INSERT INTO clientes (tipo_documento, numero_documento, nombre, apellido, ciudad) VALUES
('CI', '0000000', 'Cliente', 'General', 'La Paz');
