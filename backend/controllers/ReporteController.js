const ReporteModel = require('../models/ReporteModel');

const ReporteController = {
    async reporteVentas(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            
            const hoy = new Date();
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            
            const fechaInicio = fecha_inicio || inicioMes.toISOString().split('T')[0];
            const fechaFin = fecha_fin || hoy.toISOString().split('T')[0];
            
            const [resumen, ventasDiarias, productosMasVendidos, metodosPago, ventasDetalladas, detalleProductos, ventasPorVendedor, ventasPorCategoria] = await Promise.all([
                ReporteModel.ventasResumen(fechaInicio, fechaFin),
                ReporteModel.ventasPorPeriodo(fechaInicio, fechaFin),
                ReporteModel.productosMasVendidos(fechaInicio, fechaFin, 20),
                ReporteModel.ventasPorMetodoPago(fechaInicio, fechaFin),
                ReporteModel.ventasDetalladas(fechaInicio, fechaFin),
                ReporteModel.detalleVentasProductos(fechaInicio, fechaFin),
                ReporteModel.ventasPorVendedor(fechaInicio, fechaFin),
                ReporteModel.ventasPorCategoria(fechaInicio, fechaFin)
            ]);
            
            res.json({
                success: true,
                data: {
                    fechaInicio,
                    fechaFin,
                    resumen,
                    ventasDiarias,
                    productosMasVendidos,
                    metodosPago,
                    ventasDetalladas,
                    detalleProductos,
                    ventasPorVendedor,
                    ventasPorCategoria
                }
            });
        } catch (error) {
            console.error('Error en reporte de ventas:', error);
            res.status(500).json({ success: false, message: 'Error al generar reporte de ventas' });
        }
    },

    async reporteInventario(req, res) {
        try {
            const [resumen, productos, porCategoria] = await Promise.all([
                ReporteModel.inventarioResumen(),
                ReporteModel.inventarioGeneral(),
                ReporteModel.inventarioPorCategoria()
            ]);
            
            res.json({
                success: true,
                data: {
                    resumen,
                    productos,
                    porCategoria
                }
            });
        } catch (error) {
            console.error('Error en reporte de inventario:', error);
            res.status(500).json({ success: false, message: 'Error al generar reporte de inventario' });
        }
    },

    async reporteVencimientos(req, res) {
        try {
            const { dias_alerta = 90 } = req.query;
            
            const [resumen, vencidos, proximosVencer] = await Promise.all([
                ReporteModel.resumenVencimientos(),
                ReporteModel.productosVencidos(),
                ReporteModel.productosProximosVencer(parseInt(dias_alerta))
            ]);
            
            res.json({
                success: true,
                data: {
                    resumen,
                    vencidos,
                    proximosVencer
                }
            });
        } catch (error) {
            console.error('Error en reporte de vencimientos:', error);
            res.status(500).json({ success: false, message: 'Error al generar reporte de vencimientos' });
        }
    }
};

module.exports = ReporteController;
