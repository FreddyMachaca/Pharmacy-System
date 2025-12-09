function renderTopbar() {
    const user = auth.getUser();
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeIcon = currentTheme === 'dark' ? 'pi-sun' : 'pi-moon';
    const themeTitle = currentTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    
    return `
        <header class="topbar">
            <div class="topbar-left">
                <button class="topbar-toggle" id="sidebarToggle" title="Menú">
                    <i class="pi pi-bars"></i>
                </button>
                <h1 class="topbar-title" id="topbarTitle">Dashboard</h1>
            </div>
            
            <div class="topbar-right">
                <button class="topbar-theme-toggle" id="themeToggle" title="${themeTitle}">
                    <i class="pi ${themeIcon}"></i>
                </button>
                
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
    const themeToggle = document.getElementById('themeToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'pi pi-sun' : 'pi pi-moon';
        themeToggle.title = newTheme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function handleLogout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        auth.logout();
    }
}

window.renderTopbar = renderTopbar;
window.initTopbarEvents = initTopbarEvents;
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
