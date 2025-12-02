let ventasData = [];
let ventasFiltradas = [];
let paginaActualVentas = 1;
const itemsPorPaginaVentas = 15;

async function initHistorialVentas() {
    await cargarVentas();
    renderHistorialVentasPage();
}

async function cargarVentas() {
    try {
        const res = await api.get('/ventas');
        ventasData = res.data || [];
        ventasFiltradas = [...ventasData];
    } catch (error) {
        console.error('Error cargando ventas:', error);
        ventasData = [];
        ventasFiltradas = [];
    }
}

function renderHistorialVentasPage() {
    const content = document.getElementById('pageContent');
    const stats = calcularStatsVentas();
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-list"></i>
                        Historial de Ventas
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-primary" onclick="window.location.hash='punto-venta'; renderPageContent('punto-venta');">
                            <i class="pi pi-shopping-cart"></i>
                            <span>Nueva Venta</span>
                        </button>
                    </div>
                </div>
                <div class="search-box">
                    <div class="search-input-wrapper">
                        <i class="pi pi-search"></i>
                        <input type="text" id="searchVenta" placeholder="Buscar por número o cliente..." onkeyup="filtrarVentas()">
                    </div>
                    <div class="filtros-fecha">
                        <input type="date" id="fechaInicio" onchange="filtrarVentasPorFecha()">
                        <span>-</span>
                        <input type="date" id="fechaFin" onchange="filtrarVentasPorFecha()">
                    </div>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-mini">
                    <div class="stat-mini-icon blue">
                        <i class="pi pi-shopping-cart"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.total}</h4>
                        <span>Total Ventas</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon green">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>Bs. ${formatNumber(stats.ingresos)}</h4>
                        <span>Ingresos</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon purple">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.completadas}</h4>
                        <span>Completadas</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon red">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.anuladas}</h4>
                        <span>Anuladas</span>
                    </div>
                </div>
            </div>
            
            <div class="productos-table-container">
                <div class="table-responsive">
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>N° Venta</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Método Pago</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="ventasTableBody">
                            ${renderVentasRows()}
                        </tbody>
                    </table>
                </div>
                ${ventasFiltradas.length === 0 ? `
                    <div class="empty-state">
                        <i class="pi pi-shopping-cart"></i>
                        <h3>No hay ventas</h3>
                        <p>No se encontraron ventas con los filtros actuales</p>
                    </div>
                ` : ''}
                ${renderPaginacionVentas()}
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderVentasRows() {
    if (ventasFiltradas.length === 0) return '';
    
    const inicio = (paginaActualVentas - 1) * itemsPorPaginaVentas;
    const fin = inicio + itemsPorPaginaVentas;
    const ventasPaginadas = ventasFiltradas.slice(inicio, fin);
    
    return ventasPaginadas.map(v => `
        <tr>
            <td><strong>${v.numero_venta}</strong></td>
            <td>${formatDateTimeVentas(v.fecha_venta)}</td>
            <td>${v.cliente_nombre ? `${v.cliente_nombre} ${v.cliente_apellido || ''}` : '<span class="text-muted">Sin Cliente</span>'}</td>
            <td class="precio-cell"><strong>Bs. ${formatNumber(v.total)}</strong></td>
            <td>
                <span class="badge badge-info">${v.metodo_pago}</span>
            </td>
            <td>
                ${v.estado === 'Completada' 
                    ? '<span class="badge badge-success">Completada</span>'
                    : '<span class="badge badge-danger">Anulada</span>'}
            </td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-table btn-table-view" onclick="verDetalleVenta(${v.id})" title="Ver detalle">
                        <i class="pi pi-eye"></i>
                    </button>
                    ${v.estado === 'Completada' ? `
                        <button class="btn-table btn-table-delete" onclick="anularVenta(${v.id})" title="Anular">
                            <i class="pi pi-ban"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function calcularStatsVentas() {
    return {
        total: ventasData.length,
        ingresos: ventasData.filter(v => v.estado === 'Completada').reduce((sum, v) => sum + parseFloat(v.total), 0),
        completadas: ventasData.filter(v => v.estado === 'Completada').length,
        anuladas: ventasData.filter(v => v.estado === 'Anulada').length
    };
}

function filtrarVentas() {
    const termino = document.getElementById('searchVenta').value.toLowerCase().trim();
    
    ventasFiltradas = ventasData.filter(v => {
        return v.numero_venta.toLowerCase().includes(termino) ||
               (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(termino));
    });
    
    paginaActualVentas = 1;
    document.getElementById('ventasTableBody').innerHTML = renderVentasRows();
    actualizarPaginacionVentas();
}

function filtrarVentasPorFecha() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    ventasFiltradas = ventasData.filter(v => {
        const fechaVenta = v.fecha_venta.split('T')[0];
        if (fechaInicio && fechaVenta < fechaInicio) return false;
        if (fechaFin && fechaVenta > fechaFin) return false;
        return true;
    });
    
    paginaActualVentas = 1;
    document.getElementById('ventasTableBody').innerHTML = renderVentasRows();
    actualizarPaginacionVentas();
}

async function verDetalleVenta(id) {
    try {
        const res = await api.get(`/ventas/${id}`);
        const venta = res.data;
        
        const modal = `
            <div class="modal-overlay" onclick="cerrarModalVentas(event, true)">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h2 class="modal-title"><i class="pi pi-file"></i> Detalle de Venta</h2>
                        <button class="modal-close" onclick="cerrarModalVentas()"><i class="pi pi-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="detalle-venta-header">
                            <div class="detalle-info">
                                <p><strong>N° Venta:</strong> ${venta.numero_venta}</p>
                                <p><strong>Fecha:</strong> ${formatDateTimeVentas(venta.fecha_venta)}</p>
                                <p><strong>Cliente:</strong> ${venta.cliente_nombre ? `${venta.cliente_nombre} ${venta.cliente_apellido || ''}` : 'Sin Cliente'}</p>
                                <p><strong>Vendedor:</strong> ${venta.usuario_nombre}</p>
                            </div>
                            <div class="detalle-estado">
                                <span class="badge ${venta.estado === 'Completada' ? 'badge-success' : 'badge-danger'} badge-lg">
                                    ${venta.estado}
                                </span>
                            </div>
                        </div>
                        <div id="ticketHistorial" style="display:none;">
                            <div class="ticket-header">
                                <h3>FARMACIA</h3>
                                <p>Venta #${venta.numero_venta}</p>
                                <p>${formatDateTimeVentas(venta.fecha_venta)}</p>
                                ${venta.cliente_nombre ? `<p>Cliente: ${venta.cliente_nombre} ${venta.cliente_apellido || ''}</p>` : ''}
                            </div>
                            <div class="ticket-items">
                                ${venta.detalles.map(d => `
                                    <div class="ticket-item">
                                        <span>${d.cantidad}x ${d.producto_nombre}</span>
                                        <span>Bs. ${formatNumber(d.subtotal)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="ticket-totals">
                                <div class="ticket-row"><span>Subtotal:</span><span>Bs. ${formatNumber(venta.subtotal)}</span></div>
                                ${venta.descuento > 0 ? `<div class="ticket-row"><span>Descuento:</span><span>-Bs. ${formatNumber(venta.descuento)}</span></div>` : ''}
                                <div class="ticket-row total"><span>TOTAL:</span><span>Bs. ${formatNumber(venta.total)}</span></div>
                                <div class="ticket-row"><span>Método:</span><span>${venta.metodo_pago}</span></div>
                            </div>
                            <div class="ticket-footer">
                                <p>¡Gracias por su compra!</p>
                            </div>
                        </div>
                        <table class="productos-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>P. Unitario</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${venta.detalles.map(d => `
                                    <tr>
                                        <td>${d.producto_nombre}</td>
                                        <td>${d.cantidad}</td>
                                        <td>Bs. ${formatNumber(d.precio_unitario)}</td>
                                        <td>Bs. ${formatNumber(d.subtotal)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="detalle-totales">
                            <p><span>Subtotal:</span> <strong>Bs. ${formatNumber(venta.subtotal)}</strong></p>
                            ${venta.descuento > 0 ? `<p><span>Descuento:</span> <strong>-Bs. ${formatNumber(venta.descuento)}</strong></p>` : ''}
                            <p class="total-final"><span>TOTAL:</span> <strong>Bs. ${formatNumber(venta.total)}</strong></p>
                            <p><span>Método de Pago:</span> <strong>${venta.metodo_pago}</strong></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="cerrarModalVentas()">Cerrar</button>
                        <button class="btn btn-primary" onclick="imprimirTicketHistorial()">
                            <i class="pi pi-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modalContainer').innerHTML = modal;
    } catch (error) {
        mostrarNotificacion('Error al cargar detalle', 'error');
    }
}

async function anularVenta(id) {
    if (!confirm('¿Está seguro de anular esta venta? El stock será restaurado.')) return;
    
    try {
        const res = await api.patch(`/ventas/${id}/anular`);
        if (res.success) {
            await cargarVentas();
            renderHistorialVentasPage();
            mostrarNotificacion('Venta anulada correctamente', 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al anular venta', 'error');
    }
}

function renderPaginacionVentas() {
    const totalPaginas = Math.ceil(ventasFiltradas.length / itemsPorPaginaVentas);
    if (ventasFiltradas.length === 0) return '';
    
    const inicio = (paginaActualVentas - 1) * itemsPorPaginaVentas + 1;
    const fin = Math.min(paginaActualVentas * itemsPorPaginaVentas, ventasFiltradas.length);
    
    let paginas = '';
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualVentas - 1 && i <= paginaActualVentas + 1)) {
            paginas += `<button class="pagination-btn ${i === paginaActualVentas ? 'active' : ''}" onclick="cambiarPaginaVentas(${i})">${i}</button>`;
        } else if (i === paginaActualVentas - 2 || i === paginaActualVentas + 2) {
            paginas += `<span class="pagination-dots">...</span>`;
        }
    }
    
    return `
        <div class="table-pagination">
            <div class="pagination-info">Mostrando ${inicio}-${fin} de ${ventasFiltradas.length} ventas</div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="cambiarPaginaVentas(${paginaActualVentas - 1})" ${paginaActualVentas === 1 ? 'disabled' : ''}>
                    <i class="pi pi-angle-left"></i>
                </button>
                ${paginas}
                <button class="pagination-btn" onclick="cambiarPaginaVentas(${paginaActualVentas + 1})" ${paginaActualVentas === totalPaginas ? 'disabled' : ''}>
                    <i class="pi pi-angle-right"></i>
                </button>
            </div>
        </div>
    `;
}

function cambiarPaginaVentas(pagina) {
    const totalPaginas = Math.ceil(ventasFiltradas.length / itemsPorPaginaVentas);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaActualVentas = pagina;
    document.getElementById('ventasTableBody').innerHTML = renderVentasRows();
    actualizarPaginacionVentas();
}

function actualizarPaginacionVentas() {
    const paginacionEl = document.querySelector('.table-pagination');
    if (paginacionEl) paginacionEl.outerHTML = renderPaginacionVentas();
}

function cerrarModalVentas(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
}

function imprimirTicketHistorial() {
    const ticket = document.getElementById('ticketHistorial');
    const contenido = ticket.innerHTML;
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Ticket</title>
            <style>
                @page { 
                    size: 80mm auto; 
                    margin: 0; 
                }
                @media print {
                    html, body { 
                        margin: 0; 
                        padding: 5mm;
                    }
                }
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; width: 80mm; }
                .ticket-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-header h3 { margin: 0 0 5px 0; font-size: 16px; }
                .ticket-header p { margin: 2px 0; }
                .ticket-item { display: flex; justify-content: space-between; margin: 5px 0; }
                .ticket-items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-row { display: flex; justify-content: space-between; margin: 3px 0; }
                .ticket-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                .ticket-footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
                .ticket-totals { margin-top: 10px; }
            </style>
        </head>
        <body>${contenido}</body>
        </html>
    `);
    doc.close();
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
}

function formatDateTimeVentas(dateStr) {
    if (!dateStr) return '-';
    const formatter = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(new Date(dateStr));
}

window.initHistorialVentas = initHistorialVentas;
window.filtrarVentas = filtrarVentas;
window.filtrarVentasPorFecha = filtrarVentasPorFecha;
window.verDetalleVenta = verDetalleVenta;
window.anularVenta = anularVenta;
window.cambiarPaginaVentas = cambiarPaginaVentas;
window.cerrarModalVentas = cerrarModalVentas;
window.imprimirTicketHistorial = imprimirTicketHistorial;
