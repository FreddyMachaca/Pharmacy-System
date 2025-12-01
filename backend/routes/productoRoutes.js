const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/ProductoController');
const { authMiddleware, verificarRol } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', ProductoController.listar);
router.get('/buscar', ProductoController.buscar);
router.get('/estadisticas', ProductoController.estadisticas);
router.get('/categorias', ProductoController.listarCategorias);
router.get('/laboratorios', ProductoController.listarLaboratorios);
router.get('/proximos-vencer', ProductoController.proximosAVencer);
router.get('/codigo/:codigo', ProductoController.buscarPorCodigo);
router.get('/:id', ProductoController.obtener);
router.get('/:productoId/lotes', ProductoController.listarLotes);

router.post('/', verificarRol('admin', 'inventario'), ProductoController.crear);
router.post('/lotes', verificarRol('admin', 'inventario'), ProductoController.crearLote);

router.put('/:id', verificarRol('admin', 'inventario'), ProductoController.actualizar);
router.patch('/:id/estado', verificarRol('admin', 'inventario'), ProductoController.cambiarEstado);

module.exports = router;
