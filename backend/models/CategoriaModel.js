const { pool } = require('../config/database');

const CategoriaModel = {
    async listarTodas(soloActivas = true) {
        const where = soloActivas ? 'WHERE activo = 1' : '';
        const [rows] = await pool.execute(`
            SELECT * FROM categorias ${where} ORDER BY nombre ASC
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
