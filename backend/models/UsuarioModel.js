const { pool } = require('../config/database');

const UsuarioModel = {
    async buscarPorCorreo(correo) {
        const [rows] = await pool.execute(
            `SELECT u.*, r.nombre as rol_nombre 
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             WHERE u.correo = ? AND u.activo = 1`,
            [correo]
        );
        return rows[0] || null;
    },

    async buscarPorId(id) {
        const [rows] = await pool.execute(
            `SELECT u.id, u.nombre, u.apellido, u.correo, u.telefono, u.rol_id, 
                    u.activo, u.ultimo_acceso, r.nombre as rol_nombre
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             WHERE u.id = ? AND u.activo = 1`,
            [id]
        );
        return rows[0] || null;
    },

    async actualizarUltimoAcceso(id) {
        await pool.execute(
            'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
            [id]
        );
    },

    async listarTodos() {
        const [rows] = await pool.execute(
            `SELECT u.id, u.nombre, u.apellido, u.correo, u.telefono, 
                    u.activo, u.ultimo_acceso, u.fecha_creacion, r.nombre as rol_nombre
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             ORDER BY u.fecha_creacion DESC`
        );
        return rows;
    },

    async crear(usuario) {
        const { nombre, apellido, correo, contrasena, telefono, rol_id } = usuario;
        const [result] = await pool.execute(
            `INSERT INTO usuarios (nombre, apellido, correo, contrasena, telefono, rol_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, correo, contrasena, telefono || null, rol_id]
        );
        return result.insertId;
    },

    async actualizar(id, usuario) {
        const { nombre, apellido, correo, telefono, rol_id, activo } = usuario;
        await pool.execute(
            `UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, 
             telefono = ?, rol_id = ?, activo = ? WHERE id = ?`,
            [nombre, apellido, correo, telefono, rol_id, activo, id]
        );
    },

    async cambiarContrasena(id, nuevaContrasena) {
        await pool.execute(
            'UPDATE usuarios SET contrasena = ? WHERE id = ?',
            [nuevaContrasena, id]
        );
    }
};

module.exports = UsuarioModel;
