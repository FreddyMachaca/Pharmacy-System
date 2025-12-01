const { pool } = require('../config/database');

const LaboratorioModel = {
    async listarTodos(incluirInactivos = false) {
        const where = incluirInactivos ? '' : 'WHERE l.activo = 1';
        const [rows] = await pool.execute(`
            SELECT l.*, 
                   (SELECT COUNT(*) FROM productos WHERE laboratorio_id = l.id AND activo = 1) as total_productos
            FROM laboratorios l 
            ${where} 
            ORDER BY l.nombre ASC
        `);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute(
            'SELECT * FROM laboratorios WHERE id = ?', [id]
        );
        return rows[0] || null;
    },

    async crear(laboratorio) {
        const { nombre, pais, direccion, telefono, email } = laboratorio;
        const [result] = await pool.execute(
            'INSERT INTO laboratorios (nombre, pais, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)',
            [nombre, pais || null, direccion || null, telefono || null, email || null]
        );
        return result.insertId;
    },

    async actualizar(id, laboratorio) {
        const { nombre, pais, direccion, telefono, email } = laboratorio;
        await pool.execute(
            'UPDATE laboratorios SET nombre = ?, pais = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?',
            [nombre, pais || null, direccion || null, telefono || null, email || null, id]
        );
    },

    async cambiarEstado(id, activo) {
        await pool.execute(
            'UPDATE laboratorios SET activo = ? WHERE id = ?',
            [activo ? 1 : 0, id]
        );
    }
};

module.exports = LaboratorioModel;
