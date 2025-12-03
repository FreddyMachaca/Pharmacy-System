let configFarmacia = {
    nombre: 'FARMACIA SALUD TOTAL',
    direccion: 'Av. Principal #123, La Paz - Bolivia',
    telefono: '(591) 2-1234567',
    email: 'contacto@farmaciasalud.com',
    nit: '1234567890'
};

let reporteActual = null;
let datosReporte = null;

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const fechaStr = fecha.split('T')[0];
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio}`;
}

function initReportesProfesionales() {
    const content = document.getElementById('pageContent');
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaInicio = inicioMes.toISOString().split('T')[0];
    const fechaFin = hoy.toISOString().split('T')[0];
    
    content.innerHTML = `
        <div class="reportes-container fade-in">
            <div class="reportes-header">
                <h2><i class="pi pi-file-pdf"></i> Reportes Exportables</h2>
            </div>
            
            <div class="reportes-profesionales-grid">
                <div class="reporte-config-panel">
                    <div class="config-section">
                        <h3 class="config-title"><i class="pi pi-cog"></i> Configuración del Reporte</h3>
                        
                        <div class="form-group">
                            <label>Tipo de Reporte</label>
                            <select id="tipoReporte" class="form-control" onchange="cambiarTipoReporte()">
                                <option value="ventas">Reporte de Ventas</option>
                                <option value="inventario">Reporte de Inventario</option>
                                <option value="vencimientos">Productos Próximos a Vencer</option>
                                <option value="productos-vendidos">Productos Más Vendidos</option>
                                <option value="movimientos">Movimientos de Inventario</option>
                            </select>
                        </div>
                        
                        <div id="filtrosReporte">
                            <div class="form-group">
                                <label>Fecha Inicio</label>
                                <input type="date" id="fechaInicio" class="form-control" value="${fechaInicio}">
                            </div>
                            
                            <div class="form-group">
                                <label>Fecha Fin</label>
                                <input type="date" id="fechaFin" class="form-control" value="${fechaFin}">
                            </div>
                        </div>
                        
                        <button class="btn-generar-reporte" onclick="generarReporte()">
                            <i class="pi pi-play"></i> Generar Reporte
                        </button>
                    </div>
                    
                    <div class="config-section">
                        <h3 class="config-title"><i class="pi pi-building"></i> Datos de la Farmacia</h3>
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="farmaNombre" class="form-control" value="${configFarmacia.nombre}">
                        </div>
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" id="farmaDireccion" class="form-control" value="${configFarmacia.direccion}">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" id="farmaTelefono" class="form-control" value="${configFarmacia.telefono}">
                        </div>
                        <div class="form-group">
                            <label>NIT</label>
                            <input type="text" id="farmaNIT" class="form-control" value="${configFarmacia.nit}">
                        </div>
                        <button class="btn-guardar-config" onclick="guardarConfigFarmacia()">
                            <i class="pi pi-save"></i> Guardar Configuración
                        </button>
                    </div>
                </div>
                
                <div class="reporte-preview-panel">
                    <div class="preview-header">
                        <h3><i class="pi pi-eye"></i> Vista Previa</h3>
                        <div class="preview-actions" id="previewActions" style="display: none;">
                            <button class="btn-preview-action" onclick="descargarPDF()">
                                <i class="pi pi-download"></i> Descargar PDF
                            </button>
                            <button class="btn-preview-action" onclick="descargarExcel()">
                                <i class="pi pi-download"></i> Descargar Excel
                            </button>
                        </div>
                    </div>
                    <div class="preview-content" id="previewContent">
                        <div class="preview-empty">
                            <i class="pi pi-file"></i>
                            <p>Selecciona los parámetros y genera un reporte para visualizar la vista previa</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="modalPDF" class="modal-pdf" style="display: none;">
            <div class="modal-pdf-overlay" onclick="cerrarModalPDF()"></div>
            <div class="modal-pdf-content">
                <div class="modal-pdf-header">
                    <h3><i class="pi pi-file-pdf"></i> Vista Previa del PDF</h3>
                    <button class="modal-pdf-close" onclick="cerrarModalPDF()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-pdf-body">
                    <iframe id="pdfViewer" style="width: 100%; height: 100%; border: none;"></iframe>
                </div>
                <div class="modal-pdf-footer">
                    <button class="btn-modal-action" onclick="descargarPDFModal()">
                        <i class="pi pi-download"></i> Descargar PDF
                    </button>
                    <button class="btn-modal-action secondary" onclick="cerrarModalPDF()">
                        <i class="pi pi-times"></i> Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function cambiarTipoReporte() {
    const tipo = document.getElementById('tipoReporte').value;
    const filtrosDiv = document.getElementById('filtrosReporte');
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const fechaInicio = inicioMes.toISOString().split('T')[0];
    const fechaFin = hoy.toISOString().split('T')[0];
    
    if (tipo === 'vencimientos') {
        filtrosDiv.innerHTML = `
            <div class="form-group">
                <label>Días de Alerta</label>
                <select id="diasAlerta" class="form-control">
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                    <option value="90" selected>90 días</option>
                    <option value="180">180 días</option>
                </select>
            </div>
        `;
    } else if (tipo === 'inventario') {
        filtrosDiv.innerHTML = `
            <div class="form-group">
                <label>Categoría</label>
                <select id="categoriaFiltro" class="form-control">
                    <option value="">Todas las categorías</option>
                </select>
            </div>
        `;
        cargarCategoriasSelect();
    } else {
        filtrosDiv.innerHTML = `
            <div class="form-group">
                <label>Fecha Inicio</label>
                <input type="date" id="fechaInicio" class="form-control" value="${fechaInicio}">
            </div>
            <div class="form-group">
                <label>Fecha Fin</label>
                <input type="date" id="fechaFin" class="form-control" value="${fechaFin}">
            </div>
        `;
    }
}

