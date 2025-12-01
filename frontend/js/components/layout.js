function renderMainLayout() {
    const container = document.getElementById('main-container');
    
    container.innerHTML = `
        ${renderSidebar()}
        <div class="mobile-overlay" id="mobileOverlay"></div>
        <div class="main-wrapper">
            ${renderTopbar()}
            <main class="main-content" id="pageContent">
                ${renderDashboard()}
            </main>
        </div>
    `;
    
    window.currentPage = 'dashboard';
    initSidebarEvents();
    initTopbarEvents();
}

function renderPageContent(pageId) {
    const content = document.getElementById('pageContent');
    
    switch (pageId) {
        case 'dashboard':
            content.innerHTML = renderDashboard();
            break;
        case 'punto-venta':
            content.innerHTML = renderComingSoon('Punto de Venta', 'pi-shopping-cart');
            break;
        case 'ventas':
            content.innerHTML = renderComingSoon('Historial de Ventas', 'pi-list');
            break;
        case 'clientes':
            content.innerHTML = renderComingSoon('Gestión de Clientes', 'pi-users');
            break;
        case 'productos':
            content.innerHTML = renderComingSoon('Gestión de Productos', 'pi-box');
            break;
        case 'categorias':
            content.innerHTML = renderComingSoon('Categorías', 'pi-tags');
            break;
        case 'laboratorios':
            content.innerHTML = renderComingSoon('Laboratorios', 'pi-building');
            break;
        case 'lotes':
            content.innerHTML = renderComingSoon('Control de Lotes', 'pi-calendar');
            break;
        case 'movimientos':
            content.innerHTML = renderComingSoon('Movimientos de Inventario', 'pi-arrows-h');
            break;
        case 'nueva-compra':
            content.innerHTML = renderComingSoon('Nueva Compra', 'pi-plus-circle');
            break;
        case 'compras':
            content.innerHTML = renderComingSoon('Historial de Compras', 'pi-file');
            break;
        case 'proveedores':
            content.innerHTML = renderComingSoon('Proveedores', 'pi-truck');
            break;
        case 'reporte-ventas':
            content.innerHTML = renderComingSoon('Reporte de Ventas', 'pi-chart-bar');
            break;
        case 'reporte-inventario':
            content.innerHTML = renderComingSoon('Reporte de Inventario', 'pi-chart-pie');
            break;
        case 'reporte-vencimientos':
            content.innerHTML = renderComingSoon('Productos Próximos a Vencer', 'pi-exclamation-triangle');
            break;
        case 'usuarios':
            content.innerHTML = renderComingSoon('Gestión de Usuarios', 'pi-user-edit');
            break;
        case 'caja':
            content.innerHTML = renderComingSoon('Control de Caja', 'pi-wallet');
            break;
        case 'configuracion':
            content.innerHTML = renderComingSoon('Configuración del Sistema', 'pi-cog');
            break;
        default:
            content.innerHTML = renderDashboard();
    }
}

function renderDashboard() {
    const user = auth.getUser();
    const hora = new Date().getHours();
    let saludo = 'Buenos días';
    if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
    if (hora >= 18) saludo = 'Buenas noches';
    
    return `
        <div class="fade-in">
            <div class="welcome-card">
                <div class="welcome-card-content">
                    <h2 class="welcome-title">${saludo}, ${user?.nombre || 'Usuario'}!</h2>
                    <p class="welcome-text">Bienvenido al Sistema de Gestión de Farmacia. Aquí puedes ver el resumen de tu negocio.</p>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="pi pi-shopping-cart"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Ventas del Día</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">Bs. 0.00</div>
                        <div class="stat-label">Ingresos Hoy</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon purple">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Productos en Stock</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Alertas de Stock</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 24px;">
                <div class="stats-grid">
                    <div class="stat-card" style="grid-column: span 2;">
                        <div style="width: 100%; text-align: center; padding: 40px;">
                            <i class="pi pi-chart-line" style="font-size: 48px; color: var(--violeta-suave); margin-bottom: 16px;"></i>
                            <h3 style="color: var(--texto-oscuro); margin-bottom: 8px;">Gráfica de Ventas</h3>
                            <p style="color: #6c757d; font-size: 13px;">Las estadísticas de ventas aparecerán aquí cuando registres tus primeras ventas.</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div style="width: 100%; text-align: center; padding: 40px;">
                            <i class="pi pi-calendar-times" style="font-size: 48px; color: #f97316; margin-bottom: 16px;"></i>
                            <h3 style="color: var(--texto-oscuro); margin-bottom: 8px;">Próximos a Vencer</h3>
                            <p style="color: #6c757d; font-size: 13px;">Los productos próximos a vencer aparecerán aquí.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderComingSoon(title, icon) {
    return `
        <div class="fade-in">
            <div class="content-header">
                <h1 class="content-title">${title}</h1>
                <p class="content-subtitle">Módulo en desarrollo</p>
            </div>
            
            <div class="stat-card" style="max-width: 500px; margin: 60px auto; text-align: center; padding: 60px 40px;">
                <div style="width: 100%;">
                    <div style="width: 100px; height: 100px; background: linear-gradient(135deg, rgba(0, 194, 255, 0.1), rgba(37, 110, 255, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class="pi ${icon}" style="font-size: 40px; color: var(--azul-primario);"></i>
                    </div>
                    <h2 style="color: var(--texto-oscuro); margin-bottom: 12px; font-size: 22px;">Próximamente</h2>
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">Este módulo estará disponible muy pronto. Estamos trabajando para brindarte la mejor experiencia.</p>
                </div>
            </div>
        </div>
    `;
}

window.renderMainLayout = renderMainLayout;
window.renderPageContent = renderPageContent;
