const { pool } = require('../config/database');

const ClienteModel = {
    async listarTodos(incluirInactivos = false) {
        let query = `
            SELECT * FROM clientes
            ${incluirInactivos ? '' : 'WHERE activo = 1'}
            ORDER BY nombre ASC
        `;
        const [rows] = await pool.execute(query);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute('SELECT * FROM clientes WHERE id = ?', [id]);
        return rows[0];
    },

    async buscarPorDocumento(numero_documento) {
        const [rows] = await pool.execute(
            'SELECT * FROM clientes WHERE numero_documento = ?', 
            [numero_documento]
        );
        return rows[0];
    },

    async buscar(termino) {
        const [rows] = await pool.execute(`
            SELECT * FROM clientes 
            WHERE activo = 1 AND (
                nombre LIKE ? OR 
                apellido LIKE ? OR 
                numero_documento LIKE ? OR
                telefono LIKE ?
            )
            ORDER BY nombre ASC
            LIMIT 20
        `, [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`]);
        return rows;
    },

    async crear(cliente) {
        const { tipo_documento, numero_documento, nombre, apellido, telefono, correo, direccion, ciudad } = cliente;
        const [result] = await pool.execute(`
            INSERT INTO clientes (tipo_documento, numero_documento, nombre, apellido, telefono, correo, direccion, ciudad)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tipo_documento || 'CI', numero_documento || null, nombre, apellido || null, telefono || null, correo || null, direccion || null, ciudad || null]);
        return result.insertId;
    },

    async actualizar(id, cliente) {
        const { tipo_documento, numero_documento, nombre, apellido, telefono, correo, direccion, ciudad } = cliente;
        await pool.execute(`
            UPDATE clientes SET 
                tipo_documento = ?, numero_documento = ?, nombre = ?, apellido = ?,
                telefono = ?, correo = ?, direccion = ?, ciudad = ?
            WHERE id = ?
        `, [tipo_documento, numero_documento, nombre, apellido, telefono, correo, direccion, ciudad, id]);
    },

    async cambiarEstado(id, activo) {
        await pool.execute('UPDATE clientes SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
    }
};

module.exports = ClienteModel;
