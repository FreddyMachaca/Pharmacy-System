let reporteVentasData = null;
let filtrosVentas = {
    fechaInicio: null,
    fechaFin: null
};

async function initReporteVentas() {
    const content = document.getElementById('pageContent');
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    filtrosVentas.fechaInicio = inicioMes.toISOString().split('T')[0];
    filtrosVentas.fechaFin = hoy.toISOString().split('T')[0];
    
    content.innerHTML = `
        <div class="reportes-container fade-in">
            <div class="reportes-header">
                <h2><i class="pi pi-chart-bar"></i> Reporte de Ventas</h2>
                <div class="reportes-filtros">
                    <label>Desde:</label>
                    <input type="date" id="fechaInicio" value="${filtrosVentas.fechaInicio}">
                    <label>Hasta:</label>
                    <input type="date" id="fechaFin" value="${filtrosVentas.fechaFin}">
                    <div class="reportes-actions">
                        <button class="btn-filtrar" onclick="filtrarReporteVentas()">
                            <i class="pi pi-search"></i> Filtrar
                        </button>
                        <button class="btn-imprimir" onclick="imprimirReporteVentas()">
                            <i class="pi pi-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="reporteVentasContent">
                <div class="loading-reporte">
                    <i class="pi pi-spin pi-spinner"></i>
                    <p>Cargando reporte...</p>
                </div>
            </div>
        </div>
    `;
    
    await cargarReporteVentas();
}

async function cargarReporteVentas() {
    try {
        const params = new URLSearchParams({
            fecha_inicio: filtrosVentas.fechaInicio,
            fecha_fin: filtrosVentas.fechaFin
        });
        
        const response = await api.get(`/reportes/ventas?${params}`);
        reporteVentasData = response.data;
        renderReporteVentas();
    } catch (error) {
        console.error('Error al cargar reporte:', error);
        document.getElementById('reporteVentasContent').innerHTML = `
            <div class="empty-reporte">
                <i class="pi pi-exclamation-circle"></i>
                <p>Error al cargar el reporte de ventas</p>
            </div>
        `;
    }
}

