const ConfiguracionModel = require('../models/ConfiguracionModel');

const ConfiguracionController = {
    async obtenerTodas(req, res) {
        try {
            const configuraciones = await ConfiguracionModel.obtenerTodas();
            res.json(configuraciones);
        } catch (error) {
            console.error('Error al obtener configuraciones:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener configuraciones' });
        }
    },

    async obtenerFarmacia(req, res) {
        try {
            const config = await ConfiguracionModel.obtenerConfiguracionFarmacia();
            res.json(config);
        } catch (error) {
            console.error('Error al obtener configuración de farmacia:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener configuración' });
        }
    },

    async actualizar(req, res) {
        try {
            const { clave, valor } = req.body;
            
            if (!clave) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'La clave es requerida'
                });
            }

            await ConfiguracionModel.actualizar(clave, valor);
            res.json({ success: true, mensaje: 'Configuración actualizada' });
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            res.status(500).json({ success: false, mensaje: 'Error al actualizar' });
        }
    },

    async actualizarMultiples(req, res) {
        try {
            const { configuraciones } = req.body;
            
            if (!configuraciones || !Array.isArray(configuraciones)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Se requiere un array de configuraciones'
                });
            }

            await ConfiguracionModel.actualizarMultiples(configuraciones);
            res.json({ success: true, mensaje: 'Configuraciones actualizadas correctamente' });
        } catch (error) {
            console.error('Error al actualizar configuraciones:', error);
            res.status(500).json({ success: false, mensaje: 'Error al actualizar configuraciones' });
        }
    }
};

module.exports = ConfiguracionController;
