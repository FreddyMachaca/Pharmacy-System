let listaLaboratorios = [];
let laboratoriosFiltrados = [];
let mostrarLabsInactivos = false;
let laboratorioEditando = null;

async function initLaboratorios() {
    await cargarLaboratorios();
    renderLaboratoriosPage();
}

async function cargarLaboratorios() {
    try {
        const url = mostrarLabsInactivos ? '/productos/laboratorios?inactivos=true' : '/productos/laboratorios';
        const res = await api.get(url);
        listaLaboratorios = res.data || [];
        laboratoriosFiltrados = [...listaLaboratorios];
    } catch (error) {
        console.error('Error cargando laboratorios:', error);
        listaLaboratorios = [];
        laboratoriosFiltrados = [];
    }
}

function renderLaboratoriosPage() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-building"></i>
                        Gestión de Laboratorios
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-primary" onclick="abrirModalLaboratorio()">
                            <i class="pi pi-plus"></i>
                            <span>Nuevo Laboratorio</span>
                        </button>
                    </div>
                </div>
                <div class="modulo-toolbar">
                    <div class="search-box">
                        <div class="search-input-wrapper">
                            <i class="pi pi-search"></i>
                            <input 
                                type="text" 
                                id="searchLaboratorio" 
                                placeholder="Buscar laboratorio..."
                                onkeyup="filtrarLaboratorios()"
                            >
                        </div>
                    </div>
                    <label class="filter-toggle ${mostrarLabsInactivos ? 'active' : ''}">
                        <input type="checkbox" ${mostrarLabsInactivos ? 'checked' : ''} onchange="toggleLabsInactivos(this.checked)">
                        <i class="pi pi-eye${mostrarLabsInactivos ? '' : '-slash'}"></i>
                        <span>Inactivos</span>
                    </label>
                </div>
            </div>
            
            <div class="cards-grid">
                ${renderLaboratoriosCards()}
            </div>
            
            ${laboratoriosFiltrados.length === 0 ? renderEmptyStateLabs() : ''}
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderLaboratoriosCards() {
    if (laboratoriosFiltrados.length === 0) return '';
    
    return laboratoriosFiltrados.map(l => `
        <div class="item-card ${!l.activo ? 'card-inactive' : ''}">
            <div class="item-card-header">
                <div class="item-card-icon lab-icon">
                    <i class="pi pi-building"></i>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon" onclick="editarLaboratorio(${l.id})" title="Editar">
                        <i class="pi pi-pencil"></i>
                    </button>
                    ${l.activo 
                        ? `<button class="btn-icon btn-icon-danger" onclick="desactivarLaboratorio(${l.id})" title="Desactivar">
                            <i class="pi pi-ban"></i>
                           </button>`
                        : `<button class="btn-icon btn-icon-success" onclick="activarLaboratorio(${l.id})" title="Activar">
                            <i class="pi pi-check"></i>
                           </button>`
                    }
                </div>
            </div>
            <div class="item-card-body">
                <h3 class="item-card-title">${escapeHtml(l.nombre)}</h3>
                <div class="item-card-info">
                    ${l.pais ? `<span><i class="pi pi-globe"></i> ${escapeHtml(l.pais)}</span>` : ''}
                    ${l.telefono ? `<span><i class="pi pi-phone"></i> ${escapeHtml(l.telefono)}</span>` : ''}
                </div>
                ${l.direccion ? `<p class="item-card-desc">${escapeHtml(l.direccion)}</p>` : ''}
            </div>
            <div class="item-card-footer">
                <span class="badge ${l.activo ? 'badge-success' : 'badge-secondary'}">
                    ${l.activo ? 'Activo' : 'Inactivo'}
                </span>
                <span class="item-card-count">${l.total_productos || 0} productos</span>
            </div>
        </div>
    `).join('');
}

function filtrarLaboratorios() {
    const termino = document.getElementById('searchLaboratorio').value.toLowerCase().trim();
    
    laboratoriosFiltrados = listaLaboratorios.filter(l => {
        return l.nombre.toLowerCase().includes(termino) ||
               (l.pais && l.pais.toLowerCase().includes(termino));
    });
    
    document.querySelector('.cards-grid').innerHTML = renderLaboratoriosCards();
}