function renderReporteVentas() {
    const container = document.getElementById('reporteVentasContent');
    const { resumen, ventasDiarias, productosMasVendidos, metodosPago } = reporteVentasData;
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    container.innerHTML = `
        <div class="resumen-cards">
            <div class="resumen-card ventas">
                <div class="resumen-card-header">
                    <i class="pi pi-shopping-cart"></i>
                    <span class="resumen-card-title">Total Ventas</span>
                </div>
                <div class="resumen-card-value">${resumen.total_ventas || 0}</div>
            </div>
            <div class="resumen-card ingresos">
                <div class="resumen-card-header">
                    <i class="pi pi-dollar"></i>
                    <span class="resumen-card-title">Ingresos Totales</span>
                </div>
                <div class="resumen-card-value">${formatMoney(resumen.ingresos_totales)}</div>
            </div>
            <div class="resumen-card productos">
                <div class="resumen-card-header">
                    <i class="pi pi-box"></i>
                    <span class="resumen-card-title">Productos Vendidos</span>
                </div>
                <div class="resumen-card-value">${resumen.productos_vendidos || 0}</div>
            </div>
            <div class="resumen-card promedio">
                <div class="resumen-card-header">
                    <i class="pi pi-chart-line"></i>
                    <span class="resumen-card-title">Promedio por Venta</span>
                </div>
                <div class="resumen-card-value">${formatMoney(resumen.promedio_venta)}</div>
            </div>
        </div>
        
        <div class="reporte-grid">
            <div class="reporte-section">
                <div class="reporte-section-header">
                    <h3 class="reporte-section-title">
                        <i class="pi pi-calendar"></i> Ventas por Día
                    </h3>
                </div>
                ${ventasDiarias && ventasDiarias.length > 0 ? `
                    <table class="reporte-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th class="text-center">Ventas</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ventasDiarias.map(dia => `
                                <tr>
                                    <td>${formatearFechaCorta(dia.fecha)}</td>
                                    <td class="text-center">${dia.cantidad_ventas}</td>
                                    <td class="text-right font-bold">${formatMoney(dia.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="empty-reporte">
                        <i class="pi pi-inbox"></i>
                        <p>No hay ventas en este período</p>
                    </div>
                `}
            </div>
            
            <div class="reporte-section">
                <div class="reporte-section-header">
                    <h3 class="reporte-section-title">
                        <i class="pi pi-credit-card"></i> Métodos de Pago
                    </h3>
                </div>
                ${metodosPago && metodosPago.length > 0 ? `
                    <div class="metodos-pago-list">
                        ${metodosPago.map(metodo => `
                            <div class="metodo-pago-item">
                                <div class="metodo-pago-nombre">
                                    <i class="pi ${getIconoMetodoPago(metodo.metodo_pago)}"></i>
                                    ${metodo.metodo_pago}
                                </div>
                                <div class="metodo-pago-stats">
                                    <div class="metodo-pago-total">${formatMoney(metodo.total)}</div>
                                    <div class="metodo-pago-cantidad">${metodo.cantidad} ventas</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-reporte">
                        <i class="pi pi-inbox"></i>
                        <p>No hay datos disponibles</p>
                    </div>
                `}
            </div>
        </div>
        
        <div class="reporte-section">
            <div class="reporte-section-header">
                <h3 class="reporte-section-title">
                    <i class="pi pi-star"></i> Productos Más Vendidos
                </h3>
            </div>
            ${productosMasVendidos && productosMasVendidos.length > 0 ? `
                <table class="reporte-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Laboratorio</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-right">Total Vendido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productosMasVendidos.map((prod, index) => `
                            <tr>
                                <td>
                                    <span style="color: var(--primary-color); font-weight: 600;">#${index + 1}</span>
                                    ${prod.nombre}
                                </td>
                                <td>${prod.laboratorio || '-'}</td>
                                <td class="text-center font-bold">${prod.cantidad_vendida}</td>
                                <td class="text-right font-bold text-success">${formatMoney(prod.total_vendido)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="empty-reporte">
                    <i class="pi pi-inbox"></i>
                    <p>No hay productos vendidos en este período</p>
                </div>
            `}
        </div>
    `;
}

function getIconoMetodoPago(metodo) {
    const iconos = {
        'Efectivo': 'pi-wallet',
        'Tarjeta': 'pi-credit-card',
        'QR': 'pi-qrcode',
        'Transferencia': 'pi-send'
    };
    return iconos[metodo] || 'pi-money-bill';
}

function formatearFechaCorta(fecha) {
    const opciones = { 
        weekday: 'short',
        day: '2-digit', 
        month: 'short',
        timeZone: 'America/La_Paz'
    };
    return new Date(fecha).toLocaleDateString('es-BO', opciones);
}

async function filtrarReporteVentas() {
    filtrosVentas.fechaInicio = document.getElementById('fechaInicio').value;
    filtrosVentas.fechaFin = document.getElementById('fechaFin').value;
    
    document.getElementById('reporteVentasContent').innerHTML = `
        <div class="loading-reporte">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Cargando reporte...</p>
        </div>
    `;
    
    await cargarReporteVentas();
}

function imprimirReporteVentas() {
    if (!reporteVentasData) return;
    
    const { resumen, ventasDiarias, productosMasVendidos, metodosPago } = reporteVentasData;
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Ventas</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { color: #666; font-size: 11px; }
                .periodo { background: #f5f5f5; padding: 10px; margin-bottom: 15px; text-align: center; }
                .resumen { display: flex; justify-content: space-around; margin-bottom: 20px; flex-wrap: wrap; }
                .resumen-item { text-align: center; padding: 10px; }
                .resumen-item .valor { font-size: 16px; font-weight: bold; color: #333; }
                .resumen-item .label { font-size: 10px; color: #666; }
                .section { margin-bottom: 20px; }
                .section h3 { font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>REPORTE DE VENTAS</h1>
                <p>Generado: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</p>
            </div>
            
            <div class="periodo">
                <strong>Período:</strong> ${filtrosVentas.fechaInicio} al ${filtrosVentas.fechaFin}
            </div>
            
            <div class="resumen">
                <div class="resumen-item">
                    <div class="valor">${resumen.total_ventas || 0}</div>
                    <div class="label">Total Ventas</div>
                </div>
                <div class="resumen-item">
                    <div class="valor">${formatMoney(resumen.ingresos_totales)}</div>
                    <div class="label">Ingresos Totales</div>
                </div>
                <div class="resumen-item">
                    <div class="valor">${resumen.productos_vendidos || 0}</div>
                    <div class="label">Productos Vendidos</div>
                </div>
                <div class="resumen-item">
                    <div class="valor">${formatMoney(resumen.promedio_venta)}</div>
                    <div class="label">Promedio/Venta</div>
                </div>
            </div>
            
            ${ventasDiarias && ventasDiarias.length > 0 ? `
                <div class="section">
                    <h3>Ventas por Día</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ventasDiarias.map(dia => `
                                <tr>
                                    <td>${dia.fecha}</td>
                                    <td class="text-center">${dia.cantidad_ventas}</td>
                                    <td class="text-right">${formatMoney(dia.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${productosMasVendidos && productosMasVendidos.length > 0 ? `
                <div class="section">
                    <h3>Productos Más Vendidos</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Producto</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productosMasVendidos.map((prod, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td>${prod.nombre}</td>
                                    <td class="text-center">${prod.cantidad_vendida}</td>
                                    <td class="text-right">${formatMoney(prod.total_vendido)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${metodosPago && metodosPago.length > 0 ? `
                <div class="section">
                    <h3>Métodos de Pago</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Método</th>
                                <th class="text-center">Cantidad</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${metodosPago.map(m => `
                                <tr>
                                    <td>${m.metodo_pago}</td>
                                    <td class="text-center">${m.cantidad}</td>
                                    <td class="text-right">${formatMoney(m.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        </body>
        </html>
    `;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    document.body.appendChild(iframe);
    
    iframe.contentDocument.write(contenido);
    iframe.contentDocument.close();
    
    iframe.onload = function() {
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };
}
