let productosData = [];
let categoriasData = [];
let laboratoriosData = [];
let productosFiltrados = [];
let mostrarInactivos = false;
let productoEditando = null;

async function initProductos() {
    await cargarDatosIniciales();
    renderProductosPage();
}

async function cargarDatosIniciales() {
    try {
        const [productosRes, categoriasRes, laboratoriosRes] = await Promise.all([
            api.get('/productos'),
            api.get('/productos/categorias'),
            api.get('/productos/laboratorios')
        ]);
        
        productosData = productosRes.data || [];
        categoriasData = categoriasRes.data || [];
        laboratoriosData = laboratoriosRes.data || [];
        productosFiltrados = [...productosData];
    } catch (error) {
        console.error('Error cargando datos:', error);
        productosData = [];
        productosFiltrados = [];
    }
}

function renderProductosPage() {
    const content = document.getElementById('pageContent');
    const stats = calcularEstadisticas();
    
    content.innerHTML = `
        <div class="productos-container">
            <div class="productos-header">
                <div class="productos-header-top">
                    <h1 class="productos-title">Gestión de Productos</h1>
                    <div class="productos-actions">
                        <button class="btn btn-primary" onclick="abrirModalProducto()">
                            <i class="pi pi-plus"></i>
                            <span>Nuevo Producto</span>
                        </button>
                    </div>
                </div>
                <div class="search-box">
                    <div class="search-input-wrapper">
                        <i class="pi pi-search"></i>
                        <input 
                            type="text" 
                            id="searchProducto" 
                            placeholder="Buscar por nombre, código o descripción..."
                            onkeyup="filtrarProductos()"
                        >
                    </div>
                    <label class="filter-toggle ${mostrarInactivos ? 'active' : ''}">
                        <input type="checkbox" ${mostrarInactivos ? 'checked' : ''} onchange="toggleInactivos(this.checked)">
                        <i class="pi pi-eye${mostrarInactivos ? '' : '-slash'}"></i>
                        <span>Inactivos</span>
                    </label>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-mini">
                    <div class="stat-mini-icon blue">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.total}</h4>
                        <span>Total Productos</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon green">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.conStock}</h4>
                        <span>Con Stock</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon orange">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.bajoStock}</h4>
                        <span>Stock Bajo</span>
                    </div>
                </div>
                <div class="stat-mini">
                    <div class="stat-mini-icon red">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-mini-info">
                        <h4>${stats.sinStock}</h4>
                        <span>Sin Stock</span>
                    </div>
                </div>
            </div>
            
            <div class="productos-table-container">
                <div class="table-responsive">
                    <table class="productos-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Laboratorio</th>
                                <th>P. Compra</th>
                                <th>P. Venta</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="productosTableBody">
                            ${renderProductosRows()}
                        </tbody>
                    </table>
                </div>
                ${productosFiltrados.length === 0 ? renderEmptyState() : ''}
                ${renderPaginacion()}
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
}

function renderProductosRows() {
    if (productosFiltrados.length === 0) return '';
    
    return productosFiltrados.map(p => {
        const stockClass = p.stock_actual === 0 ? 'stock-sin' : 
                          p.stock_actual <= p.stock_minimo ? 'stock-bajo' : 'stock-ok';
        const stockBadge = p.stock_actual === 0 ? 'badge-danger' : 
                          p.stock_actual <= p.stock_minimo ? 'badge-warning' : 'badge-success';
        
        return `
            <tr class="${!p.activo ? 'row-inactive' : ''}">
                <td>
                    <div class="producto-nombre">${escapeHtml(p.nombre)}</div>
                    <div class="producto-codigo">${p.codigo_barras || 'Sin código'}</div>
                </td>
                <td>
                    <span class="badge badge-info">${p.categoria_nombre || 'Sin categoría'}</span>
                </td>
                <td>${p.laboratorio_nombre || '-'}</td>
                <td class="precio-cell">Bs. ${formatNumber(p.precio_compra)}</td>
                <td class="precio-cell">Bs. ${formatNumber(p.precio_venta)}</td>
                <td>
                    <span class="stock-cell ${stockClass}">${p.stock_actual}</span>
                    <span style="color: #6c757d; font-size: 11px;">/ mín: ${p.stock_minimo}</span>
                </td>
                <td>
                    ${p.activo 
                        ? '<span class="badge badge-success">Activo</span>' 
                        : '<span class="badge badge-secondary">Inactivo</span>'}
                </td>
                <td>
                    <div class="acciones-cell">
                        <button class="btn-table btn-table-view" onclick="verProducto(${p.id})" title="Ver detalles">
                            <i class="pi pi-eye"></i>
                        </button>
                        <button class="btn-table btn-table-edit" onclick="editarProducto(${p.id})" title="Editar">
                            <i class="pi pi-pencil"></i>
                        </button>
                        ${p.activo 
                            ? `<button class="btn-table btn-table-delete" onclick="desactivarProducto(${p.id})" title="Desactivar">
                                <i class="pi pi-ban"></i>
                               </button>`
                            : `<button class="btn-table btn-table-restore" onclick="activarProducto(${p.id})" title="Activar">
                                <i class="pi pi-check"></i>
                               </button>`
                        }
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEmptyState() {
    return `
        <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <h3>No hay productos</h3>
            <p>No se encontraron productos con los filtros actuales</p>
        </div>
    `;
}

function renderPaginacion() {
    return `
        <div class="table-pagination">
            <div class="pagination-info">
                Mostrando ${productosFiltrados.length} de ${productosData.length} productos
            </div>
        </div>
    `;
}

function calcularEstadisticas() {
    const activos = productosData.filter(p => p.activo);
    return {
        total: activos.length,
        conStock: activos.filter(p => p.stock_actual > p.stock_minimo).length,
        bajoStock: activos.filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length,
        sinStock: activos.filter(p => p.stock_actual === 0).length
    };
}

function filtrarProductos() {
    const termino = document.getElementById('searchProducto').value.toLowerCase().trim();
    
    productosFiltrados = productosData.filter(p => {
        const coincide = p.nombre.toLowerCase().includes(termino) ||
                        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(termino)) ||
                        (p.descripcion && p.descripcion.toLowerCase().includes(termino));
        
        if (!mostrarInactivos && !p.activo) return false;
        return coincide;
    });
    
    document.getElementById('productosTableBody').innerHTML = renderProductosRows();
}

