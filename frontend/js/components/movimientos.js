let movimientosData = [];
let movimientosFiltrados = [];
let productosParaMovimientos = [];
let filtroTipoMovimiento = 'todos';

async function initMovimientos() {
    await cargarDatosMovimientos();
    renderMovimientosPage();
}

async function cargarDatosMovimientos() {
    try {
        const [movimientosRes, productosRes] = await Promise.all([
            api.get('/productos/movimientos'),
            api.get('/productos')
        ]);
        
        movimientosData = movimientosRes.data || [];
        productosParaMovimientos = productosRes.data || [];
        aplicarFiltrosMovimientos();
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        movimientosData = [];
        movimientosFiltrados = [];
    }
}

function aplicarFiltrosMovimientos() {
    movimientosFiltrados = movimientosData.filter(m => {
        if (filtroTipoMovimiento === 'todos') return true;
        return m.tipo === filtroTipoMovimiento;
    });
}

function renderMovimientosPage() {
    const content = document.getElementById('pageContent');
    const stats = calcularStatsMovimientos();
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-arrows-h"></i>
                        Movimientos de Inventario
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-success" onclick="abrirModalMovimiento('entrada')">
                            <i class="pi pi-arrow-down"></i>
                            <span>Entrada</span>
                        </button>
                        <button class="btn btn-danger" onclick="abrirModalMovimiento('salida')">
                            <i class="pi pi-arrow-up"></i>
                            <span>Salida</span>
                        </button>
                    </div>
                </div>
                <div class="search-box">
                    <div class="search-input-wrapper">
                        <i class="pi pi-search"></i>
                        <input 
                            type="text" 
                            id="searchMovimiento" 
                            placeholder="Buscar por producto o motivo..."
                            onkeyup="filtrarMovimientos()"
                        >
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn ${filtroTipoMovimiento === 'todos' ? 'active' : ''}" onclick="setFiltroTipoMovimiento('todos')">
                            Todos
                        </button>
                        <button class="filter-btn filter-success ${filtroTipoMovimiento === 'entrada' ? 'active' : ''}" onclick="setFiltroTipoMovimiento('entrada')">
                            <i class="pi pi-arrow-down"></i> Entradas
                        </button>
                        <button class="filter-btn filter-danger ${filtroTipoMovimiento === 'salida' ? 'active' : ''}" onclick="setFiltroTipoMovimiento('salida')">
                            <i class="pi pi-arrow-up"></i> Salidas
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-mini">
                    <div class="stat-mini-icon blue">
                        <i class="pi pi-list"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.total}</h4>
                        <span>Total Movimientos</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon green">
                        <i class="pi pi-arrow-down"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.entradas}</h4>
                        <span>Entradas</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon red">
                        <i class="pi pi-arrow-up"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.salidas}</h4>
                        <span>Salidas</span>
                    </div>
                </div>
            </div>
            
            <div class="productos-table-container">
                <div class="table-responsive">
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Producto</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Stock Ant.</th>
                                <th>Stock Act.</th>
                                <th>Motivo</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody id="movimientosTableBody">
                            ${renderMovimientosRows()}
                        </tbody>
                    </table>
                </div>
                ${movimientosFiltrados.length === 0 ? `
                    <div class="empty-state">
                        <i class="pi pi-arrows-h"></i>
                        <h3>No hay movimientos</h3>
                        <p>No se encontraron movimientos con los filtros actuales</p>
                    </div>
                ` : ''}
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderMovimientosRows() {
    if (movimientosFiltrados.length === 0) return '';
    
    return movimientosFiltrados.map(m => {
        let tipoBadge = 'badge-info';
        let tipoIcon = 'pi-sync';
        let tipoText = 'Ajuste';
        
        if (m.tipo === 'entrada') {
            tipoBadge = 'badge-success';
            tipoIcon = 'pi-arrow-down';
            tipoText = 'Entrada';
        } else if (m.tipo === 'salida') {
            tipoBadge = 'badge-danger';
            tipoIcon = 'pi-arrow-up';
            tipoText = 'Salida';
        }
        
        return `
            <tr>
                <td>
                    <div class="fecha-cell">
                        ${formatDateTimeMovimientos(m.created_at)}
                    </div>
                </td>
                <td>
                    <div class="producto-nombre">${escapeHtml(m.producto_nombre || 'N/A')}</div>
                </td>
                <td>
                    <span class="badge ${tipoBadge}">
                        <i class="pi ${tipoIcon}"></i> ${tipoText}
                    </span>
                </td>
                <td>
                    <strong class="${m.tipo === 'entrada' ? 'text-success' : m.tipo === 'salida' ? 'text-danger' : ''}">
                        ${m.tipo === 'entrada' ? '+' : m.tipo === 'salida' ? '-' : ''}${m.cantidad}
                    </strong>
                </td>
                <td>${m.stock_anterior}</td>
                <td><strong>${m.stock_nuevo}</strong></td>
                <td>${m.motivo ? escapeHtml(m.motivo) : '-'}</td>
                <td>${m.usuario_nombre || 'Sistema'}</td>
            </tr>
        `;
    }).join('');
}

function calcularStatsMovimientos() {
    return {
        total: movimientosData.length,
        entradas: movimientosData.filter(m => m.tipo === 'entrada').length,
        salidas: movimientosData.filter(m => m.tipo === 'salida').length,
        ajustes: movimientosData.filter(m => m.tipo === 'ajuste').length
    };
}

