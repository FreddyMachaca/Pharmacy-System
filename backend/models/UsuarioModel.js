const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

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
                    u.activo, u.ultimo_acceso, u.token_version, r.nombre as rol_nombre
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             WHERE u.id = ?`,
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
                    u.activo, u.ultimo_acceso, u.fecha_creacion, 
                    u.rol_id, r.nombre as rol_nombre
             FROM usuarios u 
             INNER JOIN roles r ON u.rol_id = r.id 
             ORDER BY u.fecha_creacion DESC`
        );
        return rows;
    },

    async crear(usuario) {
        const { nombre, apellido, correo, contrasena, telefono, rol_id } = usuario;
        const contrasenaHash = await bcrypt.hash(contrasena, 10);
        const [result] = await pool.execute(
            `INSERT INTO usuarios (nombre, apellido, correo, contrasena, telefono, rol_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, correo, contrasenaHash, telefono || null, rol_id]
        );
        return result.insertId;
    },

    async actualizar(id, usuario) {
        const { nombre, apellido, correo, telefono, rol_id } = usuario;
        await pool.execute(
            `UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, 
             telefono = ?, rol_id = ? WHERE id = ?`,
            [nombre, apellido, correo, telefono || null, rol_id, id]
        );
    },

    async cambiarEstado(id, activo) {
        await pool.execute(
            'UPDATE usuarios SET activo = ?, token_version = token_version + 1 WHERE id = ?',
            [activo ? 1 : 0, id]
        );
    },

    async cambiarContrasena(id, contrasenaActual, nuevaContrasena) {
        const [rows] = await pool.execute('SELECT contrasena FROM usuarios WHERE id = ?', [id]);
        if (!rows[0]) throw new Error('Usuario no encontrado');
        
        const valida = await bcrypt.compare(contrasenaActual, rows[0].contrasena);
        if (!valida) throw new Error('Contraseña actual incorrecta');
        
        const contrasenaHash = await bcrypt.hash(nuevaContrasena, 10);
        await pool.execute(
            'UPDATE usuarios SET contrasena = ?, token_version = token_version + 1 WHERE id = ?',
            [contrasenaHash, id]
        );
    },

    async resetearContrasena(id, nuevaContrasena) {
        const contrasenaHash = await bcrypt.hash(nuevaContrasena, 10);
        await pool.execute(
            'UPDATE usuarios SET contrasena = ?, token_version = token_version + 1 WHERE id = ?',
            [contrasenaHash, id]
        );
    },

    async invalidarTokens(id) {
        await pool.execute(
            'UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?',
            [id]
        );
    },

    async obtenerPermisos(usuarioId) {
        const [rows] = await pool.execute(
            `SELECT m.codigo, m.nombre, p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
             FROM usuarios u
             INNER JOIN roles r ON u.rol_id = r.id
             INNER JOIN permisos_rol p ON r.id = p.rol_id
             INNER JOIN modulos m ON p.modulo_id = m.id
             WHERE u.id = ? AND m.activo = 1
             ORDER BY m.orden`,
            [usuarioId]
        );
        return rows;
    },

    async obtenerPermisosPorRol(rolId) {
        const [rows] = await pool.execute(
            `SELECT m.id as modulo_id, m.codigo, m.nombre, 
                    COALESCE(p.puede_ver, 0) as puede_ver,
                    COALESCE(p.puede_crear, 0) as puede_crear,
                    COALESCE(p.puede_editar, 0) as puede_editar,
                    COALESCE(p.puede_eliminar, 0) as puede_eliminar
             FROM modulos m
             LEFT JOIN permisos_rol p ON m.id = p.modulo_id AND p.rol_id = ?
             WHERE m.activo = 1
             ORDER BY m.orden`,
            [rolId]
        );
        return rows;
    },

    async listarRoles() {
        const [rows] = await pool.execute(
            `SELECT r.*, 
                    (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) as total_usuarios
             FROM roles r 
             ORDER BY r.id`
        );
        return rows;
    },

    async obtenerRol(id) {
        const [rows] = await pool.execute('SELECT * FROM roles WHERE id = ?', [id]);
        return rows[0] || null;
    },

    async crearRol(rol) {
        const { nombre, descripcion } = rol;
        const [result] = await pool.execute(
            'INSERT INTO roles (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion || null]
        );
        return result.insertId;
    },

    async actualizarRol(id, rol) {
        const { nombre, descripcion, activo } = rol;
        await pool.execute(
            'UPDATE roles SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
            [nombre, descripcion, activo, id]
        );
    },

    async eliminarRol(id) {
        const [usuarios] = await pool.execute(
            'SELECT COUNT(*) as total FROM usuarios WHERE rol_id = ?',
            [id]
        );
        if (usuarios[0].total > 0) {
            throw new Error('No se puede eliminar un rol con usuarios asignados');
        }
        const [result] = await pool.execute('DELETE FROM roles WHERE id = ? AND es_sistema = 0', [id]);
        return result.affectedRows > 0;
    },

    async guardarPermisosRol(rolId, permisos) {
        await pool.execute('DELETE FROM permisos_rol WHERE rol_id = ?', [rolId]);
        
        for (const permiso of permisos) {
            if (permiso.puede_ver || permiso.puede_crear || permiso.puede_editar || permiso.puede_eliminar) {
                await pool.execute(
                    `INSERT INTO permisos_rol (rol_id, modulo_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [rolId, permiso.modulo_id, permiso.puede_ver ? 1 : 0, permiso.puede_crear ? 1 : 0, 
                     permiso.puede_editar ? 1 : 0, permiso.puede_eliminar ? 1 : 0]
                );
            }
        }
    },

    async listarModulos() {
        const [rows] = await pool.execute(
            'SELECT * FROM modulos WHERE activo = 1 ORDER BY orden'
        );
        return rows;
    },

    async verificarCorreoExiste(correo, excludeId = null) {
        let query = 'SELECT id FROM usuarios WHERE correo = ?';
        const params = [correo];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await pool.execute(query, params);
        return rows.length > 0;
    }
};

module.exports = UsuarioModel;
