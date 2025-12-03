let usuariosData = [];
let rolesData = [];
let tabActual = 'usuarios';

async function initUsuarios() {
    if (!auth.hasPermission('usuarios', 'ver')) {
        document.getElementById('pageContent').innerHTML = `
            <div class="access-denied">
                <i class="pi pi-lock"></i>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos para acceder a este módulo.</p>
            </div>
        `;
        return;
    }
    
    renderUsuariosLayout();
    await cargarDatos();
}

function renderUsuariosLayout() {
    const content = `
        <div class="usuarios-container">
            <div class="usuarios-header">
                <h1><i class="pi pi-user-edit"></i> Gestión de Usuarios</h1>
            </div>
            
            <div class="usuarios-tabs">
                <button class="tab-btn ${tabActual === 'usuarios' ? 'active' : ''}" onclick="cambiarTab('usuarios')">
                    <i class="pi pi-users"></i> Usuarios
                </button>
                <button class="tab-btn ${tabActual === 'roles' ? 'active' : ''}" onclick="cambiarTab('roles')">
                    <i class="pi pi-shield"></i> Roles y Permisos
                </button>
            </div>
            
            <div class="usuarios-content" id="usuarios-content">
                <!-- Contenido dinámico -->
            </div>
        </div>
        
        <!-- Modal Usuario -->
        <div class="modal-overlay" id="modal-usuario" style="display: none;">
            <div class="modal-container modal-md">
                <div class="modal-header">
                    <h3 id="modal-usuario-title">Nuevo Usuario</h3>
                    <button class="modal-close" onclick="cerrarModalUsuario()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="form-usuario">
                        <input type="hidden" id="usuario-id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="usuario-nombre">Nombre *</label>
                                <input type="text" id="usuario-nombre" required>
                            </div>
                            <div class="form-group">
                                <label for="usuario-apellido">Apellido *</label>
                                <input type="text" id="usuario-apellido" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="usuario-correo">Correo Electrónico *</label>
                            <input type="email" id="usuario-correo" required>
                        </div>
                        
                        <div class="form-group" id="grupo-contrasena">
                            <label for="usuario-contrasena">Contraseña *</label>
                            <input type="password" id="usuario-contrasena" minlength="6">
                            <small class="form-hint">Mínimo 6 caracteres</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="usuario-rol">Rol *</label>
                            <select id="usuario-rol" required>
                                <option value="">Seleccionar rol...</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalUsuario()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="guardarUsuario()">
                        <i class="pi pi-save"></i> Guardar
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Modal Cambiar Contraseña -->
        <div class="modal-overlay" id="modal-contrasena" style="display: none;">
            <div class="modal-container modal-sm">
                <div class="modal-header">
                    <h3>Cambiar Contraseña</h3>
                    <button class="modal-close" onclick="cerrarModalContrasena()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="form-contrasena">
                        <input type="hidden" id="contrasena-usuario-id">
                        
                        <div class="form-group">
                            <label for="nueva-contrasena">Nueva Contraseña *</label>
                            <input type="password" id="nueva-contrasena" required minlength="6">
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmar-contrasena">Confirmar Contraseña *</label>
                            <input type="password" id="confirmar-contrasena" required minlength="6">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalContrasena()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="cambiarContrasena()">
                        <i class="pi pi-lock"></i> Cambiar
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Modal Rol -->
        <div class="modal-overlay" id="modal-rol" style="display: none;">
            <div class="modal-container modal-lg">
                <div class="modal-header">
                    <h3 id="modal-rol-title">Nuevo Rol</h3>
                    <button class="modal-close" onclick="cerrarModalRol()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="form-rol">
                        <input type="hidden" id="rol-id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="rol-nombre">Nombre del Rol *</label>
                                <input type="text" id="rol-nombre" required placeholder="ej: supervisor">
                            </div>
                            <div class="form-group">
                                <label for="rol-descripcion">Descripción</label>
                                <input type="text" id="rol-descripcion" placeholder="Descripción del rol">
                            </div>
                        </div>
                        
                        <div class="permisos-section">
                            <h4><i class="pi pi-shield"></i> Permisos por Módulo</h4>
                            <div class="permisos-grid" id="permisos-grid">
                                <!-- Se llena dinámicamente -->
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalRol()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="guardarRol()">
                        <i class="pi pi-save"></i> Guardar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('pageContent').innerHTML = content;
}

async function cargarDatos() {
    try {
        showLoading();
        const [usuarios, roles] = await Promise.all([
            api.get('/usuarios'),
            api.get('/usuarios/roles')
        ]);
        
        usuariosData = usuarios;
        rolesData = roles;
        
        renderTabContent();
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error al cargar datos', 'error');
    } finally {
        hideLoading();
    }
}

function cambiarTab(tab) {
    tabActual = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="cambiarTab('${tab}')"]`).classList.add('active');
    renderTabContent();
}

