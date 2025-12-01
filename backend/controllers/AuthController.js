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

            const token = jwt.sign(
                {
                    id: usuario.id,
                    correo: usuario.correo,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    rol: usuario.rol_nombre
                },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiresIn }
            );

            res.json({
                success: true,
                mensaje: 'Inicio de sesión exitoso',
                data: {
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo: usuario.correo,
                        rol: usuario.rol_nombre
                    }
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
                    mensaje: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        apellido: usuario.apellido,
                        correo: usuario.correo,
                        rol: usuario.rol_nombre
                    }
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

            const usuario = await UsuarioModel.buscarPorCorreo(req.usuario.correo);

            const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);

            if (!contrasenaValida) {
                return res.status(401).json({
                    success: false,
                    mensaje: 'La contraseña actual es incorrecta'
                });
            }

            const nuevaContrasenaHash = await bcrypt.hash(nuevaContrasena, 10);
            await UsuarioModel.cambiarContrasena(usuario.id, nuevaContrasenaHash);

            res.json({
                success: true,
                mensaje: 'Contraseña actualizada correctamente'
            });

        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
};

module.exports = AuthController;
