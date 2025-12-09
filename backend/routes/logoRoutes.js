const express = require('express');
const router = express.Router();
const LogoController = require('../controllers/LogoController');
const { authMiddleware, verificarPermiso } = require('../middleware/authMiddleware');

router.get('/activo', LogoController.obtenerLogoActivo);

router.use(authMiddleware);

router.get('/', verificarPermiso('configuracion', 'ver'), LogoController.listarLogos);
router.post('/subir', verificarPermiso('configuracion', 'editar'), LogoController.subirLogo);
router.put('/establecer', verificarPermiso('configuracion', 'editar'), LogoController.establecerLogoActivo);
router.delete('/:nombre', verificarPermiso('configuracion', 'editar'), LogoController.eliminarLogo);

module.exports = router;
