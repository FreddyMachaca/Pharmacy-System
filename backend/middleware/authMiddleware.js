const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token de autorización no proporcionado',
            codigo: 'NO_TOKEN'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token mal formateado',
            codigo: 'MALFORMED_TOKEN'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token mal formateado',
            codigo: 'MALFORMED_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.usuario = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                mensaje: 'Sesión expirada',
                codigo: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido',
            codigo: 'TOKEN_INVALID'
        });
    }
};

const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no autenticado',
                codigo: 'NOT_AUTHENTICATED'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                mensaje: 'No tiene permisos para acceder a este recurso',
                codigo: 'FORBIDDEN'
            });
        }

        next();
    };
};

const verificarPermiso = (modulo, accion) => {
    return async (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no autenticado',
                codigo: 'NOT_AUTHENTICATED'
            });
        }

        if (req.usuario.rol === 'admin') {
            return next();
        }

        try {
            const UsuarioModel = require('../models/UsuarioModel');
            const permisos = await UsuarioModel.obtenerPermisos(req.usuario.id);
            
            const permisoModulo = permisos.find(p => p.codigo === modulo);
            
            if (!permisoModulo) {
                return res.status(403).json({
                    success: false,
                    mensaje: 'No tiene acceso a este módulo',
                    codigo: 'NO_MODULE_ACCESS'
                });
            }

            const tienePermiso = 
                (accion === 'ver' && permisoModulo.puede_ver) ||
                (accion === 'crear' && permisoModulo.puede_crear) ||
                (accion === 'editar' && permisoModulo.puede_editar) ||
                (accion === 'eliminar' && permisoModulo.puede_eliminar);

            if (!tienePermiso) {
                return res.status(403).json({
                    success: false,
                    mensaje: `No tiene permiso para ${accion} en este módulo`,
                    codigo: 'NO_PERMISSION'
                });
            }

            next();
        } catch (error) {
            console.error('Error verificando permisos:', error);
            return res.status(500).json({
                success: false,
                mensaje: 'Error al verificar permisos'
            });
        }
    };
};

module.exports = { authMiddleware, verificarRol, verificarPermiso };