async function cargarCategoriasSelect() {
    try {
        const response = await api.get('/productos/categorias');
        const categorias = response.data || [];
        const select = document.getElementById('categoriaFiltro');
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

function guardarConfigFarmacia() {
    configFarmacia.nombre = document.getElementById('farmaNombre').value;
    configFarmacia.direccion = document.getElementById('farmaDireccion').value;
    configFarmacia.telefono = document.getElementById('farmaTelefono').value;
    configFarmacia.nit = document.getElementById('farmaNIT').value;
    
    localStorage.setItem('pharmacy_config', JSON.stringify(configFarmacia));
    
    alert('Configuración guardada exitosamente');
}

async function generarReporte() {
    const tipo = document.getElementById('tipoReporte').value;
    reporteActual = tipo;
    
    const preview = document.getElementById('previewContent');
    preview.innerHTML = '<div class="loading-reporte"><i class="pi pi-spin pi-spinner"></i><p>Generando reporte...</p></div>';
    
    try {
        datosReporte = await obtenerDatosReporte(tipo);
        mostrarVistaPrevia(tipo, datosReporte);
        document.getElementById('previewActions').style.display = 'flex';
    } catch (error) {
        console.error('Error al generar reporte:', error);
        preview.innerHTML = '<div class="preview-error"><i class="pi pi-exclamation-circle"></i><p>Error al generar el reporte</p></div>';
    }
}

async function obtenerDatosReporte(tipo) {
    switch (tipo) {
        case 'ventas':
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
            const ventasRes = await api.get(`/reportes/ventas?${params}`);
            return { tipo: 'ventas', ...ventasRes.data, fechaInicio, fechaFin };
            
        case 'inventario':
            const invRes = await api.get('/reportes/inventario');
            return { tipo: 'inventario', ...invRes.data };
            
        case 'vencimientos':
            const dias = document.getElementById('diasAlerta').value;
            const vencParams = new URLSearchParams({ dias_alerta: dias });
            const vencRes = await api.get(`/reportes/vencimientos?${vencParams}`);
            return { tipo: 'vencimientos', ...vencRes.data, diasAlerta: dias };
            
        case 'productos-vendidos':
            const fechaInicioVend = document.getElementById('fechaInicio').value;
            const fechaFinVend = document.getElementById('fechaFin').value;
            const paramsVend = new URLSearchParams({ 
                fecha_inicio: fechaInicioVend, 
                fecha_fin: fechaFinVend,
                limite: 20
            });
            const vendRes = await api.get(`/reportes/ventas?${paramsVend}`);
            return { 
                tipo: 'productos-vendidos', 
                productosVendidos: vendRes.data.productosMasVendidos || [],
                fechaInicio: fechaInicioVend,
                fechaFin: fechaFinVend,
                resumen: vendRes.data.resumen || {}
            };
            
        case 'movimientos':
            const fechaInicioMov = document.getElementById('fechaInicio').value;
            const fechaFinMov = document.getElementById('fechaFin').value;
            const movRes = await api.get('/productos/movimientos');
            const movimientos = movRes.data || [];
            const movimientosFiltrados = movimientos.filter(m => {
                if (!m.created_at) return false;
                const fecha = m.created_at.split('T')[0];
                return fecha >= fechaInicioMov && fecha <= fechaFinMov;
            });
            return { 
                tipo: 'movimientos', 
                movimientos: movimientosFiltrados,
                fechaInicio: fechaInicioMov,
                fechaFin: fechaFinMov
            };
            
        default:
            throw new Error('Tipo de reporte no soportado');
    }
}

function mostrarVistaPrevia(tipo, datos) {
    const preview = document.getElementById('previewContent');
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    let html = `
        <div class="preview-document">
            <div class="preview-header-doc">
                <div class="header-logo">
                    <i class="pi pi-plus-circle"></i>
                </div>
                <div class="header-info">
                    <h1>${configFarmacia.nombre}</h1>
                    <p>${configFarmacia.direccion}</p>
                    <p>Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}</p>
                </div>
            </div>
            <div class="preview-title">
                <h2>${getTituloReporte(tipo)}</h2>
                <p class="preview-date">Fecha de generación: ${new Date().toLocaleDateString('es-BO', { timeZone: 'America/La_Paz' })}</p>
            </div>
    `;
    
    if (tipo === 'ventas') {
        html += `
            <div class="preview-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Ventas:</span>
                    <span class="summary-value">${datos.resumen.total_ventas || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Ingresos Totales:</span>
                    <span class="summary-value">${formatMoney(datos.resumen.ingresos_totales)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Promedio/Venta:</span>
                    <span class="summary-value">${formatMoney(datos.resumen.promedio_venta)}</span>
                </div>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Cantidad Ventas</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.ventasDiarias.slice(0, 10).map(v => `
                        <tr>
                            <td>${formatearFecha(v.fecha)}</td>
                            <td>${v.cantidad_ventas}</td>
                            <td>${formatMoney(v.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tipo === 'inventario') {
        html += `
            <div class="preview-summary">
                <div class="summary-item">
                    <span class="summary-label">Total Productos:</span>
                    <span class="summary-value">${datos.resumen.total_productos || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Stock Bajo:</span>
                    <span class="summary-value">${datos.resumen.productos_stock_bajo || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Valor Total:</span>
                    <span class="summary-value">${formatMoney(datos.resumen.valor_total_inventario)}</span>
                </div>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Stock</th>
                        <th>Stock Mín.</th>
                        <th>Precio Venta</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.productos.slice(0, 10).map(p => `
                        <tr>
                            <td>${p.nombre}</td>
                            <td>${p.stock_actual}</td>
                            <td>${p.stock_minimo}</td>
                            <td>${formatMoney(p.precio_venta)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tipo === 'vencimientos') {
        html += `
            <div class="preview-summary">
                <div class="summary-item">
                    <span class="summary-label">Lotes Vencidos:</span>
                    <span class="summary-value">${datos.resumen.lotes_vencidos || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Próximos a Vencer:</span>
                    <span class="summary-value">${datos.resumen.lotes_proximos_vencer || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Valor en Riesgo:</span>
                    <span class="summary-value">${formatMoney(datos.resumen.valor_proximo_vencer)}</span>
                </div>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Lote</th>
                        <th>Vencimiento</th>
                        <th>Stock</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.proximosVencer.slice(0, 10).map(p => `
                        <tr>
                            <td>${p.producto}</td>
                            <td>${p.numero_lote}</td>
                            <td>${p.fecha_vencimiento.split('T')[0]}</td>
                            <td>${p.stock_actual}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tipo === 'productos-vendidos') {
        html += `
            <div class="preview-summary">
                <div class="summary-item">
                    <span class="summary-label">Período:</span>
                    <span class="summary-value">${formatearFecha(datos.fechaInicio)} - ${formatearFecha(datos.fechaFin)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Productos:</span>
                    <span class="summary-value">${datos.productosVendidos.length || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Unidades Vendidas:</span>
                    <span class="summary-value">${datos.productosVendidos.reduce((sum, p) => sum + (parseInt(p.cantidad_vendida) || 0), 0)}</span>
                </div>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad Vendida</th>
                        <th>Total Ventas</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.productosVendidos.slice(0, 10).map(p => `
                        <tr>
                            <td>${p.producto || p.nombre}</td>
                            <td>${p.cantidad_vendida || 0}</td>
                            <td>${formatMoney(p.total_ventas || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tipo === 'movimientos') {
        const entradas = datos.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'ENTRADA').length;
        const salidas = datos.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'SALIDA').length;
        
        html += `
            <div class="preview-summary">
                <div class="summary-item">
                    <span class="summary-label">Período:</span>
                    <span class="summary-value">${formatearFecha(datos.fechaInicio)} - ${formatearFecha(datos.fechaFin)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Movimientos:</span>
                    <span class="summary-value">${datos.movimientos.length || 0}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Entradas:</span>
                    <span class="summary-value">${entradas}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Salidas:</span>
                    <span class="summary-value">${salidas}</span>
                </div>
            </div>
            <table class="preview-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    ${datos.movimientos.slice(0, 10).map(m => `
                        <tr>
                            <td>${formatearFecha(m.created_at)}</td>
                            <td>${m.producto_nombre || '-'}</td>
                            <td><span class="badge ${m.tipo && m.tipo.toUpperCase() === 'ENTRADA' ? 'badge-success' : 'badge-danger'}">${m.tipo ? m.tipo.toUpperCase() : '-'}</span></td>
                            <td>${m.cantidad}</td>
                            <td>${m.motivo || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    html += '</div>';
    preview.innerHTML = html;
}

function getTituloReporte(tipo) {
    const titulos = {
        'ventas': 'REPORTE DE VENTAS',
        'inventario': 'REPORTE DE INVENTARIO',
        'vencimientos': 'REPORTE DE PRODUCTOS PRÓXIMOS A VENCER',
        'productos-vendidos': 'REPORTE DE PRODUCTOS MÁS VENDIDOS',
        'movimientos': 'REPORTE DE MOVIMIENTOS DE INVENTARIO'
    };
    return titulos[tipo] || 'REPORTE';
}

async function descargarPDF() {
    if (!datosReporte) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    agregarEncabezadoPDF(doc);
    
    if (reporteActual === 'ventas') {
        generarPDFVentas(doc, datosReporte);
    } else if (reporteActual === 'inventario') {
        generarPDFInventario(doc, datosReporte);
    } else if (reporteActual === 'vencimientos') {
        generarPDFVencimientos(doc, datosReporte);
    } else if (reporteActual === 'productos-vendidos') {
        generarPDFProductosVendidos(doc, datosReporte);
    } else if (reporteActual === 'movimientos') {
        generarPDFMovimientos(doc, datosReporte);
    }
    
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    const iframe = document.getElementById('pdfViewer');
    iframe.src = url;
    document.getElementById('modalPDF').style.display = 'flex';
}

function agregarEncabezadoPDF(doc) {
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(configFarmacia.nombre, 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(configFarmacia.direccion, 105, 22, { align: 'center' });
    doc.text(`Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}`, 105, 28, { align: 'center' });
    doc.text(`Email: ${configFarmacia.email}`, 105, 34, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
}

function generarPDFVentas(doc, datos) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE VENTAS', 105, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${formatearFecha(datos.fechaInicio)} al ${formatearFecha(datos.fechaFin)}`, 105, 58, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-BO')}`, 105, 64, { align: 'center' });
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 70, 180, 25, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN EJECUTIVO', 20, 78);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de Ventas: ${datos.resumen.total_ventas || 0}`, 20, 85);
    doc.text(`Ingresos Totales: ${formatMoney(datos.resumen.ingresos_totales)}`, 75, 85);
    doc.text(`Promedio por Venta: ${formatMoney(datos.resumen.promedio_venta)}`, 135, 85);
    doc.text(`Productos Vendidos: ${datos.resumen.productos_vendidos || 0}`, 20, 91);
    
    const ventasData = datos.ventasDiarias.map(v => [
        formatearFecha(v.fecha),
        v.cantidad_ventas.toString(),
        formatMoney(v.total)
    ]);
    
    doc.autoTable({
        startY: 100,
        head: [['Fecha', 'Cantidad Ventas', 'Total']],
        body: ventasData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 50, halign: 'center' },
            2: { cellWidth: 60, halign: 'right' }
        }
    });
    
    if (datos.productosMasVendidos && datos.productosMasVendidos.length > 0) {
        const startY = doc.lastAutoTable.finalY + 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('PRODUCTOS MÁS VENDIDOS', 20, startY);
        
        const productosData = datos.productosMasVendidos.slice(0, 10).map((p, i) => [
            (i + 1).toString(),
            p.nombre,
            p.cantidad_vendida.toString(),
            formatMoney(p.total_vendido)
        ]);
        
        doc.autoTable({
            startY: startY + 5,
            head: [['#', 'Producto', 'Cantidad', 'Total']],
            body: productosData,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 90 },
                2: { cellWidth: 35, halign: 'center' },
                3: { cellWidth: 40, halign: 'right' }
            }
        });
    }
    
    agregarPiePagina(doc);
}

function generarPDFInventario(doc, datos) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE INVENTARIO', 105, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-BO')}`, 105, 58, { align: 'center' });
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 65, 180, 25, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE INVENTARIO', 20, 73);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total de Productos: ${datos.resumen.total_productos || 0}`, 20, 80);
    doc.text(`Productos con Stock Bajo: ${datos.resumen.productos_stock_bajo || 0}`, 75, 80);
    doc.text(`Productos Sin Stock: ${datos.resumen.productos_sin_stock || 0}`, 135, 80);
    doc.text(`Valor Total del Inventario: ${formatMoney(datos.resumen.valor_total_inventario)}`, 20, 86);
    
    const inventarioData = datos.productos.map(p => {
        let estado = 'Normal';
        if (p.stock_actual === 0) estado = 'Sin Stock';
        else if (p.stock_actual <= p.stock_minimo) estado = 'Bajo';
        
        return [
            p.nombre,
            p.categoria || '-',
            p.stock_actual.toString(),
            p.stock_minimo.toString(),
            estado,
            formatMoney(p.precio_venta)
        ];
    });
    
    doc.autoTable({
        startY: 95,
        head: [['Producto', 'Categoría', 'Stock', 'Mín.', 'Estado', 'Precio']],
        body: inventarioData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' }
        },
        didParseCell: function(data) {
            if (data.column.index === 4 && data.section === 'body') {
                if (data.cell.text[0] === 'Sin Stock') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.text[0] === 'Bajo') {
                    data.cell.styles.textColor = [234, 88, 12];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });
    
    agregarPiePagina(doc);
}

