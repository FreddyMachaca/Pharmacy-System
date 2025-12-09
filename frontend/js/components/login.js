async function cargarNombreFarmacia() {
    try {
        const response = await fetch('/api/public/nombre-farmacia');
        const data = await response.json();
        return data.nombre || 'Pharmacy System';
    } catch (error) {
        return 'Pharmacy System';
    }
}

async function renderLogin() {
    const container = document.getElementById('login-container');
    const nombreFarmacia = await cargarNombreFarmacia();
    window.nombreFarmacia = nombreFarmacia;
    
    container.innerHTML = `
        <div class="login-wrapper fade-in">
            <div class="login-card">
                <div class="login-header">
                    <h1 class="login-title">${nombreFarmacia}</h1>
                    <p class="login-subtitle">Sistema de Gestión de Farmacia</p>
                </div>
                
                <div class="login-body">
                    <form class="login-form" id="loginForm">
                        <div id="loginError" class="login-error hidden">
                            <i class="pi pi-exclamation-circle"></i>
                            <span id="loginErrorText"></span>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="pi pi-envelope"></i>
                                Correo electrónico
                            </label>
                            <div class="form-input-wrapper">
                                <i class="pi pi-at input-icon"></i>
                                <input 
                                    type="email" 
                                    id="loginEmail" 
                                    class="p-inputtext" 
                                    placeholder="correo@ejemplo.com"
                                    autocomplete="email"
                                    required
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="pi pi-lock"></i>
                                Contraseña
                            </label>
                            <div class="form-input-wrapper">
                                <i class="pi pi-key input-icon"></i>
                                <input 
                                    type="password" 
                                    id="loginPassword" 
                                    class="p-inputtext" 
                                    placeholder="••••••••"
                                    autocomplete="current-password"
                                    required
                                >
                                <button type="button" class="password-toggle" id="togglePassword">
                                    <i class="pi pi-eye"></i>
                                </button>
                            </div>
                        </div>
                        
                        <button type="submit" class="login-btn" id="loginBtn">
                            <span>Iniciar Sesión</span>
                            <i class="pi pi-sign-in"></i>
                        </button>
                    </form>
                </div>
                
                <div class="login-footer">
                    <p class="login-footer-text">
                        <strong>${nombreFarmacia}</strong> | Sistema Local Portable
                    </p>
                </div>
            </div>
        </div>
    `;
    
    initLoginEvents();
}

function initLoginEvents() {
    const form = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('loginPassword');
    
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.querySelector('i').className = type === 'password' ? 'pi pi-eye' : 'pi pi-eye-slash';
    });
    
    form.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    if (!email || !password) {
        showLoginError('Por favor complete todos los campos');
        return;
    }
    
    errorDiv.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="btn-loader"></div><span>Ingresando...</span>';
    
    try {
        const response = await auth.login(email, password);
        
        if (response.success) {
            window.app.showMainLayout();
        }
    } catch (error) {
        showLoginError(error.message || 'Error al iniciar sesión');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Iniciar Sesión</span><i class="pi pi-sign-in"></i>';
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

window.renderLogin = renderLogin;
