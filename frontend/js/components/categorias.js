let listaCategorias = [];
let categoriasFiltradas = [];
let mostrarCategoriasInactivas = false;
let categoriaEditando = null;

async function initCategorias() {
    await cargarCategorias();
    renderCategoriasPage();
}

async function cargarCategorias() {
    try {
        const url = mostrarCategoriasInactivas ? '/productos/categorias?inactivos=true' : '/productos/categorias';
        const res = await api.get(url);
        listaCategorias = res.data || [];
        categoriasFiltradas = [...listaCategorias];
    } catch (error) {
        console.error('Error cargando categorías:', error);
        listaCategorias = [];
        categoriasFiltradas = [];
    }
}

function renderCategoriasPage() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="modulo-container">
            <div class="modulo-header">
                <div class="modulo-header-top">
                    <h1 class="modulo-title">
                        <i class="pi pi-tags"></i>
                        Gestión de Categorías
                    </h1>
                    <div class="modulo-actions">
                        <button class="btn btn-primary" onclick="abrirModalCategoria()">
                            <i class="pi pi-plus"></i>
                            <span>Nueva Categoría</span>
                        </button>
                    </div>
                </div>
                <div class="modulo-toolbar">
                    <div class="search-box">
                        <div class="search-input-wrapper">
                            <i class="pi pi-search"></i>
                            <input 
                                type="text" 
                                id="searchCategoria" 
                                placeholder="Buscar categoría..."
                                onkeyup="filtrarCategorias()"
                            >
                        </div>
                    </div>
                    <label class="filter-toggle ${mostrarCategoriasInactivas ? 'active' : ''}">
                        <input type="checkbox" ${mostrarCategoriasInactivas ? 'checked' : ''} onchange="toggleCategoriasInactivas(this.checked)">
                        <i class="pi pi-eye${mostrarCategoriasInactivas ? '' : '-slash'}"></i>
                        <span>Inactivas</span>
                    </label>
                </div>
            </div>
            
            <div class="cards-grid">
                ${renderCategoriasCards()}
            </div>
            
            ${categoriasFiltradas.length === 0 ? renderEmptyStateGenerico('categorías', 'pi-tags') : ''}
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderCategoriasCards() {
    if (categoriasFiltradas.length === 0) return '';
    
    return categoriasFiltradas.map(c => `
        <div class="item-card ${!c.activo ? 'card-inactive' : ''}">
            <div class="item-card-header">
                <div class="item-card-icon">
                    <i class="pi pi-tag"></i>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon" onclick="editarCategoria(${c.id})" title="Editar">
                        <i class="pi pi-pencil"></i>
                    </button>
                    ${c.activo 
                        ? `<button class="btn-icon btn-icon-danger" onclick="desactivarCategoria(${c.id})" title="Desactivar">
                            <i class="pi pi-ban"></i>
                           </button>`
                        : `<button class="btn-icon btn-icon-success" onclick="activarCategoria(${c.id})" title="Activar">
                            <i class="pi pi-check"></i>
                           </button>`
                    }
                </div>
            </div>
            <div class="item-card-body">
                <h3 class="item-card-title">${escapeHtml(c.nombre)}</h3>
                <p class="item-card-desc">${c.descripcion ? escapeHtml(c.descripcion) : 'Sin descripción'}</p>
            </div>
            <div class="item-card-footer">
                <span class="badge ${c.activo ? 'badge-success' : 'badge-secondary'}">
                    ${c.activo ? 'Activa' : 'Inactiva'}
                </span>
                <span class="item-card-count">${c.total_productos || 0} productos</span>
            </div>
        </div>
    `).join('');
}

function filtrarCategorias() {
    const termino = document.getElementById('searchCategoria').value.toLowerCase().trim();
    
    categoriasFiltradas = listaCategorias.filter(c => {
        return c.nombre.toLowerCase().includes(termino) ||
               (c.descripcion && c.descripcion.toLowerCase().includes(termino));
    });
    
    document.querySelector('.cards-grid').innerHTML = renderCategoriasCards();
}

async function toggleCategoriasInactivas(checked) {
    mostrarCategoriasInactivas = checked;
    await cargarCategorias();
    renderCategoriasPage();
}

function abrirModalCategoria(categoria = null) {
    categoriaEditando = categoria;
    const esEdicion = categoria !== null;
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalCategoria(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-${esEdicion ? 'pencil' : 'plus-circle'}"></i>
                        ${esEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
                    </h2>
                    <button class="modal-close" onclick="cerrarModalCategoria()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formCategoria" onsubmit="guardarCategoria(event)">
                        <div class="form-group">
                            <label class="form-label">Nombre <span class="required">*</span></label>
                            <input type="text" class="form-control" id="cat_nombre" required
                                value="${categoria?.nombre || ''}" 
                                placeholder="Nombre de la categoría">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-control" id="cat_descripcion" rows="3"
                                placeholder="Descripción de la categoría">${categoria?.descripcion || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalCategoria()">
                        Cancelar
                    </button>
                    <button type="submit" form="formCategoria" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        ${esEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarCategoria(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('cat_nombre').value.trim(),
        descripcion: document.getElementById('cat_descripcion').value.trim() || null
    };
    
    try {
        let res;
        if (categoriaEditando) {
            res = await api.put(`/productos/categorias/${categoriaEditando.id}`, datos);
        } else {
            res = await api.post('/productos/categorias', datos);
        }
        
        if (res.success) {
            cerrarModalCategoria();
            await cargarCategorias();
            renderCategoriasPage();
            mostrarNotificacion(res.mensaje, 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar categoría', 'error');
    }
}

async function editarCategoria(id) {
    const categoria = listaCategorias.find(c => c.id === id);
    if (categoria) {
        abrirModalCategoria(categoria);
    }
}

async function desactivarCategoria(id) {
    if (!confirm('¿Está seguro de desactivar esta categoría?')) return;
    
    try {
        const res = await api.patch(`/productos/categorias/${id}/estado`, { activo: false });
        if (res.success) {
            await cargarCategorias();
            renderCategoriasPage();
            mostrarNotificacion('Categoría desactivada', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al desactivar categoría', 'error');
    }
}

async function activarCategoria(id) {
    try {
        const res = await api.patch(`/productos/categorias/${id}/estado`, { activo: true });
        if (res.success) {
            await cargarCategorias();
            renderCategoriasPage();
            mostrarNotificacion('Categoría activada', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al activar categoría', 'error');
    }
}

function cerrarModalCategoria(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
    categoriaEditando = null;
}

function renderEmptyStateGenerico(tipo, icono) {
    return `
        <div class="empty-state">
            <i class="pi ${icono}"></i>
            <h3>No hay ${tipo}</h3>
            <p>No se encontraron ${tipo} con los filtros actuales</p>
        </div>
    `;
}

window.initCategorias = initCategorias;
window.filtrarCategorias = filtrarCategorias;
window.toggleCategoriasInactivas = toggleCategoriasInactivas;
window.abrirModalCategoria = abrirModalCategoria;
window.guardarCategoria = guardarCategoria;
window.editarCategoria = editarCategoria;
window.desactivarCategoria = desactivarCategoria;
window.activarCategoria = activarCategoria;
window.cerrarModalCategoria = cerrarModalCategoria;
