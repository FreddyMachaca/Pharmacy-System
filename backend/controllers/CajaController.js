const CajaModel = require('../models/CajaModel');

const CajaController = {
    async obtenerEstado(req, res) {
        try {
            const resumen = await CajaModel.obtenerResumenActual();
            const ultimaCaja = await CajaModel.obtenerUltimaCajaCerrada();
            res.json({ 
                cajaAbierta: !!resumen,
                data: resumen,
                ultimaCajaCerrada: ultimaCaja
            });
        } catch (error) {
            console.error('Error al obtener estado de caja:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener estado' });
        }
    },

    async abrirCaja(req, res) {
        try {
            const { monto_inicial, observaciones, monto_reutilizado = 0, origen_caja_id = null } = req.body;
            const montoInicial = parseFloat(monto_inicial);
            const montoReutilizado = parseFloat(monto_reutilizado) || 0;
            
            if (Number.isNaN(montoInicial) || montoInicial < 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El monto inicial es requerido y debe ser mayor o igual a 0'
                });
            }

            if (montoReutilizado < 0) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El monto reutilizado no puede ser negativo'
                });
            }

            let origenCaja = null;
            if (montoReutilizado > 0) {
                if (!origen_caja_id) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'Debe seleccionar la caja de origen al reutilizar fondos'
                    });
                }

                const ultimaCaja = await CajaModel.obtenerUltimaCajaCerrada();
                if (!ultimaCaja || ultimaCaja.id !== Number(origen_caja_id)) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'Solo se puede reutilizar fondos de la última caja cerrada'
                    });
                }

                origenCaja = ultimaCaja;
                if (montoReutilizado > parseFloat(origenCaja.monto_final || 0)) {
                    return res.status(400).json({
                        success: false,
                        mensaje: 'El monto reutilizado supera el saldo disponible'
                    });
                }
            }

            const cajaId = await CajaModel.abrirCaja(
                req.usuario.id,
                montoInicial,
                observaciones,
                montoReutilizado,
                origenCaja ? origenCaja.id : null
            );
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
            const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
            const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 50);
            const offset = (pagina - 1) * limite;
            const { registros, total } = await CajaModel.listarHistorial(limite, offset);
            res.json({
                data: registros,
                total,
                pagina,
                limite
            });
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
