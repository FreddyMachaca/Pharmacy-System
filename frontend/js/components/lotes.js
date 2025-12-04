let lotesData = [];
let lotesFiltrados = [];
let productosParaLotes = [];
let filtroVencimiento = 'todos';
let paginaActualLotes = 1;
const itemsPorPaginaLotes = 10;

async function initLotes() {
    await cargarDatosLotes();
    renderLotesPage();
}

async function cargarDatosLotes() {
    try {
        const [lotesRes, productosRes] = await Promise.all([
            api.get('/productos/lotes'),
            api.get('/productos')
        ]);
        
        lotesData = lotesRes.data || [];
        productosParaLotes = productosRes.data || [];
        aplicarFiltrosLotes();
    } catch (error) {
        console.error('Error cargando lotes:', error);
        lotesData = [];
        lotesFiltrados = [];
    }
}

function aplicarFiltrosLotes() {
    const hoy = new Date();
    
    lotesFiltrados = lotesData.filter(l => {
        if (filtroVencimiento === 'todos') return true;
        
        const venc = new Date(l.fecha_vencimiento);
        const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
        
        switch (filtroVencimiento) {
            case 'vencidos':
                return dias < 0;
            case 'proximos':
                return dias >= 0 && dias <= 90;
            case 'vigentes':
                return dias > 90;
            default:
                return true;
        }
    });
}

