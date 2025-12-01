const { pool } = require('../config/database');

const LaboratorioModel = {
    async listarTodos(soloActivos = true) {
        const where = soloActivos ? 'WHERE activo = 1' : '';
        const [rows] = await pool.execute(`
            SELECT * FROM laboratorios ${where} ORDER BY nombre ASC
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
        const { nombre, pais, contacto, telefono, correo } = laboratorio;
        const [result] = await pool.execute(
            'INSERT INTO laboratorios (nombre, pais, contacto, telefono, correo) VALUES (?, ?, ?, ?, ?)',
            [nombre, pais || null, contacto || null, telefono || null, correo || null]
        );
        return result.insertId;
    },

    async actualizar(id, laboratorio) {
        const { nombre, pais, contacto, telefono, correo } = laboratorio;
        await pool.execute(
            'UPDATE laboratorios SET nombre = ?, pais = ?, contacto = ?, telefono = ?, correo = ? WHERE id = ?',
            [nombre, pais || null, contacto || null, telefono || null, correo || null, id]
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
