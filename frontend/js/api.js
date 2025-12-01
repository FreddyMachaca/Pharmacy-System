const API_URL = window.location.origin + '/api';

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const token = localStorage.getItem('pharmacy_token');
        
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('pharmacy_token');
                    localStorage.removeItem('pharmacy_user');
                    window.location.reload();
                }
                throw new Error(data.mensaje || 'Error en la solicitud');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

window.api = api;
