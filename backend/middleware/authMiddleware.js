const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token de autorización no proporcionado'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token mal formateado'
        });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token mal formateado'
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
                mensaje: 'Token expirado, inicie sesión nuevamente'
            });
        }
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido'
        });
    }
};

const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                mensaje: 'No tiene permisos para acceder a este recurso'
            });
        }

        next();
    };
};

module.exports = { authMiddleware, verificarRol };