function renderLotesPage() {
    const content = document.getElementById('pageContent');
    const stats = calcularStatsLotes();
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-calendar"></i>
                        Control de Lotes y Vencimientos
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-primary" onclick="abrirModalNuevoLote()">
                            <i class="pi pi-plus"></i>
                            <span>Nuevo Lote</span>
                        </button>
                    </div>
                </div>
                <div class="modulo-toolbar">
                    <div class="search-box">
                        <div class="search-input-wrapper">
                            <i class="pi pi-search"></i>
                            <input 
                                type="text" 
                                id="searchLote" 
                                placeholder="Buscar por producto o número de lote..."
                                onkeyup="filtrarLotes()"
                            >
                        </div>
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn ${filtroVencimiento === 'todos' ? 'active' : ''}" onclick="setFiltroVencimiento('todos')">
                            Todos
                        </button>
                        <button class="filter-btn filter-danger ${filtroVencimiento === 'vencidos' ? 'active' : ''}" onclick="setFiltroVencimiento('vencidos')">
                            <i class="pi pi-times-circle"></i> Vencidos
                        </button>
                        <button class="filter-btn filter-warning ${filtroVencimiento === 'proximos' ? 'active' : ''}" onclick="setFiltroVencimiento('proximos')">
                            <i class="pi pi-exclamation-triangle"></i> Próximos
                        </button>
                        <button class="filter-btn filter-success ${filtroVencimiento === 'vigentes' ? 'active' : ''}" onclick="setFiltroVencimiento('vigentes')">
                            <i class="pi pi-check-circle"></i> Vigentes
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-mini">
                    <div class="stat-mini-icon blue">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.total}</h4>
                        <span>Total Lotes</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon green">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.vigentes}</h4>
                        <span>Vigentes</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon orange">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.proximos}</h4>
                        <span>Próximos (90 días)</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon red">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.vencidos}</h4>
                        <span>Vencidos</span>
                    </div>
                </div>
            </div>
            
            <div class="productos-table-container">
                <div class="table-responsive">
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>N° Lote</th>
                                <th>Fabricación</th>
                                <th>Vencimiento</th>
                                <th>Días Rest.</th>
                                <th>Cantidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="lotesTableBody">
                            ${renderLotesRows()}
                        </tbody>
                    </table>
                </div>
                ${lotesFiltrados.length === 0 ? `
                    <div class="empty-state">
                        <i class="pi pi-calendar"></i>
                        <h3>No hay lotes</h3>
                        <p>No se encontraron lotes con los filtros actuales</p>
                    </div>
                ` : ''}
                ${renderPaginacionLotes()}
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderLotesRows() {
    if (lotesFiltrados.length === 0) return '';
    
    const hoy = new Date();
    const inicio = (paginaActualLotes - 1) * itemsPorPaginaLotes;
    const fin = inicio + itemsPorPaginaLotes;
    const lotesPaginados = lotesFiltrados.slice(inicio, fin);
    
    return lotesPaginados.map(l => {
        const venc = new Date(l.fecha_vencimiento);
        const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
        
        let estadoClass = 'badge-success';
        let estadoText = 'Vigente';
        let diasClass = 'vencimiento-ok';
        
        if (dias < 0) {
            estadoClass = 'badge-danger';
            estadoText = 'Vencido';
            diasClass = 'vencimiento-vencido';
        } else if (dias <= 90) {
            estadoClass = 'badge-warning';
            estadoText = 'Próximo';
            diasClass = 'vencimiento-proximo';
        }
        
        return `
            <tr>
                <td>
                    <div class="producto-nombre">${escapeHtml(l.producto_nombre || 'N/A')}</div>
                </td>
                <td><strong>${escapeHtml(l.numero_lote)}</strong></td>
                <td>${l.fecha_fabricacion ? formatDateLotes(l.fecha_fabricacion) : '-'}</td>
                <td class="${diasClass}">${formatDateLotes(l.fecha_vencimiento)}</td>
                <td class="${diasClass}">
                    <strong>${dias < 0 ? dias : '+' + dias}</strong> días
                </td>
                <td>
                    <span class="stock-cell ${l.cantidad_actual <= 0 ? 'stock-sin' : 'stock-ok'}">
                        ${l.cantidad_actual}
                    </span>
                </td>
                <td>
                    <span class="badge ${estadoClass}">${estadoText}</span>
                </td>
                <td>
                    <div class="acciones-cell">
                        <button class="btn-table btn-table-edit" onclick="editarLote(${l.id})" title="Editar">
                            <i class="pi pi-pencil"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function calcularStatsLotes() {
    const hoy = new Date();
    
    return {
        total: lotesData.length,
        vigentes: lotesData.filter(l => {
            const dias = Math.ceil((new Date(l.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
            return dias > 90;
        }).length,
        proximos: lotesData.filter(l => {
            const dias = Math.ceil((new Date(l.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
            return dias >= 0 && dias <= 90;
        }).length,
        vencidos: lotesData.filter(l => {
            const dias = Math.ceil((new Date(l.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
            return dias < 0;
        }).length
    };
}

function filtrarLotes() {
    const termino = document.getElementById('searchLote').value.toLowerCase().trim();
    
    aplicarFiltrosLotes();
    
    if (termino) {
        lotesFiltrados = lotesFiltrados.filter(l => {
            return (l.producto_nombre && l.producto_nombre.toLowerCase().includes(termino)) ||
                   l.numero_lote.toLowerCase().includes(termino);
        });
    }
    
    paginaActualLotes = 1;
    document.getElementById('lotesTableBody').innerHTML = renderLotesRows();
    const paginacionEl = document.querySelector('.table-pagination');
    if (paginacionEl) paginacionEl.outerHTML = renderPaginacionLotes();
}

function renderPaginacionLotes() {
    const totalPaginas = Math.ceil(lotesFiltrados.length / itemsPorPaginaLotes);
    const inicio = (paginaActualLotes - 1) * itemsPorPaginaLotes + 1;
    const fin = Math.min(paginaActualLotes * itemsPorPaginaLotes, lotesFiltrados.length);
    
    if (lotesFiltrados.length === 0) {
        return '';
    }
    
    let paginas = '';
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualLotes - 1 && i <= paginaActualLotes + 1)) {
            paginas += `<button class="pagination-btn ${i === paginaActualLotes ? 'active' : ''}" onclick="cambiarPaginaLotes(${i})">${i}</button>`;
        } else if (i === paginaActualLotes - 2 || i === paginaActualLotes + 2) {
            paginas += `<span class="pagination-dots">...</span>`;
        }
    }
    
    return `
        <div class="table-pagination">
            <div class="pagination-info">
                Mostrando ${inicio}-${fin} de ${lotesFiltrados.length} lotes
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="cambiarPaginaLotes(${paginaActualLotes - 1})" ${paginaActualLotes === 1 ? 'disabled' : ''}>
                    <i class="pi pi-angle-left"></i>
                </button>
                ${paginas}
                <button class="pagination-btn" onclick="cambiarPaginaLotes(${paginaActualLotes + 1})" ${paginaActualLotes === totalPaginas ? 'disabled' : ''}>
                    <i class="pi pi-angle-right"></i>
                </button>
            </div>
        </div>
    `;
}

function cambiarPaginaLotes(pagina) {
    const totalPaginas = Math.ceil(lotesFiltrados.length / itemsPorPaginaLotes);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaActualLotes = pagina;
    document.getElementById('lotesTableBody').innerHTML = renderLotesRows();
    document.querySelector('.table-pagination').outerHTML = renderPaginacionLotes();
}

function setFiltroVencimiento(filtro) {
    filtroVencimiento = filtro;
    paginaActualLotes = 1;
    aplicarFiltrosLotes();
    renderLotesPage();
}

function abrirModalNuevoLote() {
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalLotes(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-calendar-plus"></i>
                        Nuevo Lote
                    </h2>
                    <button class="modal-close" onclick="cerrarModalLotes()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formNuevoLote" onsubmit="guardarNuevoLote(event)">
                        <div class="form-group">
                            <label class="form-label">Producto <span class="required">*</span></label>
                            <select class="form-control" id="lote_producto_id" required>
                                <option value="">Seleccionar producto</option>
                                ${productosParaLotes.map(p => `
                                    <option value="${p.id}">${escapeHtml(p.nombre)}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Número de Lote <span class="required">*</span></label>
                            <input type="text" class="form-control" id="lote_numero" required
                                placeholder="Ej: LOT-2025-001">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Fecha de Fabricación</label>
                                <input type="date" class="form-control" id="lote_fabricacion">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha de Vencimiento <span class="required">*</span></label>
                                <input type="date" class="form-control" id="lote_vencimiento" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Cantidad <span class="required">*</span></label>
                                <input type="number" class="form-control" id="lote_cantidad" 
                                    min="1" required placeholder="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Precio de Compra (Bs.)</label>
                                <input type="number" class="form-control" id="lote_precio" 
                                    step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalLotes()">
                        Cancelar
                    </button>
                    <button type="submit" form="formNuevoLote" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarNuevoLote(e) {
    e.preventDefault();
    
    const datos = {
        producto_id: document.getElementById('lote_producto_id').value,
        numero_lote: document.getElementById('lote_numero').value.trim(),
        fecha_fabricacion: document.getElementById('lote_fabricacion').value || null,
        fecha_vencimiento: document.getElementById('lote_vencimiento').value,
        cantidad_inicial: parseInt(document.getElementById('lote_cantidad').value),
        precio_compra: parseFloat(document.getElementById('lote_precio').value) || null
    };
    
    try {
        const res = await api.post('/productos/lotes', datos);
        if (res.success) {
            cerrarModalLotes();
            await cargarDatosLotes();
            renderLotesPage();
            mostrarNotificacion('Lote creado correctamente', 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar lote', 'error');
    }
}

async function editarLote(id) {
    const lote = lotesData.find(l => l.id === id);
    if (!lote) return;
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalLotes(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-pencil"></i>
                        Editar Lote
                    </h2>
                    <button class="modal-close" onclick="cerrarModalLotes()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="info-box">
                        <strong>Producto:</strong> ${escapeHtml(lote.producto_nombre || 'N/A')}<br>
                        <strong>Lote:</strong> ${escapeHtml(lote.numero_lote)}
                    </div>
                    <form id="formEditLote" onsubmit="actualizarLote(event, ${id})">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Fecha de Vencimiento <span class="required">*</span></label>
                                <input type="date" class="form-control" id="edit_lote_vencimiento" required
                                    value="${lote.fecha_vencimiento ? lote.fecha_vencimiento.split('T')[0] : ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cantidad Actual</label>
                                <input type="number" class="form-control" id="edit_lote_cantidad" 
                                    min="0" value="${lote.cantidad_actual}">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalLotes()">
                        Cancelar
                    </button>
                    <button type="submit" form="formEditLote" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        Actualizar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function actualizarLote(e, id) {
    e.preventDefault();
    
    const datos = {
        fecha_vencimiento: document.getElementById('edit_lote_vencimiento').value,
        cantidad_actual: parseInt(document.getElementById('edit_lote_cantidad').value)
    };
    
    try {
        const res = await api.put(`/productos/lotes/${id}`, datos);
        if (res.success) {
            cerrarModalLotes();
            await cargarDatosLotes();
            renderLotesPage();
            mostrarNotificacion('Lote actualizado', 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al actualizar lote', 'error');
    }
}

function cerrarModalLotes(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
}

function formatDateLotes(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.initLotes = initLotes;
window.filtrarLotes = filtrarLotes;
window.setFiltroVencimiento = setFiltroVencimiento;
window.abrirModalNuevoLote = abrirModalNuevoLote;
window.guardarNuevoLote = guardarNuevoLote;
window.editarLote = editarLote;
window.actualizarLote = actualizarLote;
window.cerrarModalLotes = cerrarModalLotes;
window.cambiarPaginaLotes = cambiarPaginaLotes;
