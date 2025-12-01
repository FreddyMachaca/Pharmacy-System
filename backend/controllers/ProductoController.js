const ProductoModel = require('../models/ProductoModel');
const CategoriaModel = require('../models/CategoriaModel');
const LaboratorioModel = require('../models/LaboratorioModel');
const LoteModel = require('../models/LoteModel');

const ProductoController = {
    async listar(req, res) {
        try {
            const incluirInactivos = req.query.inactivos === 'true';
            const productos = await ProductoModel.listarTodos(incluirInactivos);
            res.json({ success: true, data: productos });
        } catch (error) {
            console.error('Error al listar productos:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener productos' });
        }
    },

    async obtener(req, res) {
        try {
            const { id } = req.params;
            const producto = await ProductoModel.buscarPorId(id);
            
            if (!producto) {
                return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
            }
            
            const lotes = await LoteModel.listarPorProducto(id);
            res.json({ success: true, data: { ...producto, lotes } });
        } catch (error) {
            console.error('Error al obtener producto:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener producto' });
        }
    },

    async buscarPorCodigo(req, res) {
        try {
            const { codigo } = req.params;
            const producto = await ProductoModel.buscarPorCodigo(codigo);
            
            if (!producto) {
                return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
            }
            
            res.json({ success: true, data: producto });
        } catch (error) {
            console.error('Error al buscar producto:', error);
            res.status(500).json({ success: false, mensaje: 'Error al buscar producto' });
        }
    },

    async buscar(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.length < 2) {
                return res.json({ success: true, data: [] });
            }
            const productos = await ProductoModel.buscar(q);
            res.json({ success: true, data: productos });
        } catch (error) {
            console.error('Error en búsqueda:', error);
            res.status(500).json({ success: false, mensaje: 'Error en la búsqueda' });
        }
    },

    async crear(req, res) {
        try {
            const { codigo_barras, nombre, precio_venta } = req.body;

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
            }

            if (!precio_venta || precio_venta <= 0) {
                return res.status(400).json({ success: false, mensaje: 'El precio de venta debe ser mayor a 0' });
            }

            if (codigo_barras) {
                const existe = await ProductoModel.verificarCodigoExiste(codigo_barras);
                if (existe) {
                    return res.status(400).json({ success: false, mensaje: 'El código de barras ya existe' });
                }
            }

            const id = await ProductoModel.crear(req.body);
            const producto = await ProductoModel.buscarPorId(id);
            
            res.status(201).json({ 
                success: true, 
                mensaje: 'Producto creado correctamente',
                data: producto 
            });
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(500).json({ success: false, mensaje: 'Error al crear producto' });
        }
    },

    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { codigo_barras, nombre, precio_venta } = req.body;

            const productoExistente = await ProductoModel.buscarPorId(id);
            if (!productoExistente) {
                return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
            }

            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
            }

            if (!precio_venta || precio_venta <= 0) {
                return res.status(400).json({ success: false, mensaje: 'El precio de venta debe ser mayor a 0' });
            }

            if (codigo_barras) {
                const existe = await ProductoModel.verificarCodigoExiste(codigo_barras, id);
                if (existe) {
                    return res.status(400).json({ success: false, mensaje: 'El código de barras ya existe' });
                }
            }

            await ProductoModel.actualizar(id, req.body);
            const producto = await ProductoModel.buscarPorId(id);
            
            res.json({ 
                success: true, 
                mensaje: 'Producto actualizado correctamente',
                data: producto 
            });
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            res.status(500).json({ success: false, mensaje: 'Error al actualizar producto' });
        }
    },

    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            const producto = await ProductoModel.buscarPorId(id);
            if (!producto) {
                return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
            }

            await ProductoModel.cambiarEstado(id, activo);
            
            res.json({ 
                success: true, 
                mensaje: activo ? 'Producto activado' : 'Producto desactivado'
            });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({ success: false, mensaje: 'Error al cambiar estado' });
        }
    },

    async estadisticas(req, res) {
        try {
            const stats = await ProductoModel.obtenerEstadisticas();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener estadísticas' });
        }
    },

    async listarCategorias(req, res) {
        try {
            const categorias = await CategoriaModel.listarTodas();
            res.json({ success: true, data: categorias });
        } catch (error) {
            console.error('Error al listar categorías:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener categorías' });
        }
    },

    async listarLaboratorios(req, res) {
        try {
            const laboratorios = await LaboratorioModel.listarTodos();
            res.json({ success: true, data: laboratorios });
        } catch (error) {
            console.error('Error al listar laboratorios:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener laboratorios' });
        }
    },

    async listarLotes(req, res) {
        try {
            const { productoId } = req.params;
            const lotes = await LoteModel.listarPorProducto(productoId);
            res.json({ success: true, data: lotes });
        } catch (error) {
            console.error('Error al listar lotes:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener lotes' });
        }
    },

    async crearLote(req, res) {
        try {
            const { producto_id, numero_lote, fecha_vencimiento, cantidad_inicial } = req.body;

            if (!producto_id || !numero_lote || !fecha_vencimiento || !cantidad_inicial) {
                return res.status(400).json({ 
                    success: false, 
                    mensaje: 'Producto, número de lote, fecha de vencimiento y cantidad son requeridos' 
                });
            }

            const producto = await ProductoModel.buscarPorId(producto_id);
            if (!producto) {
                return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
            }

            const id = await LoteModel.crear(req.body);
            await ProductoModel.actualizarStock(producto_id, cantidad_inicial, 'add');
            
            const lote = await LoteModel.buscarPorId(id);
            
            res.status(201).json({ 
                success: true, 
                mensaje: 'Lote creado correctamente',
                data: lote 
            });
        } catch (error) {
            console.error('Error al crear lote:', error);
            res.status(500).json({ success: false, mensaje: 'Error al crear lote' });
        }
    },

    async proximosAVencer(req, res) {
        try {
            const dias = parseInt(req.query.dias) || 90;
            const lotes = await LoteModel.listarProximosAVencer(dias);
            res.json({ success: true, data: lotes });
        } catch (error) {
            console.error('Error al obtener próximos a vencer:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener productos próximos a vencer' });
        }
    }
};

module.exports = ProductoController;
