let reporteInventarioData = null;
let filtrosInventario = {
    categoria: '',
    estado: ''
};

async function initReporteInventario() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="reportes-container fade-in">
            <div class="reportes-header">
                <h2><i class="pi pi-chart-pie"></i> Reporte de Inventario</h2>
                <div class="reportes-filtros">
                    <label>Categoría:</label>
                    <select id="filtroCategoria" onchange="filtrarReporteInventario()">
                        <option value="">Todas</option>
                    </select>
                    <label>Estado:</label>
                    <select id="filtroEstado" onchange="filtrarReporteInventario()">
                        <option value="">Todos</option>
                        <option value="normal">Stock Normal</option>
                        <option value="bajo">Stock Bajo</option>
                        <option value="sin">Sin Stock</option>
                    </select>
                    <div class="reportes-actions">
                        <button class="btn-imprimir" onclick="imprimirReporteInventario()">
                            <i class="pi pi-print"></i> Imprimir
                        </button>
                        <button class="btn-exportar" onclick="exportarInventarioCSV()">
                            <i class="pi pi-download"></i> Exportar
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="reporteInventarioContent">
                <div class="loading-reporte">
                    <i class="pi pi-spin pi-spinner"></i>
                    <p>Cargando reporte...</p>
                </div>
            </div>
        </div>
    `;
    
    await cargarCategoriasFiltro();
    await cargarReporteInventario();
}

async function cargarCategoriasFiltro() {
    try {
        const response = await api.get('/productos/categorias');
        const categorias = response.data || [];
        const select = document.getElementById('filtroCategoria');
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id_categoria;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

async function cargarReporteInventario() {
    try {
        const response = await api.get('/reportes/inventario');
        reporteInventarioData = response.data;
        renderReporteInventario();
    } catch (error) {
        console.error('Error al cargar reporte:', error);
        document.getElementById('reporteInventarioContent').innerHTML = `
            <div class="empty-reporte">
                <i class="pi pi-exclamation-circle"></i>
                <p>Error al cargar el reporte de inventario</p>
            </div>
        `;
    }
}

function renderReporteInventario() {
    const container = document.getElementById('reporteInventarioContent');
    const { resumen, productos, porCategoria } = reporteInventarioData;
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    let productosFiltrados = [...productos];
    
    if (filtrosInventario.categoria) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.id_categoria == filtrosInventario.categoria
        );
    }
    
    if (filtrosInventario.estado) {
        productosFiltrados = productosFiltrados.filter(p => {
            if (filtrosInventario.estado === 'sin') return p.stock_actual === 0;
            if (filtrosInventario.estado === 'bajo') return p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
            if (filtrosInventario.estado === 'normal') return p.stock_actual > p.stock_minimo;
            return true;
        });
    }
    
    container.innerHTML = `
        <div class="resumen-cards">
            <div class="resumen-card stock">
                <div class="resumen-card-header">
                    <i class="pi pi-box"></i>
                    <span class="resumen-card-title">Total Productos</span>
                </div>
                <div class="resumen-card-value">${resumen.total_productos || 0}</div>
            </div>
            <div class="resumen-card bajo-stock">
                <div class="resumen-card-header">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="resumen-card-title">Stock Bajo</span>
                </div>
                <div class="resumen-card-value">${resumen.productos_stock_bajo || 0}</div>
            </div>
            <div class="resumen-card sin-stock">
                <div class="resumen-card-header">
                    <i class="pi pi-times-circle"></i>
                    <span class="resumen-card-title">Sin Stock</span>
                </div>
                <div class="resumen-card-value">${resumen.productos_sin_stock || 0}</div>
            </div>
            <div class="resumen-card valor">
                <div class="resumen-card-header">
                    <i class="pi pi-dollar"></i>
                    <span class="resumen-card-title">Valor Inventario</span>
                </div>
                <div class="resumen-card-value">${formatMoney(resumen.valor_total_inventario)}</div>
            </div>
        </div>
        
        <div class="reporte-grid">
            <div class="reporte-section" style="grid-column: span 2;">
                <div class="reporte-section-header">
                    <h3 class="reporte-section-title">
                        <i class="pi pi-list"></i> Detalle de Inventario
                        <span style="font-weight: normal; font-size: 0.875rem; color: var(--text-secondary);">
                            (${productosFiltrados.length} productos)
                        </span>
                    </h3>
                </div>
                ${productosFiltrados.length > 0 ? `
                    <div style="max-height: 400px; overflow-y: auto;">
                        <table class="reporte-table">
                            <thead style="position: sticky; top: 0;">
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th class="text-center">Stock</th>
                                    <th class="text-center">Mínimo</th>
                                    <th class="text-center">Estado</th>
                                    <th class="text-right">Precio</th>
                                    <th class="text-right">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productosFiltrados.map(prod => {
                                    let estadoClass = 'badge-ok';
                                    let estadoText = 'Normal';
                                    if (prod.stock_actual === 0) {
                                        estadoClass = 'badge-sin-stock';
                                        estadoText = 'Sin Stock';
                                    } else if (prod.stock_actual <= prod.stock_minimo) {
                                        estadoClass = 'badge-bajo';
                                        estadoText = 'Bajo';
                                    }
                                    return `
                                        <tr>
                                            <td><strong>${prod.nombre}</strong></td>
                                            <td>${prod.categoria || '-'}</td>
                                            <td class="text-center font-bold">${prod.stock_actual}</td>
                                            <td class="text-center">${prod.stock_minimo}</td>
                                            <td class="text-center">
                                                <span class="${estadoClass}">${estadoText}</span>
                                            </td>
                                            <td class="text-right">${formatMoney(prod.precio_venta)}</td>
                                            <td class="text-right font-bold">${formatMoney(prod.valor_inventario)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="empty-reporte">
                        <i class="pi pi-inbox"></i>
                        <p>No hay productos que mostrar</p>
                    </div>
                `}
            </div>
        </div>
        
        <div class="reporte-section">
            <div class="reporte-section-header">
                <h3 class="reporte-section-title">
                    <i class="pi pi-tags"></i> Inventario por Categoría
                </h3>
            </div>
            ${porCategoria && porCategoria.length > 0 ? `
                <div class="categorias-list">
                    ${porCategoria.map(cat => `
                        <div class="categoria-item">
                            <div class="categoria-nombre">${cat.categoria}</div>
                            <div class="categoria-stats">
                                <div class="categoria-cantidad">${cat.total_productos} productos | Stock: ${cat.stock_total}</div>
                                <div class="categoria-valor">${formatMoney(cat.valor_inventario)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-reporte">
                    <i class="pi pi-inbox"></i>
                    <p>No hay datos por categoría</p>
                </div>
            `}
        </div>
    `;
}

function filtrarReporteInventario() {
    filtrosInventario.categoria = document.getElementById('filtroCategoria').value;
    filtrosInventario.estado = document.getElementById('filtroEstado').value;
    renderReporteInventario();
}

function imprimirReporteInventario() {
    if (!reporteInventarioData) return;
    
    const { resumen, productos, porCategoria } = reporteInventarioData;
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    let productosFiltrados = [...productos];
    if (filtrosInventario.categoria) {
        productosFiltrados = productosFiltrados.filter(p => p.id_categoria == filtrosInventario.categoria);
    }
    if (filtrosInventario.estado) {
        productosFiltrados = productosFiltrados.filter(p => {
            if (filtrosInventario.estado === 'sin') return p.stock_actual === 0;
            if (filtrosInventario.estado === 'bajo') return p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
            if (filtrosInventario.estado === 'normal') return p.stock_actual > p.stock_minimo;
            return true;
        });
    }
    
    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Inventario</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { font-size: 18px; margin-bottom: 5px; }
                .header p { color: #666; font-size: 11px; }
                .resumen { display: flex; justify-content: space-around; margin-bottom: 20px; }
                .resumen-item { text-align: center; padding: 10px; border: 1px solid #ddd; }
                .resumen-item .valor { font-size: 14px; font-weight: bold; }
                .resumen-item .label { font-size: 9px; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                th { background: #f5f5f5; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .bajo { color: #b45309; font-weight: bold; }
                .sin-stock { color: #dc2626; font-weight: bold; }
                @page { size: landscape; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>REPORTE DE INVENTARIO</h1>
                <p>Generado: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</p>
            </div>
            
            <div class="resumen">
                <div class="resumen-item">
                    <div class="valor">${resumen.total_productos || 0}</div>
                    <div class="label">Total Productos</div>
                </div>
                <div class="resumen-item">
                    <div class="valor" style="color: #b45309;">${resumen.productos_stock_bajo || 0}</div>
                    <div class="label">Stock Bajo</div>
                </div>
                <div class="resumen-item">
                    <div class="valor" style="color: #dc2626;">${resumen.productos_sin_stock || 0}</div>
                    <div class="label">Sin Stock</div>
                </div>
                <div class="resumen-item">
                    <div class="valor" style="color: #16a34a;">${formatMoney(resumen.valor_total_inventario)}</div>
                    <div class="label">Valor Total</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th class="text-center">Stock</th>
                        <th class="text-center">Mínimo</th>
                        <th class="text-center">Estado</th>
                        <th class="text-right">Precio</th>
                        <th class="text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${productosFiltrados.map(prod => {
                        let estado = 'Normal';
                        let clase = '';
                        if (prod.stock_actual === 0) {
                            estado = 'Sin Stock';
                            clase = 'sin-stock';
                        } else if (prod.stock_actual <= prod.stock_minimo) {
                            estado = 'Bajo';
                            clase = 'bajo';
                        }
                        return `
                            <tr>
                                <td>${prod.nombre}</td>
                                <td>${prod.categoria || '-'}</td>
                                <td class="text-center">${prod.stock_actual}</td>
                                <td class="text-center">${prod.stock_minimo}</td>
                                <td class="text-center ${clase}">${estado}</td>
                                <td class="text-right">${formatMoney(prod.precio_venta)}</td>
                                <td class="text-right">${formatMoney(prod.valor_inventario)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
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

function exportarInventarioCSV() {
    if (!reporteInventarioData) return;
    
    const { productos } = reporteInventarioData;
    
    let productosFiltrados = [...productos];
    if (filtrosInventario.categoria) {
        productosFiltrados = productosFiltrados.filter(p => p.id_categoria == filtrosInventario.categoria);
    }
    if (filtrosInventario.estado) {
        productosFiltrados = productosFiltrados.filter(p => {
            if (filtrosInventario.estado === 'sin') return p.stock_actual === 0;
            if (filtrosInventario.estado === 'bajo') return p.stock_actual > 0 && p.stock_actual <= p.stock_minimo;
            if (filtrosInventario.estado === 'normal') return p.stock_actual > p.stock_minimo;
            return true;
        });
    }
    
    const headers = ['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Precio Venta', 'Valor Inventario'];
    const rows = productosFiltrados.map(p => [
        `"${p.nombre}"`,
        `"${p.categoria || ''}"`,
        p.stock_actual,
        p.stock_minimo,
        p.precio_venta,
        p.valor_inventario
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
