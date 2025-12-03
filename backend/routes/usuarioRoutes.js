const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/UsuarioController');
const { authMiddleware, verificarRol } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', verificarRol('admin'), UsuarioController.listar);
router.get('/roles', verificarRol('admin'), UsuarioController.listarRoles);
router.get('/modulos', verificarRol('admin'), UsuarioController.listarModulos);
router.get('/roles/:id', verificarRol('admin'), UsuarioController.obtenerRol);
router.get('/roles/:id/permisos', verificarRol('admin'), UsuarioController.obtenerPermisosPorRol);
router.get('/:id', verificarRol('admin'), UsuarioController.obtener);

router.post('/', verificarRol('admin'), UsuarioController.crear);
router.post('/roles', verificarRol('admin'), UsuarioController.crearRol);

router.put('/:id', verificarRol('admin'), UsuarioController.actualizar);
router.put('/roles/:id', verificarRol('admin'), UsuarioController.actualizarRol);
router.put('/roles/:id/permisos', verificarRol('admin'), UsuarioController.guardarPermisosRol);

router.patch('/:id/estado', verificarRol('admin'), UsuarioController.cambiarEstado);
router.patch('/:id/contrasena', verificarRol('admin'), UsuarioController.resetearContrasena);

router.delete('/roles/:id', verificarRol('admin'), UsuarioController.eliminarRol);

module.exports = router;
