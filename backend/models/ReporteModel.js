const { pool } = require('../config/database');

const ReporteModel = {
    async ventasPorPeriodo(fechaInicio, fechaFin) {
        const [rows] = await pool.execute(`
            SELECT 
                DATE(fecha_venta) as fecha,
                COUNT(*) as cantidad_ventas,
                SUM(total) as total_ventas,
                SUM(descuento) as total_descuentos
            FROM ventas 
            WHERE estado = 'Completada' 
                AND DATE(fecha_venta) BETWEEN ? AND ?
            GROUP BY DATE(fecha_venta)
            ORDER BY fecha DESC
        `, [fechaInicio, fechaFin]);
        return rows;
    },

    async ventasResumen(fechaInicio, fechaFin) {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT v.id) as total_ventas,
                COALESCE(SUM(v.total), 0) as ingresos_totales,
                COALESCE(AVG(v.total), 0) as promedio_venta,
                COALESCE(SUM(v.descuento), 0) as descuentos_totales,
                COALESCE(SUM(dv.cantidad), 0) as productos_vendidos
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            WHERE v.estado = 'Completada' 
                AND DATE(v.fecha_venta) BETWEEN ? AND ?
        `, [fechaInicio, fechaFin]);
        return rows[0];
    },

    async productosMasVendidos(fechaInicio, fechaFin, limite = 10) {
        const [rows] = await pool.execute(`
            SELECT 
                p.id,
                p.nombre,
                p.codigo_barras,
                l.nombre as laboratorio,
                SUM(dv.cantidad) as cantidad_vendida,
                SUM(dv.subtotal) as total_vendido
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            INNER JOIN ventas v ON dv.venta_id = v.id
            WHERE v.estado = 'Completada' 
                AND DATE(v.fecha_venta) BETWEEN ? AND ?
            GROUP BY p.id, p.nombre, p.codigo_barras, l.nombre
            ORDER BY cantidad_vendida DESC
            LIMIT ${parseInt(limite)}
        `, [fechaInicio, fechaFin]);
        return rows;
    },

    async ventasPorMetodoPago(fechaInicio, fechaFin) {
        const [rows] = await pool.execute(`
            SELECT 
                metodo_pago,
                COUNT(*) as cantidad,
                SUM(total) as total
            FROM ventas 
            WHERE estado = 'Completada' 
                AND DATE(fecha_venta) BETWEEN ? AND ?
            GROUP BY metodo_pago
            ORDER BY total DESC
        `, [fechaInicio, fechaFin]);
        return rows;
    },

    async inventarioGeneral() {
        const [rows] = await pool.execute(`
            SELECT 
                p.id,
                p.nombre,
                p.codigo_barras,
                p.categoria_id as id_categoria,
                c.nombre as categoria,
                l.nombre as laboratorio,
                p.stock_actual,
                p.stock_minimo,
                p.precio_compra,
                p.precio_venta,
                (p.stock_actual * p.precio_compra) as valor_inventario,
                CASE 
                    WHEN p.stock_actual = 0 THEN 'Sin Stock'
                    WHEN p.stock_actual <= p.stock_minimo THEN 'Stock Bajo'
                    ELSE 'Normal'
                END as estado_stock
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            WHERE p.activo = 1
            ORDER BY p.nombre
        `);
        return rows;
    },

    async inventarioResumen() {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total_productos,
                SUM(stock_actual) as total_unidades,
                SUM(stock_actual * precio_compra) as valor_total_inventario,
                SUM(stock_actual * precio_venta) as valor_total_venta,
                SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as productos_sin_stock,
                SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productos_stock_bajo
            FROM productos
            WHERE activo = 1
        `);
        return rows[0];
    },

    async inventarioPorCategoria() {
        const [rows] = await pool.execute(`
            SELECT 
                COALESCE(c.nombre, 'Sin Categoría') as categoria,
                COUNT(p.id) as total_productos,
                SUM(p.stock_actual) as stock_total,
                SUM(p.stock_actual * p.precio_compra) as valor_inventario
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            GROUP BY c.id, c.nombre
            ORDER BY valor_inventario DESC
        `);
        return rows;
    },

    async productosProximosVencer(dias = 90) {
        const [rows] = await pool.execute(`
            SELECT 
                l.id as lote_id,
                l.numero_lote,
                l.fecha_vencimiento,
                l.cantidad_actual as stock_actual,
                p.id as producto_id,
                p.nombre as producto,
                p.codigo_barras,
                p.precio_compra,
                (l.cantidad_actual * p.precio_compra) as valor_stock,
                DATEDIFF(l.fecha_vencimiento, CURDATE()) as dias_para_vencer
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            WHERE l.cantidad_actual > 0 
                AND l.fecha_vencimiento IS NOT NULL
                AND l.fecha_vencimiento > CURDATE()
                AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY l.fecha_vencimiento ASC
        `, [dias]);
        return rows;
    },

    async productosVencidos() {
        const [rows] = await pool.execute(`
            SELECT 
                l.id as lote_id,
                l.numero_lote,
                l.fecha_vencimiento,
                l.cantidad_actual as stock_actual,
                p.id as producto_id,
                p.nombre as producto,
                p.codigo_barras,
                p.precio_compra,
                (l.cantidad_actual * p.precio_compra) as valor_stock,
                DATEDIFF(CURDATE(), l.fecha_vencimiento) as dias_para_vencer
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            WHERE l.cantidad_actual > 0 
                AND l.fecha_vencimiento IS NOT NULL
                AND l.fecha_vencimiento < CURDATE()
            ORDER BY l.fecha_vencimiento ASC
        `);
        return rows;
    },

    async resumenVencimientos() {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(CASE WHEN l.fecha_vencimiento < CURDATE() THEN 1 END) as lotes_vencidos,
                COUNT(CASE WHEN l.fecha_vencimiento >= CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 END) as lotes_proximos_vencer,
                COALESCE(SUM(CASE WHEN l.fecha_vencimiento >= CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN l.cantidad_actual ELSE 0 END), 0) as unidades_proximas_vencer,
                COALESCE(SUM(CASE WHEN l.fecha_vencimiento >= CURDATE() AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN l.cantidad_actual * p.precio_compra ELSE 0 END), 0) as valor_proximo_vencer
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            WHERE l.cantidad_actual > 0 AND l.fecha_vencimiento IS NOT NULL
        `);
        return rows[0];
    }
};

module.exports = ReporteModel;