async function toggleInactivos(checked) {
    mostrarInactivos = checked;
    
    if (checked) {
        try {
            const res = await api.get('/productos?inactivos=true');
            productosData = res.data || [];
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        try {
            const res = await api.get('/productos');
            productosData = res.data || [];
        } catch (error) {
            console.error('Error:', error);
        }
    }
    
    filtrarProductos();
    renderProductosPage();
}

function abrirModalProducto(producto = null) {
    productoEditando = producto;
    const esEdicion = producto !== null;
    
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalSiClickFuera(event)">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-${esEdicion ? 'pencil' : 'plus-circle'}"></i>
                        ${esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button class="modal-close" onclick="cerrarModal()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formProducto" onsubmit="guardarProducto(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Código de Barras</label>
                                <input type="text" class="form-control" id="codigo_barras" 
                                    value="${producto?.codigo_barras || ''}" 
                                    placeholder="Escanear o ingresar código">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Nombre <span class="required">*</span></label>
                                <input type="text" class="form-control" id="nombre" required
                                    value="${producto?.nombre || ''}" 
                                    placeholder="Nombre del producto">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Categoría</label>
                                <select class="form-control" id="categoria_id">
                                    <option value="">Seleccionar categoría</option>
                                    ${categoriasData.map(c => `
                                        <option value="${c.id}" ${producto?.categoria_id == c.id ? 'selected' : ''}>
                                            ${escapeHtml(c.nombre)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Laboratorio</label>
                                <select class="form-control" id="laboratorio_id">
                                    <option value="">Seleccionar laboratorio</option>
                                    ${laboratoriosData.map(l => `
                                        <option value="${l.id}" ${producto?.laboratorio_id == l.id ? 'selected' : ''}>
                                            ${escapeHtml(l.nombre)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Precio Compra (Bs.)</label>
                                <input type="number" class="form-control" id="precio_compra" 
                                    step="0.01" min="0"
                                    value="${producto?.precio_compra || '0'}" 
                                    placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Precio Venta (Bs.) <span class="required">*</span></label>
                                <input type="number" class="form-control" id="precio_venta" 
                                    step="0.01" min="0.01" required
                                    value="${producto?.precio_venta || ''}" 
                                    placeholder="0.00">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Stock Mínimo</label>
                                <input type="number" class="form-control" id="stock_minimo" 
                                    min="0"
                                    value="${producto?.stock_minimo || '5'}" 
                                    placeholder="5">
                                <span class="form-hint">Alerta cuando el stock sea menor o igual</span>
                            </div>
                            ${!esEdicion ? `
                            <div class="form-group">
                                <label class="form-label">Stock Inicial</label>
                                <input type="number" class="form-control" id="stock_actual" 
                                    min="0"
                                    value="0" 
                                    placeholder="0">
                                <span class="form-hint">Cantidad inicial en inventario</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group full-width">
                                <label class="form-label">Descripción</label>
                                <textarea class="form-control" id="descripcion" rows="3"
                                    placeholder="Descripción del producto, indicaciones, etc.">${producto?.descripcion || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <div class="form-check">
                                    <input type="checkbox" id="requiere_receta" 
                                        ${producto?.requiere_receta ? 'checked' : ''}>
                                    <label for="requiere_receta">Requiere receta médica</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModal()">
                        Cancelar
                    </button>
                    <button type="submit" form="formProducto" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        ${esEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const datos = {
        codigo_barras: document.getElementById('codigo_barras').value.trim() || null,
        nombre: document.getElementById('nombre').value.trim(),
        categoria_id: document.getElementById('categoria_id').value || null,
        laboratorio_id: document.getElementById('laboratorio_id').value || null,
        precio_compra: parseFloat(document.getElementById('precio_compra').value) || 0,
        precio_venta: parseFloat(document.getElementById('precio_venta').value),
        stock_minimo: parseInt(document.getElementById('stock_minimo').value) || 5,
        descripcion: document.getElementById('descripcion').value.trim() || null,
        requiere_receta: document.getElementById('requiere_receta').checked ? 1 : 0
    };
    
    if (!productoEditando) {
        datos.stock_actual = parseInt(document.getElementById('stock_actual').value) || 0;
    }
    
    try {
        let res;
        if (productoEditando) {
            res = await api.put(`/productos/${productoEditando.id}`, datos);
        } else {
            res = await api.post('/productos', datos);
        }
        
        if (res.success) {
            cerrarModal();
            await cargarDatosIniciales();
            renderProductosPage();
            mostrarNotificacion(res.mensaje, 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar producto', 'error');
    }
}

async function verProducto(id) {
    try {
        const res = await api.get(`/productos/${id}`);
        const p = res.data;
        
        const modal = `
            <div class="modal-overlay" onclick="cerrarModalSiClickFuera(event)">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h2 class="modal-title">
                            <i class="pi pi-box"></i>
                            Detalles del Producto
                        </h2>
                        <button class="modal-close" onclick="cerrarModal()">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <div class="detail-label">Código de Barras</div>
                                <div class="detail-value">${p.codigo_barras || 'Sin código'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Nombre</div>
                                <div class="detail-value">${escapeHtml(p.nombre)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Categoría</div>
                                <div class="detail-value">${p.categoria_nombre || 'Sin categoría'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Laboratorio</div>
                                <div class="detail-value">${p.laboratorio_nombre || 'No especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Precio Compra</div>
                                <div class="detail-value">Bs. ${formatNumber(p.precio_compra)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Precio Venta</div>
                                <div class="detail-value">Bs. ${formatNumber(p.precio_venta)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Stock Actual</div>
                                <div class="detail-value ${p.stock_actual <= p.stock_minimo ? 'stock-bajo' : 'stock-ok'}">
                                    ${p.stock_actual} unidades
                                </div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Stock Mínimo</div>
                                <div class="detail-value">${p.stock_minimo} unidades</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Requiere Receta</div>
                                <div class="detail-value">${p.requiere_receta ? 'Sí' : 'No'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Estado</div>
                                <div class="detail-value">
                                    <span class="badge ${p.activo ? 'badge-success' : 'badge-secondary'}">
                                        ${p.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        ${p.descripcion ? `
                        <div style="margin-top: 20px;">
                            <div class="detail-label">Descripción</div>
                            <p style="color: var(--texto-oscuro); margin-top: 8px;">${escapeHtml(p.descripcion)}</p>
                        </div>
                        ` : ''}
                        
                        <div class="lotes-section">
                            <div class="lotes-header">
                                <h3 class="lotes-title">Lotes Registrados</h3>
                                <button class="btn btn-sm btn-primary" onclick="cerrarModal(); abrirModalLote(${p.id}, '${escapeHtml(p.nombre)}')">
                                    <i class="pi pi-plus"></i>
                                    Agregar Lote
                                </button>
                            </div>
                            ${p.lotes && p.lotes.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="lotes-table">
                                        <thead>
                                            <tr>
                                                <th>N° Lote</th>
                                                <th>F. Fabricación</th>
                                                <th>F. Vencimiento</th>
                                                <th>Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${p.lotes.map(l => {
                                                const vencClass = getVencimientoClass(l.fecha_vencimiento);
                                                return `
                                                    <tr>
                                                        <td><strong>${l.numero_lote}</strong></td>
                                                        <td>${l.fecha_fabricacion ? formatDate(l.fecha_fabricacion) : '-'}</td>
                                                        <td class="${vencClass}">${formatDate(l.fecha_vencimiento)}</td>
                                                        <td>${l.cantidad_actual}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : `
                                <div class="empty-state" style="padding: 30px;">
                                    <i class="pi pi-calendar" style="font-size: 32px;"></i>
                                    <p>No hay lotes registrados</p>
                                </div>
                            `}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="cerrarModal()">
                            Cerrar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="cerrarModal(); editarProducto(${p.id})">
                            <i class="pi pi-pencil"></i>
                            Editar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modal;
    } catch (error) {
        mostrarNotificacion('Error al cargar producto', 'error');
    }
}

async function editarProducto(id) {
    try {
        const res = await api.get(`/productos/${id}`);
        abrirModalProducto(res.data);
    } catch (error) {
        mostrarNotificacion('Error al cargar producto', 'error');
    }
}

async function desactivarProducto(id) {
    if (!confirm('¿Está seguro de desactivar este producto?')) return;
    
    try {
        const res = await api.patch(`/productos/${id}/estado`, { activo: false });
        if (res.success) {
            await cargarDatosIniciales();
            renderProductosPage();
            mostrarNotificacion('Producto desactivado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al desactivar producto', 'error');
    }
}

async function activarProducto(id) {
    try {
        const res = await api.patch(`/productos/${id}/estado`, { activo: true });
        if (res.success) {
            await cargarDatosIniciales();
            renderProductosPage();
            mostrarNotificacion('Producto activado', 'success');
        }
    } catch (error) {
        mostrarNotificacion('Error al activar producto', 'error');
    }
}

function abrirModalLote(productoId, productoNombre) {
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalSiClickFuera(event)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="pi pi-calendar-plus"></i>
                        Nuevo Lote
                    </h2>
                    <button class="modal-close" onclick="cerrarModal()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="background: var(--gris-claro); padding: 12px; border-radius: var(--borde-radius-md); margin-bottom: 20px;">
                        <strong>Producto:</strong> ${escapeHtml(productoNombre)}
                    </div>
                    <form id="formLote" onsubmit="guardarLote(event, ${productoId})">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Número de Lote <span class="required">*</span></label>
                                <input type="text" class="form-control" id="numero_lote" required
                                    placeholder="Ej: LOT-2025-001">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Fecha de Fabricación</label>
                                <input type="date" class="form-control" id="fecha_fabricacion">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fecha de Vencimiento <span class="required">*</span></label>
                                <input type="date" class="form-control" id="fecha_vencimiento" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Cantidad <span class="required">*</span></label>
                                <input type="number" class="form-control" id="cantidad_inicial" 
                                    min="1" required placeholder="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Precio de Compra (Bs.)</label>
                                <input type="number" class="form-control" id="lote_precio_compra" 
                                    step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModal()">
                        Cancelar
                    </button>
                    <button type="submit" form="formLote" class="btn btn-primary">
                        <i class="pi pi-check"></i>
                        Guardar Lote
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarLote(e, productoId) {
    e.preventDefault();
    
    const datos = {
        producto_id: productoId,
        numero_lote: document.getElementById('numero_lote').value.trim(),
        fecha_fabricacion: document.getElementById('fecha_fabricacion').value || null,
        fecha_vencimiento: document.getElementById('fecha_vencimiento').value,
        cantidad_inicial: parseInt(document.getElementById('cantidad_inicial').value),
        precio_compra: parseFloat(document.getElementById('lote_precio_compra').value) || null
    };
    
    try {
        const res = await api.post('/productos/lotes', datos);
        if (res.success) {
            cerrarModal();
            await cargarDatosIniciales();
            renderProductosPage();
            mostrarNotificacion('Lote creado correctamente', 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al guardar lote', 'error');
    }
}

function cerrarModal() {
    document.getElementById('modalContainer').innerHTML = '';
    productoEditando = null;
}

function cerrarModalSiClickFuera(e) {
    if (e.target.classList.contains('modal-overlay')) {
        cerrarModal();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    return parseFloat(num || 0).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getVencimientoClass(fechaVenc) {
    if (!fechaVenc) return '';
    const hoy = new Date();
    const venc = new Date(fechaVenc);
    const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return 'vencimiento-vencido';
    if (dias <= 90) return 'vencimiento-proximo';
    return 'vencimiento-ok';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const colores = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f97316',
        info: '#00C2FF'
    };
    
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${colores[tipo]};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

window.initProductos = initProductos;
window.filtrarProductos = filtrarProductos;
window.toggleInactivos = toggleInactivos;
window.abrirModalProducto = abrirModalProducto;
window.guardarProducto = guardarProducto;
window.verProducto = verProducto;
window.editarProducto = editarProducto;
window.desactivarProducto = desactivarProducto;
window.activarProducto = activarProducto;
window.abrirModalLote = abrirModalLote;
window.guardarLote = guardarLote;
window.cerrarModal = cerrarModal;
window.cerrarModalSiClickFuera = cerrarModalSiClickFuera;
