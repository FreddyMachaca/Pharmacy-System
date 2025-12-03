const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');
const jwtConfig = require('../config/jwt');

const AuthController = {
    async login(req, res) {
        try {
            const { correo, contrasena } = req.body;

            if (!correo || !contrasena) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Correo y contraseña son requeridos'
                });
            }

            const usuario = await UsuarioModel.buscarPorCorreo(correo);

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

            if (!contrasenaValida) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            await UsuarioModel.actualizarUltimoAcceso(usuario.id);

            const permisos = await UsuarioModel.obtenerPermisos(usuario.id);

            const token = jwt.sign(
                {
                    id: usuario.id,
                    correo: usuario.correo,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    rol: usuario.rol_nombre,
                    tokenVersion: usuario.token_version || 0
                },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            const permisosMap = {};
            permisos.forEach(p => {
                permisosMap[p.codigo] = {
                    ver: p.puede_ver === 1,
                    crear: p.puede_crear === 1,
                    editar: p.puede_editar === 1,
                    eliminar: p.puede_eliminar === 1
                };
            });

            res.json({
                success: true,
                mensaje: 'Inicio de sesión exitoso',
                data: {
                    token,
                    expiresIn: jwtConfig.expiresIn,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo: usuario.correo,
                        rol: usuario.rol_nombre
                    },
                    permisos: permisosMap
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor'
            });
        }
    },

    async verificarToken(req, res) {
        try {
            const usuario = await UsuarioModel.buscarPorId(req.usuario.id);

            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Usuario no encontrado',
                    codigo: 'TOKEN_INVALID'
                });
            }

            if (!usuario.activo) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Usuario desactivado',
                    codigo: 'USER_DISABLED'
                });
            }

            if (req.usuario.tokenVersion !== usuario.token_version) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'Sesión inválida',
                    codigo: 'TOKEN_REVOKED'
                });
            }

            const permisos = await UsuarioModel.obtenerPermisos(usuario.id);
            const permisosMap = {};
            permisos.forEach(p => {
                permisosMap[p.codigo] = {
                    ver: p.puede_ver === 1,
                    crear: p.puede_crear === 1,
                    editar: p.puede_editar === 1,
                    eliminar: p.puede_eliminar === 1
                };
            });

            res.json({
                success: true,
                data: {
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo: usuario.correo,
                        rol: usuario.rol_nombre
                    },
                    permisos: permisosMap
                }
            });

        } catch (error) {
            console.error('Error al verificar token:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor'
            });
        }
    },

    async cambiarContrasena(req, res) {
        try {
            const { contrasenaActual, nuevaContrasena } = req.body;

            if (!contrasenaActual || !nuevaContrasena) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Contraseña actual y nueva son requeridas'
                });
            }

            if (nuevaContrasena.length < 6) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }

            await UsuarioModel.cambiarContrasena(req.usuario.id, contrasenaActual, nuevaContrasena);

            res.json({
                success: true,
                mensaje: 'Contraseña actualizada correctamente. Por favor inicie sesión nuevamente.',
                requireRelogin: true
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            if (error.message === 'Contraseña actual incorrecta') {
                return res.status(401).json({
                    success: false,
                    mensaje: error.message
                });
            }
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor'
            });
        }
    },

    async logout(req, res) {
        try {
            await UsuarioModel.invalidarTokens(req.usuario.id);
            res.json({
                success: true,
                mensaje: 'Sesión cerrada correctamente'
            });
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
};

module.exports = AuthController;
