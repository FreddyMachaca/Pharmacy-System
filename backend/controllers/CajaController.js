const CajaModel = require('../models/CajaModel');

const CajaController = {
    async obtenerEstado(req, res) {
        try {
            const resumen = await CajaModel.obtenerResumenActual();
            res.json({ 
                cajaAbierta: !!resumen,
                data: resumen
            });
        } catch (error) {
            console.error('Error al obtener estado de caja:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener estado' });
        }
    },

    async abrirCaja(req, res) {
        try {
            const { monto_inicial, observaciones } = req.body;
            
            if (monto_inicial === undefined || monto_inicial < 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El monto inicial es requerido y debe ser mayor o igual a 0'
                });
            }

            const cajaId = await CajaModel.abrirCaja(req.usuario.id, monto_inicial, observaciones);
            const caja = await CajaModel.obtenerPorId(cajaId);

            res.status(201).json({
                success: true,
                mensaje: 'Caja abierta correctamente',
                data: caja
            });
        } catch (error) {
            console.error('Error al abrir caja:', error);
            res.status(400).json({ 
                success: false, 
                mensaje: error.message || 'Error al abrir caja' 
            });
        }
    },

    async cerrarCaja(req, res) {
        try {
            const { id } = req.params;
            const { observaciones } = req.body;

            const resultado = await CajaModel.cerrarCaja(id, observaciones);
            const caja = await CajaModel.obtenerPorId(id);

            res.json({
                success: true,
                mensaje: 'Caja cerrada correctamente',
                data: {
                    ...caja,
                    resumen: resultado
                }
            });
        } catch (error) {
            console.error('Error al cerrar caja:', error);
            res.status(400).json({ 
                success: false, 
                mensaje: error.message || 'Error al cerrar caja' 
            });
        }
    },

    async registrarGasto(req, res) {
        try {
            const { id } = req.params;
            const { monto, descripcion } = req.body;

            if (!monto || monto <= 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El monto del gasto es requerido'
                });
            }

            await CajaModel.registrarGasto(id, monto, descripcion);
            const resumen = await CajaModel.obtenerResumenActual();

            res.json({
                success: true,
                mensaje: 'Gasto registrado correctamente',
                data: resumen
            });
        } catch (error) {
            console.error('Error al registrar gasto:', error);
            res.status(400).json({ 
                success: false, 
                mensaje: error.message || 'Error al registrar gasto' 
            });
        }
    },

    async obtenerHistorial(req, res) {
        try {
            const limite = parseInt(req.query.limite) || 30;
            const historial = await CajaModel.listarHistorial(limite);
            res.json(historial);
        } catch (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener historial' });
        }
    },

    async obtenerDetalle(req, res) {
        try {
            const caja = await CajaModel.obtenerPorId(req.params.id);
            if (!caja) {
                return res.status(404).json({ success: false, mensaje: 'Caja no encontrada' });
            }
            res.json(caja);
        } catch (error) {
            console.error('Error al obtener detalle:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener detalle' });
        }
    },

    async registrarMovimiento(req, res) {
        try {
            const { caja_id, tipo, monto, descripcion } = req.body;

            if (!caja_id || !tipo || !monto) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Caja, tipo y monto son requeridos'
                });
            }

            if (!['ingreso', 'egreso'].includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Tipo debe ser ingreso o egreso'
                });
            }

            await CajaModel.registrarMovimiento(caja_id, tipo, monto, descripcion, req.usuario.id);
            const resumen = await CajaModel.obtenerResumenActual();

            res.json({
                success: true,
                mensaje: 'Movimiento registrado correctamente',
                data: resumen
            });
        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            res.status(400).json({ 
                success: false, 
                mensaje: error.message || 'Error al registrar movimiento' 
            });
        }
    },

    async obtenerMovimientos(req, res) {
        try {
            const movimientos = await CajaModel.obtenerMovimientos(req.params.id);
            res.json(movimientos);
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener movimientos' });
        }
    },

    async obtenerVentasDeCaja(req, res) {
        try {
            const ventas = await CajaModel.obtenerVentasDeCaja(req.params.id);
            res.json(ventas);
        } catch (error) {
            console.error('Error al obtener ventas de caja:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener ventas' });
        }
    }
};

module.exports = CajaController;
