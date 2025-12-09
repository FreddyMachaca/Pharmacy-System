let configuracionData = {};

async function initConfiguracion() {
    if (!auth.hasPermission('configuracion', 'ver')) {
        document.getElementById('pageContent').innerHTML = `
            <div class="access-denied">
                <i class="pi pi-lock"></i>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos para acceder a este módulo.</p>
            </div>
        `;
        return;
    }
    
    await cargarConfiguracion();
}

async function cargarConfiguracion() {
    try {
        showLoading();
        configuracionData = await api.get('/configuracion/farmacia');
        renderConfiguracion();
    } catch (error) {
        console.error('Error cargando configuración:', error);
        showNotification('Error al cargar configuración', 'error');
    } finally {
        hideLoading();
    }
}

function renderConfiguracion() {
    const puedeEditar = auth.hasPermission('configuracion', 'editar');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    const content = `
        <div class="config-container">
            <div class="config-header">
                <h1><i class="pi pi-cog"></i> Configuración del Sistema</h1>
            </div>
            
            <div class="config-sections">
                <div class="config-section">
                    <div class="config-section-header">
                        <i class="pi pi-palette"></i>
                        <h2>Apariencia</h2>
                    </div>
                    <div class="config-section-body">
                        <div class="form-group">
                            <label>Tema de la Interfaz</label>
                            <div class="theme-selector">
                                <button class="theme-option ${currentTheme === 'light' ? 'active' : ''}" onclick="setTheme('light')">
                                    <i class="pi pi-sun"></i>
                                    <span>Claro</span>
                                </button>
                                <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">
                                    <i class="pi pi-moon"></i>
                                    <span>Oscuro</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="config-section">
                    <div class="config-section-header">
                        <i class="pi pi-building"></i>
                        <h2>Datos de la Farmacia</h2>
                    </div>
                    <div class="config-section-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="config-nombre">Nombre de la Farmacia</label>
                                <input type="text" id="config-nombre" value="${configuracionData.nombre_farmacia || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="config-nit">NIT</label>
                                <input type="text" id="config-nit" value="${configuracionData.nit || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="config-direccion">Dirección</label>
                            <input type="text" id="config-direccion" value="${configuracionData.direccion || ''}" ${!puedeEditar ? 'disabled' : ''}>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="config-ciudad">Ciudad</label>
                                <input type="text" id="config-ciudad" value="${configuracionData.ciudad || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="config-departamento">Departamento</label>
                                <input type="text" id="config-departamento" value="${configuracionData.departamento || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="config-telefono">Teléfono</label>
                                <input type="text" id="config-telefono" value="${configuracionData.telefono || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="config-celular">Celular</label>
                                <input type="text" id="config-celular" value="${configuracionData.celular || ''}" ${!puedeEditar ? 'disabled' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${puedeEditar ? `
                <div class="config-actions">
                    <button class="btn btn-primary btn-lg" onclick="guardarConfiguracion()">
                        <i class="pi pi-save"></i> Guardar Cambios
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('pageContent').innerHTML = content;
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon';
        themeToggle.title = theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    }
}

async function guardarConfiguracion() {
    const configuraciones = [
        { clave: 'nombre_farmacia', valor: document.getElementById('config-nombre').value.trim() },
        { clave: 'nit', valor: document.getElementById('config-nit').value.trim() },
        { clave: 'direccion', valor: document.getElementById('config-direccion').value.trim() },
        { clave: 'ciudad', valor: document.getElementById('config-ciudad').value.trim() },
        { clave: 'departamento', valor: document.getElementById('config-departamento').value.trim() },
        { clave: 'telefono', valor: document.getElementById('config-telefono').value.trim() },
        { clave: 'celular', valor: document.getElementById('config-celular').value.trim() }
    ];
    
    try {
        showLoading();
        await api.put('/configuracion/multiples', { configuraciones });
        showNotification('Configuración guardada correctamente', 'success');
        await cargarConfiguracion();
    } catch (error) {
        showNotification(error.message || 'Error al guardar configuración', 'error');
    } finally {
        hideLoading();
    }
}

window.initConfiguracion = initConfiguracion;
window.guardarConfiguracion = guardarConfiguracion;
window.setTheme = setTheme;
