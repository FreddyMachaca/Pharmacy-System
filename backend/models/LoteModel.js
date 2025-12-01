const { pool } = require('../config/database');

const LoteModel = {
    async listarPorProducto(productoId) {
        const [rows] = await pool.execute(`
            SELECT * FROM lotes 
            WHERE producto_id = ? AND activo = 1
            ORDER BY fecha_vencimiento ASC
        `, [productoId]);
        return rows;
    },

    async listarProximosAVencer(dias = 90) {
        const [rows] = await pool.execute(`
            SELECT l.*, p.nombre as producto_nombre, p.codigo_barras
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            WHERE l.activo = 1 
              AND p.activo = 1
              AND l.cantidad_actual > 0
              AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY l.fecha_vencimiento ASC
        `, [dias]);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute(`
            SELECT l.*, p.nombre as producto_nombre
            FROM lotes l
            INNER JOIN productos p ON l.producto_id = p.id
            WHERE l.id = ?
        `, [id]);
        return rows[0] || null;
    },

    async crear(lote) {
        const { producto_id, numero_lote, fecha_fabricacion, fecha_vencimiento, cantidad_inicial, precio_compra } = lote;
        const [result] = await pool.execute(`
            INSERT INTO lotes 
            (producto_id, numero_lote, fecha_fabricacion, fecha_vencimiento, cantidad_inicial, cantidad_actual, precio_compra)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [producto_id, numero_lote, fecha_fabricacion || null, fecha_vencimiento, cantidad_inicial, cantidad_inicial, precio_compra || null]);
        return result.insertId;
    },

    async actualizar(id, lote) {
        const { numero_lote, fecha_fabricacion, fecha_vencimiento, precio_compra } = lote;
        await pool.execute(`
            UPDATE lotes SET 
                numero_lote = ?, fecha_fabricacion = ?, fecha_vencimiento = ?, precio_compra = ?
            WHERE id = ?
        `, [numero_lote, fecha_fabricacion || null, fecha_vencimiento, precio_compra || null, id]);
    },

    async actualizarCantidad(id, cantidad, operacion = 'set') {
        if (operacion === 'add') {
            await pool.execute(
                'UPDATE lotes SET cantidad_actual = cantidad_actual + ? WHERE id = ?',
                [cantidad, id]
            );
        } else if (operacion === 'subtract') {
            await pool.execute(
                'UPDATE lotes SET cantidad_actual = cantidad_actual - ? WHERE id = ?',
                [cantidad, id]
            );
        } else {
            await pool.execute(
                'UPDATE lotes SET cantidad_actual = ? WHERE id = ?',
                [cantidad, id]
            );
        }
    },

    async cambiarEstado(id, activo) {
        await pool.execute(
            'UPDATE lotes SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
    }
};

module.exports = LoteModel;
