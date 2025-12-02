const express = require('express');
const router = express.Router();
const VentaController = require('../controllers/VentaController');
const { authMiddleware, verificarRol } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/clientes/buscar', VentaController.buscarClientes);
router.get('/clientes', VentaController.listarClientes);
router.get('/clientes/:id', VentaController.obtenerCliente);
router.post('/clientes', VentaController.crearCliente);
router.put('/clientes/:id', VentaController.actualizarCliente);
router.patch('/clientes/:id/estado', VentaController.cambiarEstadoCliente);

router.get('/estadisticas', VentaController.estadisticas);
router.get('/del-dia', VentaController.ventasDelDia);
router.get('/', VentaController.listarVentas);
router.get('/:id', VentaController.obtenerVenta);
router.post('/', VentaController.crearVenta);
router.patch('/:id/anular', verificarRol('admin'), VentaController.anularVenta);

module.exports = router;
