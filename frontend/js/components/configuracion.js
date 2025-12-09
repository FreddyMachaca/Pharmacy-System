let configuracionData = {};
let logosData = [];
let logoActivo = null;

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
    
    await cargarLogos();
    await cargarConfiguracion();
}

async function cargarConfiguracion() {
    try {
        showLoading();
        configuracionData = await api.get('/configuracion/farmacia');
        renderConfiguracion();
        renderGaleriaLogos();
    } catch (error) {
        console.error('Error cargando configuración:', error);
        showNotification('Error al cargar configuración', 'error');
    } finally {
        hideLoading();
    }
}

async function cargarLogos() {
    try {
        const response = await api.get('/logos');
        logosData = response.logos || [];
        logoActivo = response.logoActivo || null;
        window.logoFarmacia = logoActivo;
    } catch (error) {
        console.error('Error cargando logos:', error);
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
                        <i class="pi pi-image"></i>
                        <h2>Logo de la Farmacia</h2>
                    </div>
                    <div class="config-section-body">
                        <div class="logo-actual-container">
                            <div class="logo-actual-preview" id="logoActualPreview">
                                ${logoActivo 
                                    ? `<img src="${logoActivo}" alt="Logo actual">`
                                    : `<i class="pi pi-plus-circle logo-default-icon"></i>`
                                }
                            </div>
                            <div class="logo-actual-info">
                                <p class="logo-status">${logoActivo ? 'Logo personalizado activo' : 'Usando icono por defecto'}</p>
                                ${logoActivo ? `<button class="btn btn-sm btn-danger" onclick="quitarLogoActivo()"><i class="pi pi-times"></i> Quitar logo</button>` : ''}
                            </div>
                        </div>
                        
                        ${puedeEditar ? `
                            <div class="logo-upload-section">
                                <label class="logo-upload-label">
                                    <input type="file" id="logoInput" accept="image/*" onchange="subirLogo()" hidden>
                                    <i class="pi pi-upload"></i>
                                    <span>Subir nuevo logo</span>
                                    <small>Máximo 50MB - PNG, JPG, GIF, WEBP, SVG</small>
                                </label>
                            </div>
                        ` : ''}
                        
                        <div class="logos-galeria" id="logosGaleria">
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
        window.nombreFarmacia = configuraciones.find(c => c.clave === 'nombre_farmacia')?.valor || window.nombreFarmacia;
        await cargarConfiguracion();
    } catch (error) {
        showNotification(error.message || 'Error al guardar configuración', 'error');
    } finally {
        hideLoading();
    }
}

function renderGaleriaLogos() {
    const galeria = document.getElementById('logosGaleria');
    if (!galeria) return;
    
    if (logosData.length === 0) {
        galeria.innerHTML = '<p class="no-logos">No hay logos subidos</p>';
        return;
    }
    
    galeria.innerHTML = logosData.map(logo => `
        <div class="logo-item ${logoActivo === logo.url ? 'active' : ''}">
            <img src="${logo.url}" alt="${logo.nombre}">
            <div class="logo-item-actions">
                <button class="btn-logo-action btn-seleccionar" onclick="establecerLogo('${logo.url}')" title="Usar este logo">
                    <i class="pi pi-check"></i>
                </button>
                <button class="btn-logo-action btn-eliminar" onclick="eliminarLogo('${logo.nombre}')" title="Eliminar">
                    <i class="pi pi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function subirLogo() {
    const input = document.getElementById('logoInput');
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    if (file.size > 50 * 1024 * 1024) {
        showNotification('El archivo excede el tamaño máximo de 50MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('logo', file);
    
    try {
        showLoading();
        const token = sessionStorage.getItem('pharmacy_token');
        const response = await fetch('/api/logos/subir', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Logo subido correctamente', 'success');
            await cargarLogos();
            renderGaleriaLogos();
        } else {
            showNotification(data.mensaje || 'Error al subir logo', 'error');
        }
    } catch (error) {
        showNotification('Error al subir el logo', 'error');
    } finally {
        hideLoading();
        input.value = '';
    }
}

async function establecerLogo(url) {
    try {
        showLoading();
        await api.put('/logos/establecer', { logo: url });
        logoActivo = url;
        window.logoFarmacia = url;
        showNotification('Logo establecido correctamente', 'success');
        renderConfiguracion();
        renderGaleriaLogos();
        actualizarLogoSidebar();
    } catch (error) {
        showNotification('Error al establecer el logo', 'error');
    } finally {
        hideLoading();
    }
}

async function quitarLogoActivo() {
    try {
        showLoading();
        await api.put('/logos/establecer', { logo: '' });
        logoActivo = null;
        window.logoFarmacia = null;
        showNotification('Logo removido', 'success');
        renderConfiguracion();
        renderGaleriaLogos();
        actualizarLogoSidebar();
    } catch (error) {
        showNotification('Error al quitar el logo', 'error');
    } finally {
        hideLoading();
    }
}

function actualizarLogoSidebar() {
    const logoContainer = document.querySelector('.sidebar-logo');
    if (logoContainer) {
        if (window.logoFarmacia) {
            logoContainer.innerHTML = `<img src="${window.logoFarmacia}" alt="Logo" class="sidebar-logo-img">`;
        } else {
            logoContainer.innerHTML = `<i class="pi pi-plus"></i>`;
        }
    }
}

async function eliminarLogo(nombre) {
    if (!confirm('¿Está seguro de eliminar este logo?')) return;
    
    try {
        showLoading();
        await api.delete(`/logos/${nombre}`);
        showNotification('Logo eliminado correctamente', 'success');
        await cargarLogos();
        renderGaleriaLogos();
        renderConfiguracion();
        actualizarLogoSidebar();
    } catch (error) {
        showNotification('Error al eliminar el logo', 'error');
    } finally {
        hideLoading();
    }
}

window.initConfiguracion = initConfiguracion;
window.guardarConfiguracion = guardarConfiguracion;
window.setTheme = setTheme;
window.subirLogo = subirLogo;
window.establecerLogo = establecerLogo;
window.quitarLogoActivo = quitarLogoActivo;
window.eliminarLogo = eliminarLogo;
