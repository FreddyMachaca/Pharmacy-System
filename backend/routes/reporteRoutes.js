const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/ReporteController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/ventas', ReporteController.reporteVentas);
router.get('/inventario', ReporteController.reporteInventario);
router.get('/vencimientos', ReporteController.reporteVencimientos);

module.exports = router;
