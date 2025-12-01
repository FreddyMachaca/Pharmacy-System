const app = {
    async init() {
        if (auth.isAuthenticated()) {
            const isValid = await auth.verificarToken();
            if (isValid) {
                this.showMainLayout();
            } else {
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
    },
    
    showLogin() {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('main-container').classList.add('hidden');
        renderLogin();
    },
    
    showMainLayout() {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-container').classList.remove('hidden');
        renderMainLayout();
    }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
