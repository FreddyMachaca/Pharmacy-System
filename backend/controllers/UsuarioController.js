const UsuarioModel = require('../models/UsuarioModel');

const UsuarioController = {
    async listar(req, res) {
        try {
            const usuarios = await UsuarioModel.listarTodos();
            const usuariosMapped = usuarios.map(u => ({
                id: u.id,
                nombre: u.nombre,
                apellido: u.apellido,
                correo: u.correo,
                telefono: u.telefono,
                rol: u.rol_nombre,
                rol_id: u.rol_id,
                activo: u.activo,
                ultimo_acceso: u.ultimo_acceso,
                fecha_creacion: u.fecha_creacion
            }));
            res.json(usuariosMapped);
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener usuarios' });
        }
    },

    async obtener(req, res) {
        try {
            const usuario = await UsuarioModel.buscarPorId(req.params.id);
            if (!usuario) {
                return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
            }
            res.json({
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                telefono: usuario.telefono,
                rol: usuario.rol_nombre,
                rol_id: usuario.rol_id,
                activo: usuario.activo
            });
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener usuario' });
        }
    },

    async crear(req, res) {
        try {
            const { nombre, apellido, correo, contrasena, telefono, rol } = req.body;

            if (!nombre || !apellido || !correo || !contrasena || !rol) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Nombre, apellido, correo, contraseña y rol son requeridos'
                });
            }

            if (contrasena.length < 6) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            const roles = await UsuarioModel.listarRoles();
            const rolEncontrado = roles.find(r => r.nombre === rol);
            if (!rolEncontrado) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Rol no válido'
                });
            }

            const existe = await UsuarioModel.verificarCorreoExiste(correo);
            if (existe) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El correo ya está registrado'
                });
            }

            const id = await UsuarioModel.crear({ 
                nombre, apellido, correo, contrasena, telefono, 
                rol_id: rolEncontrado.id 
            });
            res.status(201).json({
                success: true,
                mensaje: 'Usuario creado correctamente',
                data: { id }
            });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            res.status(500).json({ success: false, mensaje: 'Error al crear usuario' });
        }
    },

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, apellido, correo, telefono, rol } = req.body;

            if (!nombre || !apellido || !correo || !rol) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Nombre, apellido, correo y rol son requeridos'
                });
            }

            const roles = await UsuarioModel.listarRoles();
            const rolEncontrado = roles.find(r => r.nombre === rol);
            if (!rolEncontrado) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Rol no válido'
                });
            }

            const existe = await UsuarioModel.verificarCorreoExiste(correo, id);
            if (existe) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El correo ya está registrado por otro usuario'
                });
            }

            await UsuarioModel.actualizar(id, { 
                nombre, apellido, correo, telefono, 
                rol_id: rolEncontrado.id 
            });
            res.json({ success: true, mensaje: 'Usuario actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ success: false, mensaje: 'Error al actualizar usuario' });
        }
    },

    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (parseInt(id) === req.usuario.id) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No puede desactivar su propia cuenta'
                });
            }

            await UsuarioModel.cambiarEstado(id, activo);
            res.json({
                success: true,
                mensaje: activo ? 'Usuario activado' : 'Usuario desactivado'
            });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({ success: false, mensaje: 'Error al cambiar estado' });
        }
    },

    async resetearContrasena(req, res) {
        try {
            const { id } = req.params;
            const { nuevaContrasena } = req.body;

            if (!nuevaContrasena || nuevaContrasena.length < 6) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            await UsuarioModel.resetearContrasena(id, nuevaContrasena);
            res.json({ success: true, mensaje: 'Contraseña restablecida correctamente' });
        } catch (error) {
            console.error('Error al resetear contraseña:', error);
            res.status(500).json({ success: false, mensaje: 'Error al resetear contraseña' });
        }
    },

    async listarRoles(req, res) {
        try {
            const roles = await UsuarioModel.listarRoles();
            res.json(roles);
        } catch (error) {
            console.error('Error al listar roles:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener roles' });
        }
    },

    async obtenerRol(req, res) {
        try {
            const rol = await UsuarioModel.obtenerRol(req.params.id);
            if (!rol) {
                return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
            }
            const permisos = await UsuarioModel.obtenerPermisosPorRol(req.params.id);
            res.json({ success: true, data: { ...rol, permisos } });
        } catch (error) {
            console.error('Error al obtener rol:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener rol' });
        }
    },

    async crearRol(req, res) {
        try {
            const { nombre, descripcion, permisos } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El nombre del rol es requerido'
                });
            }

            const id = await UsuarioModel.crearRol({ nombre, descripcion });
            
            if (permisos && permisos.length > 0) {
                await UsuarioModel.guardarPermisosRol(id, permisos);
            }

            res.status(201).json({
                success: true,
                mensaje: 'Rol creado correctamente',
                data: { id }
            });
        } catch (error) {
            console.error('Error al crear rol:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, mensaje: 'Ya existe un rol con ese nombre' });
            }
            res.status(500).json({ success: false, mensaje: 'Error al crear rol' });
        }
    },

    async actualizarRol(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion } = req.body;

            const rol = await UsuarioModel.obtenerRol(id);
            if (!rol) {
                return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
            }

            if (rol.nombre === 'admin') {
                return res.status(400).json({ success: false, mensaje: 'No se puede modificar el rol de administrador' });
            }

            await UsuarioModel.actualizarRol(id, { 
                nombre: nombre || rol.nombre, 
                descripcion: descripcion !== undefined ? descripcion : rol.descripcion, 
                activo: rol.activo 
            });

            res.json({ success: true, mensaje: 'Rol actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar rol:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, mensaje: 'Ya existe un rol con ese nombre' });
            }
            res.status(500).json({ success: false, mensaje: 'Error al actualizar rol' });
        }
    },

    async eliminarRol(req, res) {
        try {
            const { id } = req.params;

            const rol = await UsuarioModel.obtenerRol(id);
            if (!rol) {
                return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
            }

            if (rol.es_sistema) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se puede eliminar un rol del sistema'
                });
            }

            const eliminado = await UsuarioModel.eliminarRol(id);
            if (!eliminado) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se pudo eliminar el rol'
                });
            }

            res.json({ success: true, mensaje: 'Rol eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar rol:', error);
            if (error.message.includes('usuarios asignados')) {
                return res.status(400).json({ success: false, mensaje: error.message });
            }
            res.status(500).json({ success: false, mensaje: 'Error al eliminar rol' });
        }
    },

    async listarModulos(req, res) {
        try {
            const modulos = await UsuarioModel.listarModulos();
            res.json({ success: true, data: modulos });
        } catch (error) {
            console.error('Error al listar módulos:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener módulos' });
        }
    },

    async obtenerPermisosPorRol(req, res) {
        try {
            const permisos = await UsuarioModel.obtenerPermisosPorRol(req.params.id);
            const permisosMapped = permisos.map(p => ({
                modulo: p.codigo,
                modulo_id: p.modulo_id,
                nombre: p.nombre,
                puede_ver: p.puede_ver,
                puede_crear: p.puede_crear,
                puede_editar: p.puede_editar,
                puede_eliminar: p.puede_eliminar
            }));
            res.json(permisosMapped);
        } catch (error) {
            console.error('Error al obtener permisos:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener permisos' });
        }
    },

    async guardarPermisosRol(req, res) {
        try {
            const { id } = req.params;
            const { permisos } = req.body;

            const rol = await UsuarioModel.obtenerRol(id);
            if (!rol) {
                return res.status(404).json({ success: false, mensaje: 'Rol no encontrado' });
            }

            if (rol.nombre === 'admin') {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se pueden modificar los permisos del administrador'
                });
            }

            const modulos = await UsuarioModel.listarModulos();
            const permisosConId = permisos.map(p => {
                const modulo = modulos.find(m => m.codigo === p.modulo);
                return {
                    modulo_id: modulo ? modulo.id : null,
                    puede_ver: p.puede_ver ? 1 : 0,
                    puede_crear: p.puede_crear ? 1 : 0,
                    puede_editar: p.puede_editar ? 1 : 0,
                    puede_eliminar: p.puede_eliminar ? 1 : 0
                };
            }).filter(p => p.modulo_id !== null);

            await UsuarioModel.guardarPermisosRol(id, permisosConId);
            res.json({ success: true, mensaje: 'Permisos guardados correctamente' });
        } catch (error) {
            console.error('Error al guardar permisos:', error);
            res.status(500).json({ success: false, mensaje: 'Error al guardar permisos' });
        }
    }
};

module.exports = UsuarioController;
