const auth = {
    isAuthenticated() {
        const token = localStorage.getItem('pharmacy_token');
        const user = localStorage.getItem('pharmacy_user');
        return !!(token && user);
    },
    
    getToken() {
        return localStorage.getItem('pharmacy_token');
    },
    
    getUser() {
        const user = localStorage.getItem('pharmacy_user');
        return user ? JSON.parse(user) : null;
    },
    
    setSession(token, user) {
        localStorage.setItem('pharmacy_token', token);
        localStorage.setItem('pharmacy_user', JSON.stringify(user));
    },
    
    clearSession() {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
    },
    
    async login(correo, contrasena) {
        const response = await api.post('/auth/login', { correo, contrasena });
        if (response.success) {
            this.setSession(response.data.token, response.data.usuario);
        }
        return response;
    },
    
    async verificarToken() {
        try {
            const response = await api.get('/auth/verificar');
            return response.success;
        } catch {
            return false;
        }
    },
    
    logout() {
        this.clearSession();
        window.location.reload();
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
    }
};

window.auth = auth;