function renderTabContent() {
    const container = document.getElementById('usuarios-content');
    
    if (tabActual === 'usuarios') {
        container.innerHTML = renderTabUsuarios();
    } else {
        container.innerHTML = renderTabRoles();
    }
}

function renderTabUsuarios() {
    return `
        <div class="tab-toolbar">
            <div class="search-box">
                <i class="pi pi-search"></i>
                <input type="text" id="buscar-usuario" placeholder="Buscar usuario..." oninput="filtrarUsuarios()">
            </div>
            ${auth.hasPermission('usuarios', 'crear') ? `
                <button class="btn btn-primary" onclick="abrirModalUsuario()">
                    <i class="pi pi-plus"></i> Nuevo Usuario
                </button>
            ` : ''}
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Último Acceso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-usuarios">
                    ${renderFilasUsuarios(usuariosData)}
                </tbody>
            </table>
        </div>
    `;
}

function renderFilasUsuarios(usuarios) {
    if (!usuarios || usuarios.length === 0) {
        return `<tr><td colspan="6" class="empty-table">No hay usuarios registrados</td></tr>`;
    }
    
    return usuarios.map(u => {
        const esAdmin = u.rol === 'admin' && u.id === 1;
        const estadoClass = u.activo ? 'badge-success' : 'badge-danger';
        const estadoText = u.activo ? 'Activo' : 'Inactivo';
        const ultimoAcceso = u.ultimo_acceso ? formatearFechaHora(u.ultimo_acceso) : 'Nunca';
        
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${obtenerIniciales(u.nombre, u.apellido)}</div>
                        <div class="user-info">
                            <span class="user-name">${u.nombre} ${u.apellido}</span>
                        </div>
                    </div>
                </td>
                <td>${u.correo}</td>
                <td><span class="badge badge-info">${u.rol}</span></td>
                <td><span class="badge ${estadoClass}">${estadoText}</span></td>
                <td>${ultimoAcceso}</td>
                <td>
                    <div class="action-buttons">
                        ${auth.hasPermission('usuarios', 'editar') ? `
                            <button class="btn-icon btn-edit" onclick="editarUsuario(${u.id})" title="Editar">
                                <i class="pi pi-pencil"></i>
                            </button>
                            <button class="btn-icon btn-key" onclick="abrirModalContrasena(${u.id})" title="Cambiar contraseña">
                                <i class="pi pi-key"></i>
                            </button>
                        ` : ''}
                        ${!esAdmin && auth.hasPermission('usuarios', 'editar') ? `
                            <button class="btn-icon ${u.activo ? 'btn-warning' : 'btn-success'}" 
                                    onclick="toggleEstadoUsuario(${u.id}, ${u.activo})" 
                                    title="${u.activo ? 'Desactivar' : 'Activar'}">
                                <i class="pi pi-${u.activo ? 'ban' : 'check'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTabRoles() {
    return `
        <div class="tab-toolbar">
            ${auth.hasPermission('usuarios', 'crear') ? `
                <button class="btn btn-primary" onclick="abrirModalRol()">
                    <i class="pi pi-plus"></i> Nuevo Rol
                </button>
            ` : ''}
        </div>
        
        <div class="roles-grid">
            ${rolesData.map(rol => renderCardRol(rol)).join('')}
        </div>
    `;
}

function renderCardRol(rol) {
    const esAdmin = rol.nombre === 'admin';
    const cantidadUsuarios = usuariosData.filter(u => u.rol === rol.nombre).length;
    
    return `
        <div class="role-card ${esAdmin ? 'role-admin' : ''}">
            <div class="role-header">
                <div class="role-icon">
                    <i class="pi ${esAdmin ? 'pi-crown' : 'pi-shield'}"></i>
                </div>
                <div class="role-info">
                    <h3>${rol.nombre}</h3>
                    <p>${rol.descripcion || 'Sin descripción'}</p>
                </div>
            </div>
            
            <div class="role-stats">
                <div class="stat">
                    <span class="stat-value">${cantidadUsuarios}</span>
                    <span class="stat-label">Usuarios</span>
                </div>
            </div>
            
            <div class="role-actions">
                ${!esAdmin && auth.hasPermission('usuarios', 'editar') ? `
                    <button class="btn btn-secondary btn-sm" onclick="editarRol(${rol.id})">
                        <i class="pi pi-pencil"></i> Editar Permisos
                    </button>
                ` : esAdmin ? `
                    <span class="admin-note"><i class="pi pi-info-circle"></i> Acceso total</span>
                ` : ''}
            </div>
        </div>
    `;
}

function filtrarUsuarios() {
    const busqueda = document.getElementById('buscar-usuario').value.toLowerCase();
    const filtrados = usuariosData.filter(u => 
        u.nombre.toLowerCase().includes(busqueda) ||
        u.apellido.toLowerCase().includes(busqueda) ||
        u.correo.toLowerCase().includes(busqueda) ||
        u.rol.toLowerCase().includes(busqueda)
    );
    
    document.getElementById('tabla-usuarios').innerHTML = renderFilasUsuarios(filtrados);
}

function abrirModalUsuario() {
    document.getElementById('modal-usuario-title').textContent = 'Nuevo Usuario';
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
    document.getElementById('grupo-contrasena').style.display = 'block';
    document.getElementById('usuario-contrasena').required = true;
    
    cargarSelectRoles();
    document.getElementById('modal-usuario').style.display = 'flex';
}

async function editarUsuario(id) {
    try {
        showLoading();
        const usuario = await api.get(`/usuarios/${id}`);
        
        document.getElementById('modal-usuario-title').textContent = 'Editar Usuario';
        document.getElementById('usuario-id').value = usuario.id;
        document.getElementById('usuario-nombre').value = usuario.nombre;
        document.getElementById('usuario-apellido').value = usuario.apellido;
        document.getElementById('usuario-correo').value = usuario.correo;
        document.getElementById('grupo-contrasena').style.display = 'none';
        document.getElementById('usuario-contrasena').required = false;
        
        await cargarSelectRoles();
        document.getElementById('usuario-rol').value = usuario.rol;
        
        document.getElementById('modal-usuario').style.display = 'flex';
    } catch (error) {
        showNotification('Error al cargar usuario', 'error');
    } finally {
        hideLoading();
    }
}

async function cargarSelectRoles() {
    const select = document.getElementById('usuario-rol');
    select.innerHTML = '<option value="">Seleccionar rol...</option>';
    
    rolesData.forEach(rol => {
        select.innerHTML += `<option value="${rol.nombre}">${rol.nombre}</option>`;
    });
}

function cerrarModalUsuario() {
    document.getElementById('modal-usuario').style.display = 'none';
}

async function guardarUsuario() {
    const id = document.getElementById('usuario-id').value;
    const datos = {
        nombre: document.getElementById('usuario-nombre').value.trim(),
        apellido: document.getElementById('usuario-apellido').value.trim(),
        correo: document.getElementById('usuario-correo').value.trim(),
        rol: document.getElementById('usuario-rol').value
    };
    
    if (!datos.nombre || !datos.apellido || !datos.correo || !datos.rol) {
        showNotification('Complete todos los campos requeridos', 'warning');
        return;
    }
    
    if (!id) {
        const contrasena = document.getElementById('usuario-contrasena').value;
        if (!contrasena || contrasena.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        datos.contrasena = contrasena;
    }
    
    try {
        showLoading();
        
        if (id) {
            await api.put(`/usuarios/${id}`, datos);
            showNotification('Usuario actualizado correctamente', 'success');
        } else {
            await api.post('/usuarios', datos);
            showNotification('Usuario creado correctamente', 'success');
        }
        
        cerrarModalUsuario();
        await cargarDatos();
    } catch (error) {
        showNotification(error.message || 'Error al guardar usuario', 'error');
    } finally {
        hideLoading();
    }
}

async function toggleEstadoUsuario(id, estadoActual) {
    const accion = estadoActual ? 'desactivar' : 'activar';
    
    if (!confirm(`¿Está seguro de ${accion} este usuario?`)) {
        return;
    }
    
    try {
        showLoading();
        await api.patch(`/usuarios/${id}/estado`, { activo: !estadoActual });
        showNotification(`Usuario ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`, 'success');
        await cargarDatos();
    } catch (error) {
        showNotification(error.message || 'Error al cambiar estado', 'error');
    } finally {
        hideLoading();
    }
}

function abrirModalContrasena(id) {
    document.getElementById('form-contrasena').reset();
    document.getElementById('contrasena-usuario-id').value = id;
    document.getElementById('modal-contrasena').style.display = 'flex';
}

function cerrarModalContrasena() {
    document.getElementById('modal-contrasena').style.display = 'none';
}

async function cambiarContrasena() {
    const id = document.getElementById('contrasena-usuario-id').value;
    const nueva = document.getElementById('nueva-contrasena').value;
    const confirmar = document.getElementById('confirmar-contrasena').value;
    
    if (!nueva || nueva.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    if (nueva !== confirmar) {
        showNotification('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    try {
        showLoading();
        await api.patch(`/usuarios/${id}/contrasena`, { nuevaContrasena: nueva });
        showNotification('Contraseña cambiada correctamente', 'success');
        cerrarModalContrasena();
    } catch (error) {
        showNotification(error.message || 'Error al cambiar contraseña', 'error');
    } finally {
        hideLoading();
    }
}

const MODULOS_DISPONIBLES = [
    { id: 'dashboard', nombre: 'Dashboard' },
    { id: 'punto-venta', nombre: 'Punto de Venta' },
    { id: 'ventas', nombre: 'Historial Ventas' },
    { id: 'clientes', nombre: 'Clientes' },
    { id: 'productos', nombre: 'Productos' },
    { id: 'categorias', nombre: 'Categorías' },
    { id: 'laboratorios', nombre: 'Laboratorios' },
    { id: 'lotes', nombre: 'Lotes' },
    { id: 'movimientos', nombre: 'Movimientos' },
    { id: 'reporte-ventas', nombre: 'Reporte Ventas' },
    { id: 'reporte-inventario', nombre: 'Reporte Inventario' },
    { id: 'reporte-vencimientos', nombre: 'Próximos a Vencer' },
    { id: 'reportes-profesionales', nombre: 'Reportes Exportables' },
    { id: 'usuarios', nombre: 'Usuarios' },
    { id: 'caja', nombre: 'Caja' },
    { id: 'configuracion', nombre: 'Configuración' }
];

function abrirModalRol() {
    document.getElementById('modal-rol-title').textContent = 'Nuevo Rol';
    document.getElementById('form-rol').reset();
    document.getElementById('rol-id').value = '';
    
    renderPermisosGrid([]);
    document.getElementById('modal-rol').style.display = 'flex';
}

async function editarRol(id) {
    try {
        showLoading();
        const permisos = await api.get(`/usuarios/roles/${id}/permisos`);
        const rol = rolesData.find(r => r.id === id);
        
        document.getElementById('modal-rol-title').textContent = 'Editar Rol';
        document.getElementById('rol-id').value = id;
        document.getElementById('rol-nombre').value = rol.nombre;
        document.getElementById('rol-nombre').disabled = false;
        document.getElementById('rol-descripcion').value = rol.descripcion || '';
        
        renderPermisosGrid(permisos);
        document.getElementById('modal-rol').style.display = 'flex';
    } catch (error) {
        showNotification('Error al cargar rol', 'error');
    } finally {
        hideLoading();
    }
}

function renderPermisosGrid(permisosActuales) {
    const grid = document.getElementById('permisos-grid');
    
    grid.innerHTML = `
        <div class="permisos-header">
            <div class="permiso-modulo">Módulo</div>
            <div class="permiso-check">Ver</div>
            <div class="permiso-check">Crear</div>
            <div class="permiso-check">Editar</div>
            <div class="permiso-check">Eliminar</div>
        </div>
        ${MODULOS_DISPONIBLES.map(mod => {
            const perm = permisosActuales.find(p => p.modulo === mod.id) || {};
            return `
                <div class="permisos-row">
                    <div class="permiso-modulo">${mod.nombre}</div>
                    <div class="permiso-check">
                        <input type="checkbox" id="perm-${mod.id}-ver" ${perm.puede_ver ? 'checked' : ''}>
                    </div>
                    <div class="permiso-check">
                        <input type="checkbox" id="perm-${mod.id}-crear" ${perm.puede_crear ? 'checked' : ''}>
                    </div>
                    <div class="permiso-check">
                        <input type="checkbox" id="perm-${mod.id}-editar" ${perm.puede_editar ? 'checked' : ''}>
                    </div>
                    <div class="permiso-check">
                        <input type="checkbox" id="perm-${mod.id}-eliminar" ${perm.puede_eliminar ? 'checked' : ''}>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

function cerrarModalRol() {
    document.getElementById('modal-rol').style.display = 'none';
    document.getElementById('rol-nombre').disabled = false;
}

async function guardarRol() {
    const id = document.getElementById('rol-id').value;
    const nombre = document.getElementById('rol-nombre').value.trim().toLowerCase();
    const descripcion = document.getElementById('rol-descripcion').value.trim();
    
    if (!nombre) {
        showNotification('Ingrese el nombre del rol', 'warning');
        return;
    }
    
    const permisos = MODULOS_DISPONIBLES.map(mod => ({
        modulo: mod.id,
        puede_ver: document.getElementById(`perm-${mod.id}-ver`).checked,
        puede_crear: document.getElementById(`perm-${mod.id}-crear`).checked,
        puede_editar: document.getElementById(`perm-${mod.id}-editar`).checked,
        puede_eliminar: document.getElementById(`perm-${mod.id}-eliminar`).checked
    }));
    
    try {
        showLoading();
        
        if (id) {
            await api.put(`/usuarios/roles/${id}`, { nombre, descripcion });
            await api.put(`/usuarios/roles/${id}/permisos`, { permisos });
            showNotification('Rol actualizado correctamente', 'success');
        } else {
            const nuevoRol = await api.post('/usuarios/roles', { nombre, descripcion });
            await api.put(`/usuarios/roles/${nuevoRol.id}/permisos`, { permisos });
            showNotification('Rol creado correctamente', 'success');
        }
        
        cerrarModalRol();
        await cargarDatos();
    } catch (error) {
        showNotification(error.message || 'Error al guardar rol', 'error');
    } finally {
        hideLoading();
    }
}

function obtenerIniciales(nombre, apellido) {
    return (nombre?.charAt(0) || '') + (apellido?.charAt(0) || '');
}

function formatearFechaHora(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-BO') + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

window.initUsuarios = initUsuarios;
window.cambiarTab = cambiarTab;
window.filtrarUsuarios = filtrarUsuarios;
window.abrirModalUsuario = abrirModalUsuario;
window.editarUsuario = editarUsuario;
window.cerrarModalUsuario = cerrarModalUsuario;
window.guardarUsuario = guardarUsuario;
window.toggleEstadoUsuario = toggleEstadoUsuario;
window.abrirModalContrasena = abrirModalContrasena;
window.cerrarModalContrasena = cerrarModalContrasena;
window.cambiarContrasena = cambiarContrasena;
window.abrirModalRol = abrirModalRol;
window.editarRol = editarRol;
window.cerrarModalRol = cerrarModalRol;
window.guardarRol = guardarRol;
