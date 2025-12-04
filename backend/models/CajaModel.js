const { pool } = require('../config/database');

const CajaModel = {
    async obtenerCajaAbierta(usuarioId = null) {
        let query = `
            SELECT c.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
            FROM caja c
            INNER JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.estado = 'abierta'
        `;
        const params = [];
        
        if (usuarioId) {
            query += ' AND c.usuario_id = ?';
            params.push(usuarioId);
        }
        
        query += ' ORDER BY c.fecha_apertura DESC LIMIT 1';
        
        const [rows] = await pool.execute(query, params);
        return rows[0] || null;
    },

    async abrirCaja(usuarioId, montoInicial, observaciones = null, montoReutilizado = 0, origenCajaId = null) {
        const cajaAbierta = await this.obtenerCajaAbierta();
        if (cajaAbierta) {
            throw new Error('Ya existe una caja abierta');
        }

        const [result] = await pool.execute(
            `INSERT INTO caja (usuario_id, fecha_apertura, monto_inicial, monto_reutilizado, origen_caja_id, observaciones)
             VALUES (?, CONVERT_TZ(NOW(), @@session.time_zone, '-04:00'), ?, ?, ?, ?)`,
            [usuarioId, montoInicial, montoReutilizado || 0, origenCajaId, observaciones]
        );
        return result.insertId;
    },

    async cerrarCaja(cajaId, observaciones = null) {
        const caja = await this.obtenerPorId(cajaId);
        if (!caja || caja.estado === 'cerrada') {
            throw new Error('La caja no existe o ya está cerrada');
        }

        const ventasStats = await this.obtenerEstadisticasVentas(caja.id);
        const ventasDelDia = ventasStats.total_ventas;
        const montoFinal = parseFloat(caja.monto_inicial) + parseFloat(ventasDelDia) - parseFloat(caja.monto_gastos || 0);

        await pool.execute(
            `UPDATE caja SET 
                estado = 'cerrada', 
                fecha_cierre = CONVERT_TZ(NOW(), @@session.time_zone, '-04:00'), 
                monto_ventas = ?,
                monto_final = ?,
                observaciones = CONCAT(IFNULL(observaciones, ''), ?)
             WHERE id = ?`,
            [ventasDelDia, montoFinal, observaciones ? '\n' + observaciones : '', cajaId]
        );

        return { ventasDelDia, montoFinal };
    },

    async obtenerPorId(id) {
        const [rows] = await pool.execute(
            `SELECT c.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
             FROM caja c
             INNER JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async listarHistorial(limite = 30, offset = 0) {
        const parsedLimite = parseInt(limite, 10);
        const parsedOffset = parseInt(offset, 10);
        const safeLimite = Math.min(Math.max(parsedLimite || 10, 1), 100);
        const safeOffset = Math.max(parsedOffset || 0, 0);

        const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM caja');

        const [rows] = await pool.execute(
              `SELECT c.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
               FROM caja c
               INNER JOIN usuarios u ON c.usuario_id = u.id
               ORDER BY COALESCE(c.fecha_cierre, c.fecha_apertura) DESC
               LIMIT ${safeLimite} OFFSET ${safeOffset}`
        );

        await Promise.all(rows.map(async (caja) => {
            if (caja.estado === 'abierta') {
                const stats = await this.obtenerEstadisticasVentas(caja.id);
                caja.monto_ventas = stats.total_ventas;
                caja.monto_final = parseFloat(caja.monto_inicial) + stats.total_ventas - parseFloat(caja.monto_gastos || 0);
            }
        }));

        return { registros: rows, total };
    },

    async registrarGasto(cajaId, monto, descripcion) {
        const caja = await this.obtenerPorId(cajaId);
        if (!caja || caja.estado === 'cerrada') {
            throw new Error('No hay caja abierta');
        }

        const nuevoMontoGastos = parseFloat(caja.monto_gastos || 0) + parseFloat(monto);
        
        await pool.execute(
            `UPDATE caja SET monto_gastos = ? WHERE id = ?`,
            [nuevoMontoGastos, cajaId]
        );

        return nuevoMontoGastos;
    },

    async obtenerResumenActual() {
        const caja = await this.obtenerCajaAbierta();
        if (!caja) return null;

        const ventasStats = await this.obtenerEstadisticasVentas(caja.id);

        return {
            ...caja,
            ventas_actuales: ventasStats.total_ventas,
            cantidad_ventas: ventasStats.cantidad_ventas,
            saldo_actual: parseFloat(caja.monto_inicial) + parseFloat(ventasStats.total_ventas) - parseFloat(caja.monto_gastos || 0)
        };
    },

    async registrarMovimiento(cajaId, tipo, monto, descripcion, usuarioId) {
        const caja = await this.obtenerPorId(cajaId);
        if (!caja || caja.estado === 'cerrada') {
            throw new Error('No hay caja abierta');
        }

        const [result] = await pool.execute(
            `INSERT INTO movimientos_caja (caja_id, tipo, monto, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)`,
            [cajaId, tipo, monto, descripcion, usuarioId]
        );

        if (tipo === 'egreso') {
            const nuevoMontoGastos = parseFloat(caja.monto_gastos || 0) + parseFloat(monto);
            await pool.execute(`UPDATE caja SET monto_gastos = ? WHERE id = ?`, [nuevoMontoGastos, cajaId]);
        }

        return result.insertId;
    },

    async obtenerMovimientos(cajaId) {
        const [rows] = await pool.execute(
            `SELECT mc.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
             FROM movimientos_caja mc
             INNER JOIN usuarios u ON mc.usuario_id = u.id
             WHERE mc.caja_id = ?
             ORDER BY mc.fecha_creacion DESC`,
            [cajaId]
        );
        return rows;
    },

    async obtenerVentasDeCaja(cajaId) {
        const [rows] = await pool.execute(
            `SELECT v.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             WHERE v.caja_id = ? AND v.estado = 'Completada'
             ORDER BY v.fecha_venta DESC`,
            [cajaId]
        );
        return rows;
    },

    async obtenerEstadisticasVentas(cajaId) {
        const [rows] = await pool.execute(
            `SELECT 
                COALESCE(SUM(total), 0) as total_ventas,
                COUNT(*) as cantidad_ventas
             FROM ventas
             WHERE caja_id = ? AND estado = 'Completada'`,
            [cajaId]
        );

        return {
            total_ventas: parseFloat(rows[0].total_ventas) || 0,
            cantidad_ventas: rows[0].cantidad_ventas || 0
        };
    },

    async obtenerUltimaCajaCerrada() {
        const [rows] = await pool.execute(
            `SELECT c.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido
             FROM caja c
             INNER JOIN usuarios u ON c.usuario_id = u.id
             WHERE c.estado = 'cerrada'
             ORDER BY c.fecha_cierre DESC
             LIMIT 1`
        );
        return rows[0] || null;
    }
};

module.exports = CajaModel;
