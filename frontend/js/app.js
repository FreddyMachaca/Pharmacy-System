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

function showLoading() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div class="loader-backdrop">
                <div class="loader-spinner">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Cargando...</span>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'pi-check-circle',
        error: 'pi-times-circle',
        warning: 'pi-exclamation-triangle',
        info: 'pi-info-circle'
    };
    
    notification.innerHTML = `
        <i class="pi ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="pi pi-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('notification-hide');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showNotification = showNotification;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
