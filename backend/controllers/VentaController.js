const ClienteModel = require('../models/ClienteModel');
const VentaModel = require('../models/VentaModel');
const ProductoModel = require('../models/ProductoModel');

const VentaController = {
    async listarClientes(req, res) {
        try {
            const incluirInactivos = req.query.inactivos === 'true';
            const clientes = await ClienteModel.listarTodos(incluirInactivos);
            res.json({ success: true, data: clientes });
        } catch (error) {
            console.error('Error al listar clientes:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener clientes' });
        }
    },

    async buscarClientes(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.length < 2) {
                return res.json({ success: true, data: [] });
            }
            const clientes = await ClienteModel.buscar(q);
            res.json({ success: true, data: clientes });
        } catch (error) {
            console.error('Error al buscar clientes:', error);
            res.status(500).json({ success: false, mensaje: 'Error al buscar clientes' });
        }
    },

    async obtenerCliente(req, res) {
        try {
            const cliente = await ClienteModel.buscarPorId(req.params.id);
            if (!cliente) {
                return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado' });
            }
            res.json({ success: true, data: cliente });
        } catch (error) {
            console.error('Error al obtener cliente:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener cliente' });
        }
    },

    async crearCliente(req, res) {
        try {
            const { nombre } = req.body;
            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ success: false, mensaje: 'El nombre es requerido' });
            }
            
            if (req.body.numero_documento) {
                const existe = await ClienteModel.buscarPorDocumento(req.body.numero_documento);
                if (existe) {
                    return res.status(400).json({ success: false, mensaje: 'Ya existe un cliente con ese documento' });
                }
            }
            
            const id = await ClienteModel.crear(req.body);
            const cliente = await ClienteModel.buscarPorId(id);
            res.status(201).json({ success: true, mensaje: 'Cliente creado correctamente', data: cliente });
        } catch (error) {
            console.error('Error al crear cliente:', error);
            res.status(500).json({ success: false, mensaje: 'Error al crear cliente' });
        }
    },

    async actualizarCliente(req, res) {
        try {
            const { id } = req.params;
            await ClienteModel.actualizar(id, req.body);
            res.json({ success: true, mensaje: 'Cliente actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            res.status(500).json({ success: false, mensaje: 'Error al actualizar cliente' });
        }
    },

    async cambiarEstadoCliente(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;
            await ClienteModel.cambiarEstado(id, activo);
            res.json({ success: true, mensaje: activo ? 'Cliente activado' : 'Cliente desactivado' });
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            res.status(500).json({ success: false, mensaje: 'Error al cambiar estado' });
        }
    },

    async listarVentas(req, res) {
        try {
            const filtros = {
                fecha_inicio: req.query.fecha_inicio,
                fecha_fin: req.query.fecha_fin,
                estado: req.query.estado
            };
            const ventas = await VentaModel.listarTodas(filtros);
            res.json({ success: true, data: ventas });
        } catch (error) {
            console.error('Error al listar ventas:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener ventas' });
        }
    },

    async obtenerVenta(req, res) {
        try {
            const venta = await VentaModel.obtenerPorId(req.params.id);
            if (!venta) {
                return res.status(404).json({ success: false, mensaje: 'Venta no encontrada' });
            }
            res.json({ success: true, data: venta });
        } catch (error) {
            console.error('Error al obtener venta:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener venta' });
        }
    },

    async crearVenta(req, res) {
        try {
            const { cliente_id, items, metodo_pago, monto_recibido, descuento_total, observaciones } = req.body;
            
            if (!items || items.length === 0) {
                return res.status(400).json({ success: false, mensaje: 'Debe agregar al menos un producto' });
            }

            for (const item of items) {
                const producto = await ProductoModel.buscarPorId(item.producto_id);
                if (!producto) {
                    return res.status(400).json({ success: false, mensaje: `Producto no encontrado: ${item.producto_id}` });
                }
                if (producto.stock_actual < item.cantidad) {
                    return res.status(400).json({ success: false, mensaje: `Stock insuficiente para: ${producto.nombre}` });
                }
            }

            const numero_venta = await VentaModel.generarNumeroVenta();
            
            let subtotal = 0;
            for (const item of items) {
                subtotal += item.precio_unitario * item.cantidad;
            }
            
            const descuento = descuento_total || 0;
            const total = subtotal - descuento;
            const cambio = (monto_recibido || total) - total;

            const venta_id = await VentaModel.crear({
                numero_venta,
                cliente_id,
                usuario_id: req.usuario.id,
                subtotal,
                descuento,
                impuesto: 0,
                total,
                metodo_pago: metodo_pago || 'Efectivo',
                monto_recibido: monto_recibido || total,
                cambio: cambio > 0 ? cambio : 0,
                observaciones
            });

            for (const item of items) {
                await VentaModel.agregarDetalle({
                    venta_id,
                    producto_id: item.producto_id,
                    lote_id: item.lote_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento: item.descuento || 0,
                    subtotal: item.precio_unitario * item.cantidad
                });

                await ProductoModel.actualizarStock(item.producto_id, item.cantidad, 'subtract');
            }

            const ventaCompleta = await VentaModel.obtenerPorId(venta_id);
            
            res.status(201).json({ 
                success: true, 
                mensaje: 'Venta registrada correctamente',
                data: ventaCompleta
            });
        } catch (error) {
            console.error('Error al crear venta:', error);
            res.status(500).json({ success: false, mensaje: 'Error al registrar venta' });
        }
    },

    async anularVenta(req, res) {
        try {
            const { id } = req.params;
            await VentaModel.anular(id, req.usuario.id);
            res.json({ success: true, mensaje: 'Venta anulada correctamente' });
        } catch (error) {
            console.error('Error al anular venta:', error);
            res.status(500).json({ success: false, mensaje: error.message || 'Error al anular venta' });
        }
    },

    async ventasDelDia(req, res) {
        try {
            const stats = await VentaModel.ventasDelDia();
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error al obtener ventas del día:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener estadísticas' });
        }
    },

    async estadisticas(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const hoy = new Date().toISOString().split('T')[0];
            const stats = await VentaModel.estadisticas(fecha_inicio || hoy, fecha_fin || hoy);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({ success: false, mensaje: 'Error al obtener estadísticas' });
        }
    }
};

module.exports = VentaController;