function generarPDFVencimientos(doc, datos) {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE VENCIMIENTOS', 105, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Alerta: Próximos ${datos.diasAlerta} días`, 105, 58, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-BO')}`, 105, 64, { align: 'center' });
    
    const formatMoney = (val) => `Bs. ${parseFloat(val || 0).toFixed(2)}`;
    
    doc.setFillColor(254, 226, 226);
    doc.rect(15, 70, 180, 25, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN DE VENCIMIENTOS', 20, 78);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Lotes Vencidos: ${datos.resumen.lotes_vencidos || 0}`, 20, 85);
    doc.text(`Próximos a Vencer: ${datos.resumen.lotes_proximos_vencer || 0}`, 75, 85);
    doc.text(`Unidades en Riesgo: ${datos.resumen.unidades_proximas_vencer || 0}`, 135, 85);
    doc.text(`Valor en Riesgo: ${formatMoney(datos.resumen.valor_proximo_vencer)}`, 20, 91);
    
    if (datos.vencidos && datos.vencidos.length > 0) {
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text('PRODUCTOS VENCIDOS', 20, 103);
        doc.setTextColor(0, 0, 0);
        
        const vencidosData = datos.vencidos.map(p => [
            p.producto,
            p.numero_lote,
            p.fecha_vencimiento.split('T')[0],
            p.stock_actual.toString(),
            formatMoney(p.valor_stock)
        ]);
        
        doc.autoTable({
            startY: 108,
            head: [['Producto', 'Lote', 'Vencimiento', 'Stock', 'Valor']],
            body: vencidosData,
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 35 },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 30, halign: 'right' }
            }
        });
    }
    
    if (datos.proximosVencer && datos.proximosVencer.length > 0) {
        const startY = datos.vencidos && datos.vencidos.length > 0 ? doc.lastAutoTable.finalY + 10 : 108;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(234, 88, 12);
        doc.text('PRÓXIMOS A VENCER', 20, startY);
        doc.setTextColor(0, 0, 0);
        
        const proximosData = datos.proximosVencer.map(p => [
            p.producto,
            p.numero_lote,
            p.fecha_vencimiento.split('T')[0],
            `${p.dias_para_vencer} días`,
            p.stock_actual.toString(),
            formatMoney(p.valor_stock)
        ]);
        
        doc.autoTable({
            startY: startY + 5,
            head: [['Producto', 'Lote', 'Vencimiento', 'Días', 'Stock', 'Valor']],
            body: proximosData,
            theme: 'striped',
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { cellWidth: 30 },
                2: { cellWidth: 28, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 27, halign: 'right' }
            }
        });
    }
    
    agregarPiePagina(doc);
}

