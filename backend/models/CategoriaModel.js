const { pool } = require('../config/database');

const CategoriaModel = {
    async listarTodas(incluirInactivas = false) {
        const where = incluirInactivas ? '' : 'WHERE c.activo = 1';
        const [rows] = await pool.execute(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM productos WHERE categoria_id = c.id AND activo = 1) as total_productos
            FROM categorias c 
            ${where} 
            ORDER BY c.nombre ASC
        `);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM categorias WHERE id = ?', [id]
        );
        return rows[0] || null;
    },

    async crear(categoria) {
        const { nombre, descripcion } = categoria;
        const [result] = await pool.execute(
            'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion || null]
        );
        return result.insertId;
    },

    async actualizar(id, categoria) {
        const { nombre, descripcion } = categoria;
        await pool.execute(
            'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion || null, id]
        );
    },

    async cambiarEstado(id, activo) {
        await pool.execute(
            'UPDATE categorias SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
    }
};

module.exports = CategoriaModel;
