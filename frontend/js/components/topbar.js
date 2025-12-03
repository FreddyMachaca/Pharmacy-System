function renderTopbar() {
    const user = auth.getUser();
    
    return `
        <header class="topbar">
            <div class="topbar-left">
                <button class="topbar-toggle" id="sidebarToggle" title="Menú">
                    <i class="pi pi-bars"></i>
                </button>
                <h1 class="topbar-title" id="topbarTitle">Dashboard</h1>
            </div>
            
            <div class="topbar-right">
                <div class="topbar-user" id="topbarUser">
                    <div class="topbar-user-avatar">${auth.getUserInitials()}</div>
                    <span class="topbar-user-name">${user?.nombre || 'Usuario'}</span>
                </div>
                
                <button class="topbar-logout" id="logoutBtn" title="Cerrar Sesión">
                    <i class="pi pi-sign-out"></i>
                </button>
            </div>
        </header>
    `;
}

function initTopbarEvents() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        auth.logout();
    }
}

window.renderTopbar = renderTopbar;
window.initTopbarEvents = initTopbarEvents;
