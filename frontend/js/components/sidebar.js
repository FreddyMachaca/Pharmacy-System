const menuItems = {
    principal: [
        { id: 'dashboard', label: 'Dashboard', icon: 'pi-home', roles: ['admin', 'cajero', 'inventario'] }
    ],
    ventas: [
        { id: 'punto-venta', label: 'Punto de Venta', icon: 'pi-shopping-cart', roles: ['admin', 'cajero'] },
        { id: 'ventas', label: 'Historial Ventas', icon: 'pi-list', roles: ['admin', 'cajero'] },
        { id: 'clientes', label: 'Clientes', icon: 'pi-users', roles: ['admin', 'cajero'] }
    ],
    inventario: [
        { id: 'productos', label: 'Productos', icon: 'pi-box', roles: ['admin', 'inventario'] },
        { id: 'categorias', label: 'Categorías', icon: 'pi-tags', roles: ['admin', 'inventario'] },
        { id: 'laboratorios', label: 'Laboratorios', icon: 'pi-building', roles: ['admin', 'inventario'] },
        { id: 'lotes', label: 'Lotes', icon: 'pi-calendar', roles: ['admin', 'inventario'] },
        { id: 'movimientos', label: 'Movimientos', icon: 'pi-arrows-h', roles: ['admin', 'inventario'] }
    ],
    compras: [
        { id: 'nueva-compra', label: 'Nueva Compra', icon: 'pi-plus-circle', roles: ['admin', 'inventario'] },
        { id: 'compras', label: 'Historial Compras', icon: 'pi-file', roles: ['admin', 'inventario'] },
        { id: 'proveedores', label: 'Proveedores', icon: 'pi-truck', roles: ['admin', 'inventario'] }
    ],
    reportes: [
        { id: 'reporte-ventas', label: 'Reporte Ventas', icon: 'pi-chart-bar', roles: ['admin'] },
        { id: 'reporte-inventario', label: 'Reporte Inventario', icon: 'pi-chart-pie', roles: ['admin', 'inventario'] },
        { id: 'reporte-vencimientos', label: 'Próximos a Vencer', icon: 'pi-exclamation-triangle', roles: ['admin', 'inventario'] }
    ],
    sistema: [
        { id: 'usuarios', label: 'Usuarios', icon: 'pi-user-edit', roles: ['admin'] },
        { id: 'caja', label: 'Caja', icon: 'pi-wallet', roles: ['admin', 'cajero'] },
        { id: 'configuracion', label: 'Configuración', icon: 'pi-cog', roles: ['admin'] }
    ]
};

function renderSidebar() {
    const user = auth.getUser();
    const userRole = user?.rol || 'admin';
    
    return `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <i class="pi pi-plus"></i>
                </div>
                <div class="sidebar-brand">
                    <span class="sidebar-brand-name">Pharmacy System</span>
                </div>
            </div>
            
            <nav class="sidebar-menu">
                ${renderMenuSection('Principal', menuItems.principal, userRole)}
                ${renderMenuSection('Ventas', menuItems.ventas, userRole)}
                ${renderMenuSection('Inventario', menuItems.inventario, userRole)}
                ${renderMenuSection('Compras', menuItems.compras, userRole)}
                ${renderMenuSection('Reportes', menuItems.reportes, userRole)}
                ${renderMenuSection('Sistema', menuItems.sistema, userRole)}
            </nav>
            
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="sidebar-user-avatar">${auth.getUserInitials()}</div>
                    <div class="sidebar-user-info">
                        <span class="sidebar-user-name">${auth.getUserFullName()}</span>
                        <span class="sidebar-user-role">${userRole}</span>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

function renderMenuSection(title, items, userRole) {
    const visibleItems = items.filter(item => item.roles.includes(userRole));
    
    if (visibleItems.length === 0) return '';
    
    return `
        <div class="menu-section">
            <div class="menu-section-title">${title}</div>
            ${visibleItems.map(item => renderMenuItem(item)).join('')}
        </div>
    `;
}

function renderMenuItem(item) {
    const isActive = window.currentPage === item.id;
    
    return `
        <a href="#" class="menu-item ${isActive ? 'active' : ''}" data-page="${item.id}">
            <i class="pi ${item.icon} menu-item-icon"></i>
            <span class="menu-item-text">${item.label}</span>
            ${item.badge ? `<span class="menu-item-badge">${item.badge}</span>` : ''}
        </a>
    `;
}

function initSidebarEvents() {
    const sidebar = document.getElementById('sidebar');
    const menuItemElements = document.querySelectorAll('.menu-item');
    const overlay = document.getElementById('mobileOverlay');
    
    menuItemElements.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
            
            if (window.innerWidth <= 991) {
                closeMobileSidebar();
            }
        });
    });
    
    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }
}

function navigateToPage(pageId) {
    window.currentPage = pageId;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });
    
    const pageTitle = getPageTitle(pageId);
    const topbarTitle = document.getElementById('topbarTitle');
    if (topbarTitle) {
        topbarTitle.textContent = pageTitle;
    }
    
    renderPageContent(pageId);
}

function getPageTitle(pageId) {
    const allItems = [
        ...menuItems.principal,
        ...menuItems.ventas,
        ...menuItems.inventario,
        ...menuItems.compras,
        ...menuItems.reportes,
        ...menuItems.sistema
    ];
    
    const item = allItems.find(i => i.id === pageId);
    return item ? item.label : 'Dashboard';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 991) {
        sidebar.classList.toggle('mobile-open');
        document.getElementById('mobileOverlay').classList.toggle('active');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

window.renderSidebar = renderSidebar;
window.initSidebarEvents = initSidebarEvents;
window.toggleSidebar = toggleSidebar;
window.navigateToPage = navigateToPage;
