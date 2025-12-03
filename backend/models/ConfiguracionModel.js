const { pool } = require('../config/database');

const ConfiguracionModel = {
    async obtenerTodas() {
        const [rows] = await pool.execute(
            'SELECT * FROM configuracion ORDER BY clave'
        );
        return rows;
    },

    async obtenerPorClave(clave) {
        const [rows] = await pool.execute(
            'SELECT * FROM configuracion WHERE clave = ?',
            [clave]
        );
        return rows[0] || null;
    },

    async obtenerValor(clave, valorDefecto = null) {
        const config = await this.obtenerPorClave(clave);
        return config ? config.valor : valorDefecto;
    },

    async actualizar(clave, valor) {
        const existe = await this.obtenerPorClave(clave);
        
        if (existe) {
            await pool.execute(
                'UPDATE configuracion SET valor = ? WHERE clave = ?',
                [valor, clave]
            );
        } else {
            await pool.execute(
                'INSERT INTO configuracion (clave, valor) VALUES (?, ?)',
                [clave, valor]
            );
        }
    },

    async actualizarMultiples(configuraciones) {
        for (const config of configuraciones) {
            await this.actualizar(config.clave, config.valor);
        }
    },

    async obtenerConfiguracionFarmacia() {
        const claves = [
            'nombre_farmacia', 'direccion', 'ciudad', 'departamento',
            'telefono', 'celular', 'nit', 'moneda', 'iva', 'impresora_tickets'
        ];
        
        const config = {};
        for (const clave of claves) {
            config[clave] = await this.obtenerValor(clave, '');
        }
        return config;
    }
};

module.exports = ConfiguracionModel;
