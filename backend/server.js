require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        mensaje: 'Pharmacy System API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        mensaje: 'Error interno del servidor'
    });
});

const iniciarServidor = async () => {
    const dbConectada = await testConnection();
    
    if (!dbConectada) {
        console.error('No se pudo conectar a la base de datos. Verifique que MariaDB esté ejecutándose.');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log('========================================');
        console.log('   PHARMACY SYSTEM   ');
        console.log('   Sistema de Farmacia Local Portable');
        console.log('========================================');
        console.log(`Servidor iniciado en puerto ${PORT}`);
        console.log(`Frontend: http://localhost:${PORT}`);
        console.log(`API: http://localhost:${PORT}/api`);
        console.log('========================================');
    });
};

iniciarServidor();
