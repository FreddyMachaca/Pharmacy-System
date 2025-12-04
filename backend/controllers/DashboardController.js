const VentaModel = require('../models/VentaModel');
const ProductoModel = require('../models/ProductoModel');
const ReporteModel = require('../models/ReporteModel');
const CajaModel = require('../models/CajaModel');
const { pool } = require('../config/database');

const formatearFechaISO = (fecha) => fecha.toISOString().split('T')[0];

const obtenerVentasRecientes = async () => {
    const [rows] = await pool.execute(`
        SELECT v.id, v.numero_venta, v.total, v.fecha_venta, v.metodo_pago,
               COALESCE(NULLIF(CONCAT(TRIM(c.nombre), ' ', TRIM(c.apellido)), ' '), 'Cliente General') as cliente,
               u.nombre as usuario
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.estado = 'Completada'
        ORDER BY v.fecha_venta DESC
        LIMIT 6
    `);
    return rows;
};

const obtenerProductosBajoStock = async () => {
    const [rows] = await pool.execute(`
        SELECT id, nombre, stock_actual, stock_minimo
        FROM productos
        WHERE activo = 1 AND stock_actual <= stock_minimo
        ORDER BY stock_actual ASC
        LIMIT 5
    `);
    return rows;
};

const obtenerConteosGenerales = async () => {
    const [productos, clientes, categorias, laboratorios, usuarios] = await Promise.all([
        pool.execute('SELECT COUNT(*) as total FROM productos WHERE activo = 1'),
        pool.execute('SELECT COUNT(*) as total FROM clientes WHERE activo = 1'),
        pool.execute('SELECT COUNT(*) as total FROM categorias WHERE activo = 1'),
        pool.execute('SELECT COUNT(*) as total FROM laboratorios WHERE activo = 1'),
        pool.execute('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1')
    ]);

    return {
        productosActivos: productos[0][0]?.total || 0,
        clientesActivos: clientes[0][0]?.total || 0,
        categoriasActivas: categorias[0][0]?.total || 0,
        laboratoriosActivos: laboratorios[0][0]?.total || 0,
        usuariosActivos: usuarios[0][0]?.total || 0
    };
};

const DashboardController = {
    async obtenerResumen(req, res) {
        try {
            const hoy = new Date();
            const fechaFin = formatearFechaISO(hoy);
            const inicioSemana = new Date(hoy);
            inicioSemana.setDate(inicioSemana.getDate() - 6);
            const fechaInicioSemana = formatearFechaISO(inicioSemana);
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const fechaInicioMes = formatearFechaISO(inicioMes);

            const [
                ventasHoy,
                resumenMensual,
                ventasDiarias,
                topProductos,
                metodosPago,
                productosStats,
                inventarioResumen,
                proximosVencer,
                cajaActual,
                ventasRecientes,
                stockCritico,
                conteos
            ] = await Promise.all([
                VentaModel.ventasDelDia(),
                ReporteModel.ventasResumen(fechaInicioMes, fechaFin),
                ReporteModel.ventasPorPeriodo(fechaInicioSemana, fechaFin),
                ReporteModel.productosMasVendidos(fechaInicioMes, fechaFin, 5),
                ReporteModel.ventasPorMetodoPago(fechaInicioSemana, fechaFin),
                ProductoModel.obtenerEstadisticas(),
                ReporteModel.inventarioResumen(),
                ReporteModel.productosProximosVencer(60),
                CajaModel.obtenerResumenActual(),
                obtenerVentasRecientes(),
                obtenerProductosBajoStock(),
                obtenerConteosGenerales()
            ]);

            res.json({
                success: true,
                data: {
                    periodoSemana: { inicio: fechaInicioSemana, fin: fechaFin },
                    periodoMes: { inicio: fechaInicioMes, fin: fechaFin },
                    ventasHoy,
                    resumenMensual,
                    ventasDiarias,
                    topProductos,
                    metodosPago,
                    productosStats,
                    inventarioResumen,
                    proximosVencer: proximosVencer.slice(0, 5),
                    cajaActual,
                    ventasRecientes,
                    stockCritico,
                    conteos
                }
            });
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            res.status(500).json({ success: false, mensaje: 'Error al cargar los datos del dashboard' });
        }
    }
};

module.exports = DashboardController;