function generarPDFProductosVendidos(doc, datos) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('PRODUCTOS MÁS VENDIDOS', 105, 70, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${formatearFecha(datos.fechaInicio)} - ${formatearFecha(datos.fechaFin)}`, 105, 78, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de productos vendidos: ${datos.productosVendidos.length}`, 20, 92);
    
    const productosData = datos.productosVendidos.map(p => [
        p.producto,
        p.cantidad_vendida ? p.cantidad_vendida.toString() : '0',
        formatMoney(p.total_ventas || 0)
    ]);
    
    doc.autoTable({
        startY: 98,
        head: [['Producto', 'Cantidad Vendida', 'Total Ventas']],
        body: productosData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 45, halign: 'right' }
        }
    });
    
    agregarPiePagina(doc);
}

function generarPDFMovimientos(doc, datos) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('MOVIMIENTOS DE INVENTARIO', 105, 70, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${formatearFecha(datos.fechaInicio)} - ${formatearFecha(datos.fechaFin)}`, 105, 78, { align: 'center' });
    
    const entradas = datos.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'ENTRADA').length;
    const salidas = datos.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'SALIDA').length;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total de movimientos: ${datos.movimientos.length}`, 20, 92);
    doc.text(`Entradas: ${entradas} | Salidas: ${salidas}`, 20, 100);
    
    const movimientosData = datos.movimientos.map(m => [
        formatearFecha(m.created_at),
        m.producto_nombre || '-',
        m.tipo ? m.tipo.toUpperCase() : '-',
        m.cantidad ? m.cantidad.toString() : '0',
        m.motivo || '-'
    ]);
    
    doc.autoTable({
        startY: 106,
        head: [['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo']],
        body: movimientosData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
            0: { cellWidth: 28, halign: 'center' },
            1: { cellWidth: 60 },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 47 }
        },
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 2) {
                const tipo = data.cell.raw ? data.cell.raw.toUpperCase() : '';
                if (tipo === 'ENTRADA') {
                    data.cell.styles.textColor = [22, 163, 74];
                    data.cell.styles.fontStyle = 'bold';
                } else if (tipo === 'SALIDA') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });
    
    agregarPiePagina(doc);
}

