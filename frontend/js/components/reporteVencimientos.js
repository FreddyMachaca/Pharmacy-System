let reporteVencimientosData = null;
let filtrosVencimientos = {
    diasAlerta: 90
};

async function initReporteVencimientos() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="reportes-container fade-in">
            <div class="reportes-header">
                <h2><i class="pi pi-exclamation-triangle"></i> Productos Próximos a Vencer</h2>
                <div class="reportes-filtros">
                    <label>Alertar productos que vencen en:</label>
                    <select id="filtroDiasAlerta" onchange="filtrarReporteVencimientos()">
                        <option value="30">30 días</option>
                        <option value="60">60 días</option>
                        <option value="90" selected>90 días</option>
                        <option value="180">180 días</option>
                        <option value="365">1 año</option>
                    </select>
                    <div class="reportes-actions">
                        <button class="btn-imprimir" onclick="imprimirReporteVencimientos()">
                            <i class="pi pi-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="reporteVencimientosContent">
                <div class="loading-reporte">
                    <i class="pi pi-spin pi-spinner"></i>
                    <p>Cargando reporte...</p>
                </div>
            </div>
        </div>
    `;
    
    await cargarReporteVencimientos();
}

async function cargarReporteVencimientos() {
    try {
        const params = new URLSearchParams({
            dias_alerta: filtrosVencimientos.diasAlerta
        });
        
        const response = await api.get(`/reportes/vencimientos?${params}`);
        reporteVencimientosData = response.data;
        renderReporteVencimientos();
    } catch (error) {
        console.error('Error al cargar reporte:', error);
        document.getElementById('reporteVencimientosContent').innerHTML = `
            <div class="empty-reporte">
                <i class="pi pi-exclamation-circle"></i>
                <p>Error al cargar el reporte de vencimientos</p>
            </div>
        `;
    }
}

function renderReporteVencimientos() {
    const container = document.getElementById('reporteVencimientosContent');
    const { resumen, vencidos, proximosVencer } = reporteVencimientosData;
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    container.innerHTML = `
        <div class="resumen-cards">
            <div class="resumen-card vencidos">
                <div class="resumen-card-header">
                    <i class="pi pi-times-circle"></i>
                    <span class="resumen-card-title">Lotes Vencidos</span>
                </div>
                <div class="resumen-card-value">${resumen.lotes_vencidos || 0}</div>
            </div>
            <div class="resumen-card proximos">
                <div class="resumen-card-header">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span class="resumen-card-title">Próximos a Vencer</span>
                </div>
                <div class="resumen-card-value">${resumen.lotes_proximos_vencer || 0}</div>
            </div>
            <div class="resumen-card lotes">
                <div class="resumen-card-header">
                    <i class="pi pi-box"></i>
                    <span class="resumen-card-title">Unidades en Riesgo</span>
                </div>
                <div class="resumen-card-value">${resumen.unidades_proximas_vencer || 0}</div>
            </div>
            <div class="resumen-card valor">
                <div class="resumen-card-header">
                    <i class="pi pi-dollar"></i>
                    <span class="resumen-card-title">Valor en Riesgo</span>
                </div>
                <div class="resumen-card-value">${formatMoney(resumen.valor_proximo_vencer)}</div>
            </div>
        </div>
        
        ${vencidos && vencidos.length > 0 ? `
            <div class="reporte-section">
                <div class="reporte-section-header" style="background: #fef2f2;">
                    <h3 class="reporte-section-title" style="color: var(--danger-color);">
                        <i class="pi pi-times-circle"></i> Productos Vencidos
                        <span style="font-weight: normal; font-size: 0.875rem;">
                            (${vencidos.length} lotes)
                        </span>
                    </h3>
                </div>
                <table class="reporte-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Lote</th>
                            <th class="text-center">Stock</th>
                            <th class="text-center">Fecha Vencimiento</th>
                            <th class="text-center">Días Vencido</th>
                            <th class="text-right">Valor Perdido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vencidos.map(item => `
                            <tr style="background: #fef2f2;">
                                <td><strong>${item.producto}</strong></td>
                                <td>${item.numero_lote}</td>
                                <td class="text-center">${item.stock_actual}</td>
                                <td class="text-center">${formatearFecha(item.fecha_vencimiento)}</td>
                                <td class="text-center">
                                    <span class="dias-vencer critico">${Math.abs(item.dias_para_vencer)} días</span>
                                </td>
                                <td class="text-right font-bold text-danger">${formatMoney(item.valor_stock)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}
        
        <div class="reporte-section">
            <div class="reporte-section-header" style="background: #fffbeb;">
                <h3 class="reporte-section-title" style="color: #b45309;">
                    <i class="pi pi-exclamation-triangle"></i> Próximos a Vencer
                    <span style="font-weight: normal; font-size: 0.875rem;">
                        (próximos ${filtrosVencimientos.diasAlerta} días)
                    </span>
                </h3>
            </div>
            ${proximosVencer && proximosVencer.length > 0 ? `
                <table class="reporte-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Lote</th>
                            <th class="text-center">Stock</th>
                            <th class="text-center">Fecha Vencimiento</th>
                            <th class="text-center">Días Restantes</th>
                            <th class="text-right">Valor en Riesgo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proximosVencer.map(item => {
                            let diasClass = 'normal';
                            if (item.dias_para_vencer <= 15) diasClass = 'critico';
                            else if (item.dias_para_vencer <= 30) diasClass = 'alerta';
                            
                            return `
                                <tr>
                                    <td><strong>${item.producto}</strong></td>
                                    <td>${item.numero_lote}</td>
                                    <td class="text-center">${item.stock_actual}</td>
                                    <td class="text-center">${formatearFecha(item.fecha_vencimiento)}</td>
                                    <td class="text-center">
                                        <span class="dias-vencer ${diasClass}">${item.dias_para_vencer} días</span>
                                    </td>
                                    <td class="text-right font-bold text-warning">${formatMoney(item.valor_stock)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="empty-reporte">
                    <i class="pi pi-check-circle" style="color: var(--success-color);"></i>
                    <p>No hay productos próximos a vencer en los próximos ${filtrosVencimientos.diasAlerta} días</p>
                </div>
            `}
        </div>
    `;
}

function formatearFecha(fecha) {
    const opciones = { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric',
        timeZone: 'America/La_Paz'
    };
    return new Date(fecha).toLocaleDateString('es-BO', opciones);
}

async function filtrarReporteVencimientos() {
    filtrosVencimientos.diasAlerta = parseInt(document.getElementById('filtroDiasAlerta').value);
    
    document.getElementById('reporteVencimientosContent').innerHTML = `
        <div class="loading-reporte">
            <i class="pi pi-spin pi-spinner"></i>
            <p>Cargando reporte...</p>
        </div>
    `;
    
    await cargarReporteVencimientos();
}

function imprimirReporteVencimientos() {
    if (!reporteVencimientosData) return;
    
    const { resumen, vencidos, proximosVencer } = reporteVencimientosData;
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Vencimientos</title>
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
                .section { margin-bottom: 20px; }
                .section h3 { font-size: 12px; margin-bottom: 10px; padding: 5px; background: #f5f5f5; }
                .section h3.vencidos { background: #fef2f2; color: #dc2626; }
                .section h3.proximos { background: #fffbeb; color: #b45309; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                th { background: #f5f5f5; font-weight: bold; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .danger { color: #dc2626; font-weight: bold; }
                .warning { color: #b45309; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>REPORTE DE VENCIMIENTOS</h1>
                <p>Generado: ${new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}</p>
                <p>Período de alerta: ${filtrosVencimientos.diasAlerta} días</p>
            </div>
            
            <div class="resumen">
                <div class="resumen-item">
                    <div class="valor" style="color: #dc2626;">${resumen.lotes_vencidos || 0}</div>
                    <div class="label">Lotes Vencidos</div>
                </div>
                <div class="resumen-item">
                    <div class="valor" style="color: #b45309;">${resumen.lotes_proximos_vencer || 0}</div>
                    <div class="label">Próximos a Vencer</div>
                </div>
                <div class="resumen-item">
                    <div class="valor">${resumen.unidades_proximas_vencer || 0}</div>
                    <div class="label">Unidades en Riesgo</div>
                </div>
                <div class="resumen-item">
                    <div class="valor" style="color: #dc2626;">${formatMoney(resumen.valor_proximo_vencer)}</div>
                    <div class="label">Valor en Riesgo</div>
                </div>
            </div>
            
            ${vencidos && vencidos.length > 0 ? `
                <div class="section">
                    <h3 class="vencidos">PRODUCTOS VENCIDOS (${vencidos.length} lotes)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Lote</th>
                                <th class="text-center">Stock</th>
                                <th class="text-center">F. Vencimiento</th>
                                <th class="text-center">Días Vencido</th>
                                <th class="text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vencidos.map(item => `
                                <tr>
                                    <td>${item.producto}</td>
                                    <td>${item.numero_lote}</td>
                                    <td class="text-center">${item.stock_actual}</td>
                                    <td class="text-center">${item.fecha_vencimiento.split('T')[0]}</td>
                                    <td class="text-center danger">${Math.abs(item.dias_para_vencer)}</td>
                                    <td class="text-right danger">${formatMoney(item.valor_stock)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
            
            ${proximosVencer && proximosVencer.length > 0 ? `
                <div class="section">
                    <h3 class="proximos">PRÓXIMOS A VENCER (${proximosVencer.length} lotes)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Lote</th>
                                <th class="text-center">Stock</th>
                                <th class="text-center">F. Vencimiento</th>
                                <th class="text-center">Días Restantes</th>
                                <th class="text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${proximosVencer.map(item => `
                                <tr>
                                    <td>${item.producto}</td>
                                    <td>${item.numero_lote}</td>
                                    <td class="text-center">${item.stock_actual}</td>
                                    <td class="text-center">${item.fecha_vencimiento.split('T')[0]}</td>
                                    <td class="text-center warning">${item.dias_para_vencer}</td>
                                    <td class="text-right warning">${formatMoney(item.valor_stock)}</td>
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
