const { pool } = require('../config/database');

const ProductoModel = {
    async listarTodos(incluirInactivos = false) {
        const whereClause = incluirInactivos ? '' : 'WHERE p.activo = 1';
        const [rows] = await pool.execute(`
            SELECT p.*, 
                   c.nombre as categoria_nombre,
                   l.nombre as laboratorio_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            ${whereClause}
            ORDER BY p.nombre ASC
        `);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute(`
            SELECT p.*, 
                   c.nombre as categoria_nombre,
                   l.nombre as laboratorio_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            WHERE p.id = ?
        `, [id]);
        return rows[0] || null;
    },

    async buscarPorCodigo(codigoBarras) {
        const [rows] = await pool.execute(`
            SELECT p.*, 
                   c.nombre as categoria_nombre,
                   l.nombre as laboratorio_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            WHERE p.codigo_barras = ? AND p.activo = 1
        `, [codigoBarras]);
        return rows[0] || null;
    },

    async buscar(termino) {
        const busqueda = `%${termino}%`;
        const [rows] = await pool.execute(`
            SELECT p.*, 
                   c.nombre as categoria_nombre,
                   l.nombre as laboratorio_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN laboratorios l ON p.laboratorio_id = l.id
            WHERE p.activo = 1 
              AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR p.descripcion LIKE ?)
            ORDER BY p.nombre ASC
            LIMIT 50
        `, [busqueda, busqueda, busqueda]);
        return rows;
    },

    async crear(producto) {
        const { 
            codigo_barras, nombre, descripcion, categoria_id, laboratorio_id,
            precio_compra, precio_venta, stock_actual, stock_minimo, requiere_receta 
        } = producto;
        
        const [result] = await pool.execute(`
            INSERT INTO productos 
            (codigo_barras, nombre, descripcion, categoria_id, laboratorio_id,
             precio_compra, precio_venta, stock_actual, stock_minimo, requiere_receta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            codigo_barras || null, nombre, descripcion || null, 
            categoria_id || null, laboratorio_id || null,
            precio_compra || 0, precio_venta || 0, 
            stock_actual || 0, stock_minimo || 5, requiere_receta || 0
        ]);
        return result.insertId;
    },

    async actualizar(id, producto) {
        const { 
            codigo_barras, nombre, descripcion, categoria_id, laboratorio_id,
            precio_compra, precio_venta, stock_minimo, requiere_receta 
        } = producto;
        
        await pool.execute(`
            UPDATE productos SET
                codigo_barras = ?, nombre = ?, descripcion = ?, 
                categoria_id = ?, laboratorio_id = ?,
                precio_compra = ?, precio_venta = ?, 
                stock_minimo = ?, requiere_receta = ?
            WHERE id = ?
        `, [
            codigo_barras || null, nombre, descripcion || null,
            categoria_id || null, laboratorio_id || null,
            precio_compra, precio_venta, stock_minimo, requiere_receta || 0, id
        ]);
    },

    async actualizarStock(id, cantidad, operacion = 'set') {
        if (operacion === 'add') {
            await pool.execute(
                'UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?',
                [cantidad, id]
            );
        } else if (operacion === 'subtract') {
            await pool.execute(
                'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
                [cantidad, id]
            );
        } else {
            await pool.execute(
                'UPDATE productos SET stock_actual = ? WHERE id = ?',
                [cantidad, id]
            );
        }
    },

    async cambiarEstado(id, activo) {
        await pool.execute(
            'UPDATE productos SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
    },

    async obtenerEstadisticas() {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_productos,
                SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as bajo_stock,
                SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as sin_stock,
                SUM(stock_actual * precio_compra) as valor_inventario
            FROM productos
            WHERE activo = 1
        `);
        return stats[0];
    },

    async verificarCodigoExiste(codigoBarras, excludeId = null) {
        let query = 'SELECT id FROM productos WHERE codigo_barras = ?';
        const params = [codigoBarras];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    },

    async listarMovimientos() {
        const [rows] = await pool.execute(`
            SELECT m.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
            FROM movimientos_inventario m
            INNER JOIN productos p ON m.producto_id = p.id
            LEFT JOIN usuarios u ON m.usuario_id = u.id
            ORDER BY m.created_at DESC
            LIMIT 500
        `);
        return rows;
    },

    async registrarMovimiento(movimiento) {
        const { producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id } = movimiento;
        const [result] = await pool.execute(`
            INSERT INTO movimientos_inventario 
            (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo || null, usuario_id]);
        return result.insertId;
    }
};

module.exports = ProductoModel;
