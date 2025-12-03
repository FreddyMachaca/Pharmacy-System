const express = require('express');
const router = express.Router();
const ConfiguracionController = require('../controllers/ConfiguracionController');
const { authMiddleware, verificarPermiso } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', verificarPermiso('configuracion', 'ver'), ConfiguracionController.obtenerTodas);
router.get('/farmacia', verificarPermiso('configuracion', 'ver'), ConfiguracionController.obtenerFarmacia);

router.put('/', verificarPermiso('configuracion', 'editar'), ConfiguracionController.actualizar);
router.put('/multiples', verificarPermiso('configuracion', 'editar'), ConfiguracionController.actualizarMultiples);

module.exports = router;
