const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/ProductoController');
const { authMiddleware, verificarRol } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET - Rutas específicas primero
router.get('/buscar', ProductoController.buscar);
router.get('/estadisticas', ProductoController.estadisticas);
router.get('/categorias', ProductoController.listarCategorias);
router.get('/laboratorios', ProductoController.listarLaboratorios);
router.get('/lotes', ProductoController.listarTodosLotes);
router.get('/movimientos', ProductoController.listarMovimientos);
router.get('/proximos-vencer', ProductoController.proximosAVencer);
router.get('/codigo/:codigo', ProductoController.buscarPorCodigo);

// POST - Rutas específicas primero
router.post('/lotes', verificarRol('admin', 'inventario'), ProductoController.crearLote);
router.post('/movimientos', verificarRol('admin', 'inventario'), ProductoController.crearMovimiento);
router.post('/categorias', verificarRol('admin', 'inventario'), ProductoController.crearCategoria);
router.post('/laboratorios', verificarRol('admin', 'inventario'), ProductoController.crearLaboratorio);

// PUT - Rutas específicas primero
router.put('/lotes/:id', verificarRol('admin', 'inventario'), ProductoController.actualizarLote);
router.put('/categorias/:id', verificarRol('admin', 'inventario'), ProductoController.actualizarCategoria);
router.put('/laboratorios/:id', verificarRol('admin', 'inventario'), ProductoController.actualizarLaboratorio);

// PATCH - Rutas específicas primero
router.patch('/categorias/:id/estado', verificarRol('admin', 'inventario'), ProductoController.cambiarEstadoCategoria);
router.patch('/laboratorios/:id/estado', verificarRol('admin', 'inventario'), ProductoController.cambiarEstadoLaboratorio);

// Rutas genéricas con :id al final
router.get('/', ProductoController.listar);
router.get('/:id', ProductoController.obtener);
router.get('/:productoId/lotes', ProductoController.listarLotes);
router.post('/', verificarRol('admin', 'inventario'), ProductoController.crear);
router.put('/:id', verificarRol('admin', 'inventario'), ProductoController.actualizar);
router.patch('/:id/estado', verificarRol('admin', 'inventario'), ProductoController.cambiarEstado);

module.exports = router;
