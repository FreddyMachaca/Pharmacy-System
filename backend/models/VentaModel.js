const { pool } = require('../config/database');

const VentaModel = {
    async generarNumeroVenta() {
        const fecha = new Date();
        const prefijo = `V${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`;
        
        const [rows] = await pool.execute(
            "SELECT COUNT(*) as count FROM ventas WHERE numero_venta LIKE ?",
            [`${prefijo}%`]
        );
        
        const siguiente = rows[0].count + 1;
        return `${prefijo}-${String(siguiente).padStart(4, '0')}`;
    },

    async crear(venta) {
        const { numero_venta, cliente_id, usuario_id, subtotal, descuento, impuesto, total, metodo_pago, monto_recibido, cambio, observaciones } = venta;
        
        const [result] = await pool.execute(`
            INSERT INTO ventas (numero_venta, cliente_id, usuario_id, fecha_venta, subtotal, descuento, impuesto, total, metodo_pago, monto_recibido, cambio, observaciones)
            VALUES (?, ?, ?, CONVERT_TZ(NOW(), @@session.time_zone, '-04:00'), ?, ?, ?, ?, ?, ?, ?, ?)
        `, [numero_venta, cliente_id || null, usuario_id, subtotal, descuento || 0, impuesto || 0, total, metodo_pago || 'Efectivo', monto_recibido || total, cambio || 0, observaciones || null]);
        
        return result.insertId;
    },

    async agregarDetalle(detalle) {
        const { venta_id, producto_id, lote_id, cantidad, precio_unitario, descuento, subtotal } = detalle;
        
        await pool.execute(`
            INSERT INTO detalle_ventas (venta_id, producto_id, lote_id, cantidad, precio_unitario, descuento, subtotal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [venta_id, producto_id, lote_id || null, cantidad, precio_unitario, descuento || 0, subtotal]);
    },

    async listarTodas(filtros = {}) {
        let query = `
            SELECT v.*, 
                   c.nombre as cliente_nombre,
                   c.apellido as cliente_apellido,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filtros.fecha_inicio) {
            query += ' AND DATE(v.fecha_venta) >= ?';
            params.push(filtros.fecha_inicio);
        }
        
        if (filtros.fecha_fin) {
            query += ' AND DATE(v.fecha_venta) <= ?';
            params.push(filtros.fecha_fin);
        }
        
        if (filtros.estado) {
            query += ' AND v.estado = ?';
            params.push(filtros.estado);
        }
        
        query += ' ORDER BY v.fecha_venta DESC LIMIT 500';
        
        const [rows] = await pool.execute(query, params);
        return rows;
    },

    async obtenerPorId(id) {
        const [ventas] = await pool.execute(`
            SELECT v.*, 
                   c.nombre as cliente_nombre,
                   c.apellido as cliente_apellido,
                   c.numero_documento as cliente_documento,
                   u.nombre as usuario_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = ?
        `, [id]);
        
        if (!ventas[0]) return null;
        
        const [detalles] = await pool.execute(`
            SELECT dv.*, p.nombre as producto_nombre, p.codigo_barras
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
        `, [id]);
        
        return { ...ventas[0], detalles };
    },

    async anular(id, usuario_id) {
        const venta = await this.obtenerPorId(id);
        if (!venta) throw new Error('Venta no encontrada');
        
        for (const detalle of venta.detalles) {
            await pool.execute(
                'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
                [detalle.cantidad, detalle.producto_id]
            );
        }
        
        await pool.execute(
            "UPDATE ventas SET estado = 'Anulada' WHERE id = ?",
            [id]
        );
    },

    async ventasDelDia() {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
            FROM ventas 
            WHERE DATE(fecha_venta) = CURDATE() AND estado = 'Completada'
        `);
        return rows[0];
    },

    async estadisticas(fechaInicio, fechaFin) {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as total_ingresos,
                COALESCE(AVG(total), 0) as promedio_venta
            FROM ventas 
            WHERE DATE(fecha_venta) BETWEEN ? AND ? AND estado = 'Completada'
        `, [fechaInicio, fechaFin]);
        return rows[0];
    }
};

module.exports = VentaModel;
