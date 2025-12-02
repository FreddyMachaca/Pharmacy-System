let clientesData = [];
let clientesFiltrados = [];
let clienteEditando = null;
let mostrarClientesInactivos = false;
let paginaActualClientes = 1;
const itemsPorPaginaClientes = 10;

async function initClientes() {
    await cargarClientes();
    renderClientesPage();
}

async function cargarClientes() {
    try {
        const url = mostrarClientesInactivos ? '/ventas/clientes?inactivos=true' : '/ventas/clientes';
        const res = await api.get(url);
        clientesData = res.data || [];
        clientesFiltrados = [...clientesData];
    } catch (error) {
        console.error('Error cargando clientes:', error);
        clientesData = [];
        clientesFiltrados = [];
    }
}

function renderClientesPage() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-users"></i>
                        Gestión de Clientes
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-primary" onclick="abrirModalCliente()">
                            <i class="pi pi-plus"></i>
                            <span>Nuevo Cliente</span>
                        </button>
                    </div>
                </div>
                <div class="search-box">
                    <div class="search-input-wrapper">
                        <i class="pi pi-search"></i>
                        <input type="text" id="searchCliente" placeholder="Buscar por nombre, documento o teléfono..." onkeyup="filtrarClientes()">
                    </div>
                    <label class="filter-toggle ${mostrarClientesInactivos ? 'active' : ''}">
                        <input type="checkbox" ${mostrarClientesInactivos ? 'checked' : ''} onchange="toggleClientesInactivos(this.checked)">
                        <i class="pi pi-eye${mostrarClientesInactivos ? '' : '-slash'}"></i>
                        <span>Inactivos</span>
                    </label>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-mini">
                    <div class="stat-mini-icon blue">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${clientesData.filter(c => c.activo).length}</h4>
                        <span>Clientes Activos</span>
                    </div>
                </div>
            </div>
            
            <div class="productos-table-container">
                <div class="table-responsive">
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Documento</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Ciudad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="clientesTableBody">
                            ${renderClientesRows()}
                        </tbody>
                    </table>
                </div>
                ${clientesFiltrados.length === 0 ? `
                    <div class="empty-state">
                        <i class="pi pi-users"></i>
                        <h3>No hay clientes</h3>
                        <p>No se encontraron clientes con los filtros actuales</p>
                    </div>
                ` : ''}
                ${renderPaginacionClientes()}
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderClientesRows() {
    if (clientesFiltrados.length === 0) return '';
    
    const inicio = (paginaActualClientes - 1) * itemsPorPaginaClientes;
    const fin = inicio + itemsPorPaginaClientes;
    const clientesPaginados = clientesFiltrados.slice(inicio, fin);
    
    return clientesPaginados.map(c => `
        <tr class="${!c.activo ? 'row-inactive' : ''}">
            <td>
                <div class="producto-nombre">${escapeHtml(c.nombre)} ${escapeHtml(c.apellido || '')}</div>
            </td>
            <td>
                ${c.numero_documento ? `<span class="badge badge-secondary">${c.tipo_documento}: ${c.numero_documento}</span>` : '-'}
            </td>
            <td>${c.telefono || '-'}</td>
            <td>${c.correo || '-'}</td>
            <td>${c.ciudad || '-'}</td>
            <td>
                ${c.activo 
                    ? '<span class="badge badge-success">Activo</span>' 
                    : '<span class="badge badge-secondary">Inactivo</span>'}
            </td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-table btn-table-edit" onclick="editarCliente(${c.id})" title="Editar">
                        <i class="pi pi-pencil"></i>
                    </button>
                    ${c.activo 
                        ? `<button class="btn-table btn-table-delete" onclick="desactivarCliente(${c.id})" title="Desactivar">
                            <i class="pi pi-ban"></i>
                           </button>`
                        : `<button class="btn-table btn-table-restore" onclick="activarCliente(${c.id})" title="Activar">
                            <i class="pi pi-check"></i>
                           </button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

function filtrarClientes() {
    const termino = document.getElementById('searchCliente').value.toLowerCase().trim();
    
    clientesFiltrados = clientesData.filter(c => {
        return c.nombre.toLowerCase().includes(termino) ||
               (c.apellido && c.apellido.toLowerCase().includes(termino)) ||
               (c.numero_documento && c.numero_documento.toLowerCase().includes(termino)) ||
               (c.telefono && c.telefono.includes(termino));
    });
    
    paginaActualClientes = 1;
    document.getElementById('clientesTableBody').innerHTML = renderClientesRows();
    actualizarPaginacionClientes();
}

async function toggleClientesInactivos(checked) {
    mostrarClientesInactivos = checked;
    await cargarClientes();
    renderClientesPage();
}

function abrirModalCliente(cliente = null) {
    clienteEditando = cliente;
    const esEdicion = cliente !== null;
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalClientes(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-${esEdicion ? 'user-edit' : 'user-plus'}"></i>
                        ${esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                    <button class="modal-close" onclick="cerrarModalClientes()"><i class="pi pi-times"></i></button>
                </div>
                <div class="modal-body">
                    <form id="formCliente" onsubmit="guardarCliente(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Nombre <span class="required">*</span></label>
                                <input type="text" class="form-control" id="cli_nombre" value="${cliente?.nombre || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Apellido</label>
                                <input type="text" class="form-control" id="cli_apellido" value="${cliente?.apellido || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Tipo Documento</label>
                                <select class="form-control" id="cli_tipo_doc">
                                    <option value="CI" ${cliente?.tipo_documento === 'CI' ? 'selected' : ''}>CI</option>
                                    <option value="NIT" ${cliente?.tipo_documento === 'NIT' ? 'selected' : ''}>NIT</option>
                                    <option value="Pasaporte" ${cliente?.tipo_documento === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">N° Documento</label>
                                <input type="text" class="form-control" id="cli_documento" value="${cliente?.numero_documento || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="cli_telefono" value="${cliente?.telefono || ''}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Correo</label>
                                <input type="email" class="form-control" id="cli_correo" value="${cliente?.correo || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Ciudad</label>
                                <input type="text" class="form-control" id="cli_ciudad" value="${cliente?.ciudad || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <textarea class="form-control" id="cli_direccion" rows="2">${cliente?.direccion || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalClientes()">Cancelar</button>
                    <button type="submit" form="formCliente" class="btn btn-primary">
                        <i class="pi pi-check"></i> ${esEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarCliente(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('cli_nombre').value.trim(),
        apellido: document.getElementById('cli_apellido').value.trim() || null,
        tipo_documento: document.getElementById('cli_tipo_doc').value,
        numero_documento: document.getElementById('cli_documento').value.trim() || null,
        telefono: document.getElementById('cli_telefono').value.trim() || null,
        correo: document.getElementById('cli_correo').value.trim() || null,
        ciudad: document.getElementById('cli_ciudad').value.trim() || null,
        direccion: document.getElementById('cli_direccion').value.trim() || null
    };
    
    try {
        let res;
        if (clienteEditando) {
            res = await api.put(`/ventas/clientes/${clienteEditando.id}`, datos);
        } else {
            res = await api.post('/ventas/clientes', datos);
        }
        
        if (res.success) {
            cerrarModalClientes();
            await cargarClientes();
            renderClientesPage();
            mostrarNotificacion(res.mensaje, 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar cliente', 'error');
    }
}

async function editarCliente(id) {
    const cliente = clientesData.find(c => c.id === id);
    if (cliente) {
        abrirModalCliente(cliente);
    }
}

async function desactivarCliente(id) {
    if (!confirm('¿Está seguro de desactivar este cliente?')) return;
    
    try {
        const res = await api.patch(`/ventas/clientes/${id}/estado`, { activo: false });
        if (res.success) {
            await cargarClientes();
            renderClientesPage();
            mostrarNotificacion('Cliente desactivado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al desactivar cliente', 'error');
    }
}

async function activarCliente(id) {
    try {
        const res = await api.patch(`/ventas/clientes/${id}/estado`, { activo: true });
        if (res.success) {
            await cargarClientes();
            renderClientesPage();
            mostrarNotificacion('Cliente activado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al activar cliente', 'error');
    }
}

function renderPaginacionClientes() {
    const totalPaginas = Math.ceil(clientesFiltrados.length / itemsPorPaginaClientes);
    if (clientesFiltrados.length === 0) return '';
    
    const inicio = (paginaActualClientes - 1) * itemsPorPaginaClientes + 1;
    const fin = Math.min(paginaActualClientes * itemsPorPaginaClientes, clientesFiltrados.length);
    
    let paginas = '';
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= paginaActualClientes - 1 && i <= paginaActualClientes + 1)) {
            paginas += `<button class="pagination-btn ${i === paginaActualClientes ? 'active' : ''}" onclick="cambiarPaginaClientes(${i})">${i}</button>`;
        } else if (i === paginaActualClientes - 2 || i === paginaActualClientes + 2) {
            paginas += `<span class="pagination-dots">...</span>`;
        }
    }
    
    return `
        <div class="table-pagination">
            <div class="pagination-info">Mostrando ${inicio}-${fin} de ${clientesFiltrados.length} clientes</div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="cambiarPaginaClientes(${paginaActualClientes - 1})" ${paginaActualClientes === 1 ? 'disabled' : ''}>
                    <i class="pi pi-angle-left"></i>
                </button>
                ${paginas}
                <button class="pagination-btn" onclick="cambiarPaginaClientes(${paginaActualClientes + 1})" ${paginaActualClientes === totalPaginas ? 'disabled' : ''}>
                    <i class="pi pi-angle-right"></i>
                </button>
            </div>
        </div>
    `;
}

function cambiarPaginaClientes(pagina) {
    const totalPaginas = Math.ceil(clientesFiltrados.length / itemsPorPaginaClientes);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaActualClientes = pagina;
    document.getElementById('clientesTableBody').innerHTML = renderClientesRows();
    actualizarPaginacionClientes();
}

function actualizarPaginacionClientes() {
    const paginacionEl = document.querySelector('.table-pagination');
    if (paginacionEl) paginacionEl.outerHTML = renderPaginacionClientes();
}

function cerrarModalClientes(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
}

window.initClientes = initClientes;
window.filtrarClientes = filtrarClientes;
window.toggleClientesInactivos = toggleClientesInactivos;
window.abrirModalCliente = abrirModalCliente;
window.guardarCliente = guardarCliente;
window.editarCliente = editarCliente;
window.desactivarCliente = desactivarCliente;
window.activarCliente = activarCliente;
window.cambiarPaginaClientes = cambiarPaginaClientes;
window.cerrarModalClientes = cerrarModalClientes;