function filtrarMovimientos() {
    const termino = document.getElementById('searchMovimiento').value.toLowerCase().trim();
    
    aplicarFiltrosMovimientos();
    
    if (termino) {
        movimientosFiltrados = movimientosFiltrados.filter(m => {
            return (m.producto_nombre && m.producto_nombre.toLowerCase().includes(termino)) ||
                   (m.motivo && m.motivo.toLowerCase().includes(termino));
        });
    }
    
    document.getElementById('movimientosTableBody').innerHTML = renderMovimientosRows();
}

function setFiltroTipoMovimiento(filtro) {
    filtroTipoMovimiento = filtro;
    aplicarFiltrosMovimientos();
    renderMovimientosPage();
}

function abrirModalMovimiento(tipo) {
    const esEntrada = tipo === 'entrada';
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalMovimientos(event, true)">
            <div class="modal">
                <div class="modal-header ${esEntrada ? 'modal-header-success' : 'modal-header-danger'}">
                    <h2 class="modal-title">
                        <i class="pi pi-arrow-${esEntrada ? 'down' : 'up'}"></i>
                        ${esEntrada ? 'Entrada de Inventario' : 'Salida de Inventario'}
                    </h2>
                    <button class="modal-close" onclick="cerrarModalMovimientos()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formMovimiento" onsubmit="guardarMovimiento(event, '${tipo}')">
                        <div class="form-group">
                            <label class="form-label">Producto <span class="required">*</span></label>
                            <select class="form-control" id="mov_producto_id" required onchange="mostrarStockActual()">
                                <option value="">Seleccionar producto</option>
                                ${productosParaMovimientos.map(p => `
                                    <option value="${p.id}" data-stock="${p.stock_actual}">
                                        ${escapeHtml(p.nombre)} (Stock: ${p.stock_actual})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div id="stockInfo" class="info-box hidden">
                            Stock actual: <strong id="stockActualDisplay">0</strong> unidades
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Cantidad <span class="required">*</span></label>
                            <input type="number" class="form-control" id="mov_cantidad" 
                                min="1" required placeholder="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Motivo</label>
                            <select class="form-control" id="mov_motivo_select" onchange="toggleMotivoOtro()">
                                ${esEntrada ? `
                                    <option value="Compra">Compra</option>
                                    <option value="Devolución de cliente">Devolución de cliente</option>
                                    <option value="Ajuste de inventario">Ajuste de inventario</option>
                                    <option value="Transferencia">Transferencia</option>
                                ` : `
                                    <option value="Venta">Venta</option>
                                    <option value="Devolución a proveedor">Devolución a proveedor</option>
                                    <option value="Producto vencido">Producto vencido</option>
                                    <option value="Producto dañado">Producto dañado</option>
                                    <option value="Ajuste de inventario">Ajuste de inventario</option>
                                `}
                                <option value="otro">Otro...</option>
                            </select>
                        </div>
                        
                        <div class="form-group hidden" id="motivoOtroGroup">
                            <label class="form-label">Especifique el motivo</label>
                            <input type="text" class="form-control" id="mov_motivo_otro" 
                                placeholder="Escriba el motivo">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Observaciones</label>
                            <textarea class="form-control" id="mov_observaciones" rows="2"
                                placeholder="Observaciones adicionales (opcional)"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalMovimientos()">
                        Cancelar
                    </button>
                    <button type="submit" form="formMovimiento" class="btn ${esEntrada ? 'btn-success' : 'btn-danger'}">
                        <i class="pi pi-check"></i>
                        Registrar ${esEntrada ? 'Entrada' : 'Salida'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

function mostrarStockActual() {
    const select = document.getElementById('mov_producto_id');
    const option = select.options[select.selectedIndex];
    const stockInfo = document.getElementById('stockInfo');
    const stockDisplay = document.getElementById('stockActualDisplay');
    
    if (option.value) {
        stockDisplay.textContent = option.dataset.stock;
        stockInfo.classList.remove('hidden');
    } else {
        stockInfo.classList.add('hidden');
    }
}

function toggleMotivoOtro() {
    const select = document.getElementById('mov_motivo_select');
    const otroGroup = document.getElementById('motivoOtroGroup');
    
    if (select.value === 'otro') {
        otroGroup.classList.remove('hidden');
    } else {
        otroGroup.classList.add('hidden');
    }
}

async function guardarMovimiento(e, tipo) {
    e.preventDefault();
    
    let motivo = document.getElementById('mov_motivo_select').value;
    if (motivo === 'otro') {
        motivo = document.getElementById('mov_motivo_otro').value.trim();
    }
    
    const observaciones = document.getElementById('mov_observaciones').value.trim();
    if (observaciones) {
        motivo += ` - ${observaciones}`;
    }
    
    const datos = {
        producto_id: document.getElementById('mov_producto_id').value,
        tipo: tipo,
        cantidad: parseInt(document.getElementById('mov_cantidad').value),
        motivo: motivo
    };
    
    try {
        const res = await api.post('/productos/movimientos', datos);
        if (res.success) {
            cerrarModalMovimientos();
            await cargarDatosMovimientos();
            renderMovimientosPage();
            mostrarNotificacion(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`, 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al registrar movimiento', 'error');
    }
}

function cerrarModalMovimientos(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
}

function formatDateTimeMovimientos(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-BO', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

window.initMovimientos = initMovimientos;
window.filtrarMovimientos = filtrarMovimientos;
window.setFiltroTipoMovimiento = setFiltroTipoMovimiento;
window.abrirModalMovimiento = abrirModalMovimiento;
window.mostrarStockActual = mostrarStockActual;
window.toggleMotivoOtro = toggleMotivoOtro;
window.guardarMovimiento = guardarMovimiento;
window.cerrarModalMovimientos = cerrarModalMovimientos;