function agregarPiePagina(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Este es un documento generado automáticamente', 105, 290, { align: 'center' });
    }
}

async function descargarExcel() {
    if (!datosReporte) return;
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = configFarmacia.nombre;
    workbook.created = new Date();
    
    if (reporteActual === 'ventas') {
        const worksheet = workbook.addWorksheet('Ventas');
        
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        
        worksheet.mergeCells('A2:C2');
        worksheet.getCell('A2').value = configFarmacia.direccion;
        worksheet.getCell('A2').font = { size: 11 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:C3');
        worksheet.getCell('A3').value = `Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:C5');
        worksheet.getCell('A5').value = 'REPORTE DE VENTAS';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        worksheet.getRow(5).height = 22;
        
        worksheet.mergeCells('A6:C6');
        worksheet.getCell('A6').value = `Período: ${formatearFecha(datosReporte.fechaInicio)} al ${formatearFecha(datosReporte.fechaFin)}`;
        worksheet.getCell('A6').font = { size: 10, italic: true };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A7:C7');
        worksheet.getCell('A7').value = `Generado: ${new Date().toLocaleString('es-BO')}`;
        worksheet.getCell('A7').font = { size: 9, italic: true };
        worksheet.getCell('A7').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A9:B9');
        worksheet.getCell('A9').value = 'RESUMEN';
        worksheet.getCell('A9').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A9').alignment = { horizontal: 'center' };
        worksheet.getCell('A9').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        worksheet.getRow(9).height = 20;
        
        const resumenData = [
            ['Total Ventas', datosReporte.resumen.total_ventas || 0],
            ['Ingresos Totales', `Bs. ${parseFloat(datosReporte.resumen.ingresos_totales || 0).toFixed(2)}`],
            ['Promedio por Venta', `Bs. ${parseFloat(datosReporte.resumen.promedio_venta || 0).toFixed(2)}`],
            ['Productos Vendidos', datosReporte.resumen.productos_vendidos || 0]
        ];
        
        resumenData.forEach((row, idx) => {
            const rowNum = 10 + idx;
            worksheet.getCell(`A${rowNum}`).value = row[0];
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
            worksheet.getCell(`A${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEBF5FB' }
            };
            worksheet.getCell(`B${rowNum}`).value = row[1];
            worksheet.getCell(`B${rowNum}`).font = { size: 10 };
            worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
        });
        
        worksheet.mergeCells('A15:C15');
        worksheet.getCell('A15').value = 'VENTAS POR DÍA';
        worksheet.getCell('A15').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A15').alignment = { horizontal: 'center' };
        worksheet.getCell('A15').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        worksheet.getRow(15).height = 20;
        
        const headerRow = worksheet.getRow(16);
        headerRow.values = ['Fecha', 'Cantidad Ventas', 'Total (Bs.)'];
        headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        headerRow.height = 18;
        
        datosReporte.ventasDiarias.forEach((venta, idx) => {
            const rowNum = 17 + idx;
            const row = worksheet.getRow(rowNum);
            row.values = [
                formatearFecha(venta.fecha),
                venta.cantidad_ventas,
                parseFloat(venta.total || 0).toFixed(2)
            ];
            
            const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
            row.eachCell((cell, colNum) => {
                cell.font = { size: 10 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
                if (colNum === 1) cell.alignment = { horizontal: 'center' };
                if (colNum === 2) cell.alignment = { horizontal: 'center' };
                if (colNum === 3) {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '#,##0.00';
                }
            });
        });
        
        worksheet.columns = [
            { width: 25 },
            { width: 20 },
            { width: 20 }
        ];
        
        worksheet.columns = [
            { width: 25 },
            { width: 20 },
            { width: 20 }
        ];
        
    } else if (reporteActual === 'inventario') {
        const worksheet = workbook.addWorksheet('Inventario');
        
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = configFarmacia.direccion;
        worksheet.getCell('A2').font = { size: 11 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:F3');
        worksheet.getCell('A3').value = `Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:F5');
        worksheet.getCell('A5').value = 'REPORTE DE INVENTARIO';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        worksheet.getRow(5).height = 22;
        
        worksheet.mergeCells('A6:F6');
        worksheet.getCell('A6').value = `Fecha: ${new Date().toLocaleDateString('es-BO')}`;
        worksheet.getCell('A6').font = { size: 10, italic: true };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A8:B8');
        worksheet.getCell('A8').value = 'RESUMEN';
        worksheet.getCell('A8').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A8').alignment = { horizontal: 'center' };
        worksheet.getCell('A8').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        worksheet.getRow(8).height = 20;
        
        const resumenData = [
            ['Total Productos', datosReporte.resumen.total_productos || 0],
            ['Stock Bajo', datosReporte.resumen.productos_stock_bajo || 0],
            ['Sin Stock', datosReporte.resumen.productos_sin_stock || 0],
            ['Valor Total', `Bs. ${parseFloat(datosReporte.resumen.valor_total_inventario || 0).toFixed(2)}`]
        ];
        
        resumenData.forEach((row, idx) => {
            const rowNum = 9 + idx;
            worksheet.getCell(`A${rowNum}`).value = row[0];
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
            worksheet.getCell(`A${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEBF5FB' }
            };
            worksheet.getCell(`B${rowNum}`).value = row[1];
            worksheet.getCell(`B${rowNum}`).font = { size: 10 };
            worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
        });
        
        worksheet.mergeCells('A14:F14');
        worksheet.getCell('A14').value = 'DETALLE DE INVENTARIO';
        worksheet.getCell('A14').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A14').alignment = { horizontal: 'center' };
        worksheet.getCell('A14').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        worksheet.getRow(14).height = 20;
        
        const headerRow = worksheet.getRow(15);
        headerRow.values = ['Producto', 'Categoría', 'Stock', 'Stock Mín.', 'Estado', 'Precio (Bs.)'];
        headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2980B9' }
        };
        headerRow.height = 18;
        
        datosReporte.productos.forEach((producto, idx) => {
            let estado = 'Normal';
            if (producto.stock_actual === 0) estado = 'Sin Stock';
            else if (producto.stock_actual <= producto.stock_minimo) estado = 'Bajo';
            
            const rowNum = 16 + idx;
            const row = worksheet.getRow(rowNum);
            row.values = [
                producto.nombre,
                producto.categoria || '-',
                producto.stock_actual,
                producto.stock_minimo,
                estado,
                parseFloat(producto.precio_venta || 0).toFixed(2)
            ];
            
            const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
            row.eachCell((cell, colNum) => {
                cell.font = { size: 10 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
                
                if (colNum >= 2 && colNum <= 4) cell.alignment = { horizontal: 'center' };
                if (colNum === 6) {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '#,##0.00';
                }
                
                if (colNum === 5) {
                    cell.font = { size: 10, bold: true };
                    cell.alignment = { horizontal: 'center' };
                    if (estado === 'Sin Stock') {
                        cell.font.color = { argb: 'FFDC2626' };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFEE2E2' }
                        };
                    } else if (estado === 'Bajo') {
                        cell.font.color = { argb: 'FFEA580C' };
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFED7AA' }
                        };
                    } else {
                        cell.font.color = { argb: 'FF16A34A' };
                    }
                }
            });
        });
        
        worksheet.columns = [
            { width: 35 },
            { width: 20 },
            { width: 12 },
            { width: 12 },
            { width: 15 },
            { width: 15 }
        ];
        
    } else if (reporteActual === 'vencimientos') {
        const worksheet = workbook.addWorksheet('Vencimientos');
        
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = configFarmacia.direccion;
        worksheet.getCell('A2').font = { size: 11 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:F3');
        worksheet.getCell('A3').value = `Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:F5');
        worksheet.getCell('A5').value = 'REPORTE DE VENCIMIENTOS';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' }
        };
        worksheet.getRow(5).height = 22;
        
        worksheet.mergeCells('A6:F6');
        worksheet.getCell('A6').value = `Alerta: Próximos ${datosReporte.diasAlerta} días`;
        worksheet.getCell('A6').font = { size: 10, italic: true, color: { argb: 'FFEA580C' } };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A7:F7');
        worksheet.getCell('A7').value = `Fecha: ${new Date().toLocaleDateString('es-BO')}`;
        worksheet.getCell('A7').font = { size: 9, italic: true };
        worksheet.getCell('A7').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A9:B9');
        worksheet.getCell('A9').value = 'RESUMEN';
        worksheet.getCell('A9').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A9').alignment = { horizontal: 'center' };
        worksheet.getCell('A9').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC2626' }
        };
        worksheet.getRow(9).height = 20;
        
        const resumenData = [
            ['Lotes Vencidos', datosReporte.resumen.lotes_vencidos || 0],
            ['Próximos a Vencer', datosReporte.resumen.lotes_proximos_vencer || 0],
            ['Unidades en Riesgo', datosReporte.resumen.unidades_proximas_vencer || 0],
            ['Valor en Riesgo', `Bs. ${parseFloat(datosReporte.resumen.valor_proximo_vencer || 0).toFixed(2)}`]
        ];
        
        resumenData.forEach((row, idx) => {
            const rowNum = 10 + idx;
            worksheet.getCell(`A${rowNum}`).value = row[0];
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
            worksheet.getCell(`A${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEE2E2' }
            };
            worksheet.getCell(`B${rowNum}`).value = row[1];
            worksheet.getCell(`B${rowNum}`).font = { size: 10 };
            worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
        });
        
        worksheet.mergeCells('A15:F15');
        worksheet.getCell('A15').value = 'PRÓXIMOS A VENCER';
        worksheet.getCell('A15').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A15').alignment = { horizontal: 'center' };
        worksheet.getCell('A15').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEA580C' }
        };
        worksheet.getRow(15).height = 20;
        
        const headerRow = worksheet.getRow(16);
        headerRow.values = ['Producto', 'Lote', 'Vencimiento', 'Días', 'Stock', 'Valor (Bs.)'];
        headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEA580C' }
        };
        headerRow.height = 18;
        
        for (let i = 16; i < 16 + datosReporte.productos.length; i++) {
            const bgColor = i % 2 === 0 ? 'FFFFFF' : 'F8F9FA';
            const estado = ws[`E${i}`] ? ws[`E${i}`].v : '';
            
            if (ws[`A${i}`]) ws[`A${i}`].s = { font: { sz: 10 }, fill: { fgColor: { rgb: bgColor } } };
            if (ws[`B${i}`]) ws[`B${i}`].s = { font: { sz: 10 }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: 'center' } };
            if (ws[`C${i}`]) ws[`C${i}`].s = { font: { sz: 10 }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: 'center' } };
            if (ws[`D${i}`]) ws[`D${i}`].s = { font: { sz: 10 }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: 'center' } };
            
            if (ws[`E${i}`]) {
                let estadoStyle = { font: { sz: 10, bold: true }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: 'center' } };
                if (estado === 'Sin Stock') {
                    estadoStyle.font.color = { rgb: 'DC2626' };
                    estadoStyle.fill = { fgColor: { rgb: 'FEE2E2' } };
                } else if (estado === 'Bajo') {
                    estadoStyle.font.color = { rgb: 'EA580C' };
                    estadoStyle.fill = { fgColor: { rgb: 'FED7AA' } };
                } else {
                    estadoStyle.font.color = { rgb: '16A34A' };
                }
                ws[`E${i}`].s = estadoStyle;
            }
            
            if (ws[`F${i}`]) ws[`F${i}`].s = { font: { sz: 10 }, fill: { fgColor: { rgb: bgColor } }, alignment: { horizontal: 'right' }, numFmt: '#,##0.00' };
        }
        
        worksheet.columns = [
            { width: 35 },
            { width: 20 },
            { width: 12 },
            { width: 12 },
            { width: 15 },
            { width: 15 }
        ];
        
    } else if (reporteActual === 'vencimientos') {
        const worksheet = workbook.addWorksheet('Vencimientos');
        
        worksheet.mergeCells('A1:F1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        
        worksheet.mergeCells('A2:F2');
        worksheet.getCell('A2').value = configFarmacia.direccion;
        worksheet.getCell('A2').font = { size: 11 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:F3');
        worksheet.getCell('A3').value = `Tel: ${configFarmacia.telefono} | NIT: ${configFarmacia.nit}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:F5');
        worksheet.getCell('A5').value = 'REPORTE DE VENCIMIENTOS';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' }
        };
        worksheet.getRow(5).height = 22;
        
        worksheet.mergeCells('A6:F6');
        worksheet.getCell('A6').value = `Alerta: Próximos ${datosReporte.diasAlerta} días`;
        worksheet.getCell('A6').font = { size: 10, italic: true, color: { argb: 'FFEA580C' } };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A7:F7');
        worksheet.getCell('A7').value = `Fecha: ${new Date().toLocaleDateString('es-BO')}`;
        worksheet.getCell('A7').font = { size: 9, italic: true };
        worksheet.getCell('A7').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A9:B9');
        worksheet.getCell('A9').value = 'RESUMEN';
        worksheet.getCell('A9').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A9').alignment = { horizontal: 'center' };
        worksheet.getCell('A9').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC2626' }
        };
        worksheet.getRow(9).height = 20;
        
        const resumenData = [
            ['Lotes Vencidos', datosReporte.resumen.lotes_vencidos || 0],
            ['Próximos a Vencer', datosReporte.resumen.lotes_proximos_vencer || 0],
            ['Unidades en Riesgo', datosReporte.resumen.unidades_proximas_vencer || 0],
            ['Valor en Riesgo', `Bs. ${parseFloat(datosReporte.resumen.valor_proximo_vencer || 0).toFixed(2)}`]
        ];
        
        resumenData.forEach((row, idx) => {
            const rowNum = 10 + idx;
            worksheet.getCell(`A${rowNum}`).value = row[0];
            worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
            worksheet.getCell(`A${rowNum}`).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEE2E2' }
            };
            worksheet.getCell(`B${rowNum}`).value = row[1];
            worksheet.getCell(`B${rowNum}`).font = { size: 10 };
            worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'right' };
        });
        
        worksheet.mergeCells('A15:F15');
        worksheet.getCell('A15').value = 'PRÓXIMOS A VENCER';
        worksheet.getCell('A15').font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A15').alignment = { horizontal: 'center' };
        worksheet.getCell('A15').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEA580C' }
        };
        worksheet.getRow(15).height = 20;
        
        const headerRow = worksheet.getRow(16);
        headerRow.values = ['Producto', 'Lote', 'Vencimiento', 'Días', 'Stock', 'Valor (Bs.)'];
        headerRow.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEA580C' }
        };
        headerRow.height = 18;
        
        datosReporte.proximosVencer.forEach((producto, idx) => {
            const rowNum = 17 + idx;
            const row = worksheet.getRow(rowNum);
            row.values = [
                producto.producto,
                producto.numero_lote,
                producto.fecha_vencimiento.split('T')[0],
                producto.dias_para_vencer,
                producto.stock_actual,
                parseFloat(producto.valor_stock || 0).toFixed(2)
            ];
            
            const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFFFF7ED';
            row.eachCell((cell, colNum) => {
                cell.font = { size: 10 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor }
                };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
                
                if (colNum === 2 || colNum === 3 || colNum === 5) cell.alignment = { horizontal: 'center' };
                if (colNum === 6) {
                    cell.alignment = { horizontal: 'right' };
                    cell.numFmt = '#,##0.00';
                }
                
                if (colNum === 4) {
                    cell.font = { size: 10, bold: true };
                    cell.alignment = { horizontal: 'center' };
                    const dias = parseInt(producto.dias_para_vencer);
                    if (dias <= 7) {
                        cell.font.color = { argb: 'FFDC2626' };
                    } else if (dias <= 30) {
                        cell.font.color = { argb: 'FFEA580C' };
                    } else {
                        cell.font.color = { argb: 'FFF59E0B' };
                    }
                }
            });
        });
        
        worksheet.columns = [
            { width: 35 },
            { width: 18 },
            { width: 15 },
            { width: 10 },
            { width: 10 },
            { width: 15 }
        ];
    } else if (reporteActual === 'productos-vendidos') {
        const worksheet = workbook.addWorksheet('Productos Más Vendidos');
        
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        worksheet.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        
        worksheet.mergeCells('A2:C2');
        worksheet.getCell('A2').value = `${configFarmacia.direccion} | ${configFarmacia.telefono}`;
        worksheet.getCell('A2').font = { size: 10 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:C3');
        worksheet.getCell('A3').value = `Período: ${formatearFecha(datosReporte.fechaInicio)} - ${formatearFecha(datosReporte.fechaFin)}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:C5');
        worksheet.getCell('A5').value = 'PRODUCTOS MÁS VENDIDOS';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        worksheet.getRow(5).height = 22;
        
        worksheet.mergeCells('A6:C6');
        worksheet.getCell('A6').value = `Total de productos: ${datosReporte.productosVendidos.length}`;
        worksheet.getCell('A6').font = { size: 10, italic: true };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A7:C7');
        worksheet.getCell('A7').value = `Fecha: ${new Date().toLocaleDateString('es-BO')}`;
        worksheet.getCell('A7').font = { size: 9, italic: true };
        worksheet.getCell('A7').alignment = { horizontal: 'center' };
        
        const headerRow = worksheet.getRow(9);
        headerRow.values = ['Producto', 'Cantidad Vendida', 'Total Ventas'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.height = 20;
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2980B9' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        datosReporte.productosVendidos.forEach((producto, idx) => {
            const row = worksheet.getRow(10 + idx);
            row.values = [
                producto.producto,
                producto.cantidad_vendida || 0,
                parseFloat(producto.total_ventas || 0)
            ];
            
            row.eachCell((cell, colNum) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                if (idx % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF5F5F5' }
                    };
                }
                
                if (colNum === 2) {
                    cell.alignment = { horizontal: 'center' };
                }
                
                if (colNum === 3) {
                    cell.numFmt = '#,##0.00';
                    cell.alignment = { horizontal: 'right' };
                }
            });
        });
        
        worksheet.columns = [
            { width: 50 },
            { width: 20 },
            { width: 20 }
        ];
    } else if (reporteActual === 'movimientos') {
        const worksheet = workbook.addWorksheet('Movimientos');
        
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = configFarmacia.nombre;
        worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 25;
        worksheet.getCell('A1').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        
        worksheet.mergeCells('A2:E2');
        worksheet.getCell('A2').value = `${configFarmacia.direccion} | ${configFarmacia.telefono}`;
        worksheet.getCell('A2').font = { size: 10 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:E3');
        worksheet.getCell('A3').value = `Período: ${formatearFecha(datosReporte.fechaInicio)} - ${formatearFecha(datosReporte.fechaFin)}`;
        worksheet.getCell('A3').font = { size: 10 };
        worksheet.getCell('A3').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A5:E5');
        worksheet.getCell('A5').value = 'MOVIMIENTOS DE INVENTARIO';
        worksheet.getCell('A5').font = { bold: true, size: 14, color: { argb: 'FF2980B9' } };
        worksheet.getCell('A5').alignment = { horizontal: 'center' };
        worksheet.getCell('A5').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6EAF8' }
        };
        worksheet.getRow(5).height = 22;
        
        const entradas = datosReporte.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'ENTRADA').length;
        const salidas = datosReporte.movimientos.filter(m => m.tipo && m.tipo.toUpperCase() === 'SALIDA').length;
        
        worksheet.mergeCells('A6:E6');
        worksheet.getCell('A6').value = `Total: ${datosReporte.movimientos.length} movimientos | Entradas: ${entradas} | Salidas: ${salidas}`;
        worksheet.getCell('A6').font = { size: 10, italic: true };
        worksheet.getCell('A6').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A7:E7');
        worksheet.getCell('A7').value = `Fecha: ${new Date().toLocaleDateString('es-BO')}`;
        worksheet.getCell('A7').font = { size: 9, italic: true };
        worksheet.getCell('A7').alignment = { horizontal: 'center' };
        
        const headerRow = worksheet.getRow(9);
        headerRow.values = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo'];
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.height = 20;
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2980B9' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        datosReporte.movimientos.forEach((movimiento, idx) => {
            const row = worksheet.getRow(10 + idx);
            row.values = [
                formatearFecha(movimiento.created_at),
                movimiento.producto_nombre || '-',
                movimiento.tipo ? movimiento.tipo.toUpperCase() : '-',
                movimiento.cantidad || 0,
                movimiento.motivo || '-'
            ];
            
            row.eachCell((cell, colNum) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                if (idx % 2 === 0) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF5F5F5' }
                    };
                }
                
                if (colNum === 1) {
                    cell.alignment = { horizontal: 'center' };
                }
                
                if (colNum === 3) {
                    cell.alignment = { horizontal: 'center' };
                    cell.font = { bold: true };
                    const tipoUpper = movimiento.tipo ? movimiento.tipo.toUpperCase() : '';
                    if (tipoUpper === 'ENTRADA') {
                        cell.font.color = { argb: 'FF16A34A' };
                    } else if (tipoUpper === 'SALIDA') {
                        cell.font.color = { argb: 'FFDC2626' };
                    }
                }
                
                if (colNum === 4) {
                    cell.alignment = { horizontal: 'center' };
                }
            });
        });
        
        worksheet.columns = [
            { width: 15 },
            { width: 40 },
            { width: 12 },
            { width: 12 },
            { width: 35 }
        ];
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `reporte_${reporteActual}_${fecha}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function descargarPDFModal() {
    if (!datosReporte) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    agregarEncabezadoPDF(doc);
    
    if (reporteActual === 'ventas') {
        generarPDFVentas(doc, datosReporte);
    } else if (reporteActual === 'inventario') {
        generarPDFInventario(doc, datosReporte);
    } else if (reporteActual === 'vencimientos') {
        generarPDFVencimientos(doc, datosReporte);
    }
    
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`reporte_${reporteActual}_${fecha}.pdf`);
}

function cerrarModalPDF() {
    document.getElementById('modalPDF').style.display = 'none';
}
