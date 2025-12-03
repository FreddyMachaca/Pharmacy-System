const auth = {
    tokenCheckInterval: null,
    
    isAuthenticated() {
        const token = sessionStorage.getItem('pharmacy_token');
        const user = sessionStorage.getItem('pharmacy_user');
        return !!(token && user);
    },
    
    getToken() {
        return sessionStorage.getItem('pharmacy_token');
    },
    
    getUser() {
        const user = sessionStorage.getItem('pharmacy_user');
        return user ? JSON.parse(user) : null;
    },
    
    getPermisos() {
        const permisos = sessionStorage.getItem('pharmacy_permisos');
        return permisos ? JSON.parse(permisos) : {};
    },
    
    tienePermiso(modulo, accion = 'ver') {
        const user = this.getUser();
        if (user && user.rol === 'admin') return true;
        
        const permisos = this.getPermisos();
        const permisoModulo = permisos[modulo];
        if (!permisoModulo) return false;
        
        return permisoModulo[accion] === true;
    },
    
    hasPermission(modulo, accion = 'ver') {
        return this.tienePermiso(modulo, accion);
    },
    
    puedeAccederModulo(modulo) {
        return this.tienePermiso(modulo, 'ver');
    },
    
    setSession(token, user, permisos, expiresIn) {
        sessionStorage.setItem('pharmacy_token', token);
        sessionStorage.setItem('pharmacy_user', JSON.stringify(user));
        sessionStorage.setItem('pharmacy_permisos', JSON.stringify(permisos || {}));
        
        if (expiresIn) {
            const expiresAt = Date.now() + this.parseExpiresIn(expiresIn);
            sessionStorage.setItem('pharmacy_expires', expiresAt.toString());
        }
        
        this.startTokenCheck();
    },
    
    parseExpiresIn(expiresIn) {
        if (typeof expiresIn === 'number') return expiresIn * 1000;
        
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 3600000;
        
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 3600000;
        }
    },
    
    startTokenCheck() {
        this.stopTokenCheck();
        
        this.tokenCheckInterval = setInterval(() => {
            this.checkTokenExpiry();
        }, 30000);
    },
    
    stopTokenCheck() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    },
    
    checkTokenExpiry() {
        const expiresAt = sessionStorage.getItem('pharmacy_expires');
        if (!expiresAt) return;
        
        const timeLeft = parseInt(expiresAt) - Date.now();
        
        if (timeLeft <= 0) {
            this.handleSessionExpired();
        } else if (timeLeft <= 300000) {
            this.showExpiryWarning(Math.floor(timeLeft / 60000));
        }
    },
    
    showExpiryWarning(minutesLeft) {
        const existingWarning = document.querySelector('.session-warning');
        if (existingWarning) return;
        
        const warning = document.createElement('div');
        warning.className = 'session-warning';
        warning.innerHTML = `
            <div class="session-warning-content">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Su sesión expirará en ${minutesLeft} minuto(s)</span>
                <button onclick="auth.extendSession()">Extender</button>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(warning);
    },
    
    async extendSession() {
        try {
            const response = await api.get('/auth/verificar');
            if (response.success) {
                const warning = document.querySelector('.session-warning');
                if (warning) warning.remove();
            }
        } catch (error) {
            this.handleSessionExpired();
        }
    },
    
    handleSessionExpired() {
        this.stopTokenCheck();
        sessionStorage.clear();
        
        const modal = document.createElement('div');
        modal.className = 'session-expired-modal';
        modal.innerHTML = `
            <div class="session-expired-content">
                <i class="pi pi-lock"></i>
                <h3>Sesión Expirada</h3>
                <p>Su sesión ha expirado. Por favor inicie sesión nuevamente.</p>
                <button onclick="window.location.reload()">Iniciar Sesión</button>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    clearSession() {
        this.stopTokenCheck();
        sessionStorage.clear();
    },
    
    async login(correo, contrasena) {
        const response = await api.post('/auth/login', { correo, contrasena });
        if (response.success) {
            this.setSession(
                response.data.token, 
                response.data.usuario, 
                response.data.permisos,
                response.data.expiresIn
            );
        }
        return response;
    },
    
    async verificarToken() {
        try {
            const response = await api.get('/auth/verificar');
            if (response.success && response.data.permisos) {
                sessionStorage.setItem('pharmacy_permisos', JSON.stringify(response.data.permisos));
            }
            return response.success;
        } catch {
            return false;
        }
    },
    
    async logout() {
        try {
            await api.post('/auth/logout', {});
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearSession();
            window.location.reload();
        }
    },
    
    getUserInitials() {
        const user = this.getUser();
        if (!user) return '?';
        const nombre = user.nombre || '';
        const apellido = user.apellido || '';
        return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    },
    
    getUserFullName() {
        const user = this.getUser();
        if (!user) return 'Usuario';
        return `${user.nombre} ${user.apellido}`;
    },
    
    getUserRole() {
        const user = this.getUser();
        return user ? user.rol : '';
    },
    
    init() {
        if (this.isAuthenticated()) {
            this.startTokenCheck();
            this.checkTokenExpiry();
        }
    }
};

window.auth = auth;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => auth.init());
} else {
    auth.init();
}