async function toggleLabsInactivos(checked) {
    mostrarLabsInactivos = checked;
    await cargarLaboratorios();
    renderLaboratoriosPage();
}

function abrirModalLaboratorio(laboratorio = null) {
    laboratorioEditando = laboratorio;
    const esEdicion = laboratorio !== null;
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalLab(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-${esEdicion ? 'pencil' : 'plus-circle'}"></i>
                        ${esEdicion ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
                    </h2>
                    <button class="modal-close" onclick="cerrarModalLab()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formLaboratorio" onsubmit="guardarLaboratorio(event)">
                        <div class="form-group">
                            <label class="form-label">Nombre <span class="required">*</span></label>
                            <input type="text" class="form-control" id="lab_nombre" required
                                value="${laboratorio?.nombre || ''}" 
                                placeholder="Nombre del laboratorio">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">País</label>
                                <input type="text" class="form-control" id="lab_pais"
                                    value="${laboratorio?.pais || 'Bolivia'}" 
                                    placeholder="País de origen">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="lab_telefono"
                                    value="${laboratorio?.telefono || ''}" 
                                    placeholder="Teléfono de contacto">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <textarea class="form-control" id="lab_direccion" rows="2"
                                placeholder="Dirección del laboratorio">${laboratorio?.direccion || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" id="lab_email"
                                value="${laboratorio?.email || ''}" 
                                placeholder="correo@laboratorio.com">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalLab()">
                        Cancelar
                    </button>
                    <button type="submit" form="formLaboratorio" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        ${esEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarLaboratorio(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('lab_nombre').value.trim(),
        pais: document.getElementById('lab_pais').value.trim() || null,
        telefono: document.getElementById('lab_telefono').value.trim() || null,
        direccion: document.getElementById('lab_direccion').value.trim() || null,
        email: document.getElementById('lab_email').value.trim() || null
    };
    
    try {
        let res;
        if (laboratorioEditando) {
            res = await api.put(`/productos/laboratorios/${laboratorioEditando.id}`, datos);
        } else {
            res = await api.post('/productos/laboratorios', datos);
        }
        
        if (res.success) {
            cerrarModalLab();
            await cargarLaboratorios();
            renderLaboratoriosPage();
            mostrarNotificacion(res.mensaje, 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar laboratorio', 'error');
    }
}

async function editarLaboratorio(id) {
    const laboratorio = listaLaboratorios.find(l => l.id === id);
    if (laboratorio) {
        abrirModalLaboratorio(laboratorio);
    }
}

async function desactivarLaboratorio(id) {
    if (!confirm('¿Está seguro de desactivar este laboratorio?')) return;
    
    try {
        const res = await api.patch(`/productos/laboratorios/${id}/estado`, { activo: false });
        if (res.success) {
            await cargarLaboratorios();
            renderLaboratoriosPage();
            mostrarNotificacion('Laboratorio desactivado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al desactivar laboratorio', 'error');
    }
}

async function activarLaboratorio(id) {
    try {
        const res = await api.patch(`/productos/laboratorios/${id}/estado`, { activo: true });
        if (res.success) {
            await cargarLaboratorios();
            renderLaboratoriosPage();
            mostrarNotificacion('Laboratorio activado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al activar laboratorio', 'error');
    }
}

function cerrarModalLab(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
    laboratorioEditando = null;
}

function renderEmptyStateLabs() {
    return `
        <div class="empty-state">
            <i class="pi pi-building"></i>
            <h3>No hay laboratorios</h3>
            <p>No se encontraron laboratorios con los filtros actuales</p>
        </div>
    `;
}

window.initLaboratorios = initLaboratorios;
window.filtrarLaboratorios = filtrarLaboratorios;
window.toggleLabsInactivos = toggleLabsInactivos;
window.abrirModalLaboratorio = abrirModalLaboratorio;
window.guardarLaboratorio = guardarLaboratorio;
window.editarLaboratorio = editarLaboratorio;
window.desactivarLaboratorio = desactivarLaboratorio;
window.activarLaboratorio = activarLaboratorio;
window.cerrarModalLab = cerrarModalLab;
