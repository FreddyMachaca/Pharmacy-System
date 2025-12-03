const express = require('express');
const router = express.Router();
const CajaController = require('../controllers/CajaController');
const { authMiddleware, verificarPermiso } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/estado', verificarPermiso('caja', 'ver'), CajaController.obtenerEstado);
router.get('/historial', verificarPermiso('caja', 'ver'), CajaController.obtenerHistorial);
router.get('/:id', verificarPermiso('caja', 'ver'), CajaController.obtenerDetalle);
router.get('/:id/movimientos', verificarPermiso('caja', 'ver'), CajaController.obtenerMovimientos);
router.get('/:id/ventas', verificarPermiso('caja', 'ver'), CajaController.obtenerVentasDeCaja);

router.post('/abrir', verificarPermiso('caja', 'crear'), CajaController.abrirCaja);
router.post('/:id/cerrar', verificarPermiso('caja', 'editar'), CajaController.cerrarCaja);
router.post('/:id/gasto', verificarPermiso('caja', 'editar'), CajaController.registrarGasto);
router.post('/movimiento', verificarPermiso('caja', 'crear'), CajaController.registrarMovimiento);

module.exports = router;
