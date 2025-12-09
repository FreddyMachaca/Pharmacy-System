const path = require('path');
const fs = require('fs');
const ConfiguracionModel = require('../models/ConfiguracionModel');

const LOGOS_DIR = path.join(__dirname, '../../uploads/logos');
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function ensureLogosDir() {
    if (!fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(LOGOS_DIR, { recursive: true });
    }
}

const LogoController = {
    async subirLogo(req, res) {
        try {
            ensureLogosDir();
            
            if (!req.files || !req.files.logo) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'No se ha enviado ningún archivo'
                });
            }

            const archivo = req.files.logo;
            
            if (archivo.size > MAX_FILE_SIZE) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El archivo excede el tamaño máximo de 50MB'
                });
            }

            const extensionesValidas = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
            const extension = path.extname(archivo.name).toLowerCase();
            
            if (!extensionesValidas.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Formato de archivo no válido. Use: PNG, JPG, GIF, WEBP o SVG'
                });
            }

            const nombreArchivo = `logo_${Date.now()}${extension}`;
            const rutaDestino = path.join(LOGOS_DIR, nombreArchivo);

            await archivo.mv(rutaDestino);

            res.json({
                success: true,
                mensaje: 'Logo subido correctamente',
                logo: {
                    nombre: nombreArchivo,
                    url: `/uploads/logos/${nombreArchivo}`
                }
            });
        } catch (error) {
            console.error('Error al subir logo:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al subir el logo'
            });
        }
    },

    async listarLogos(req, res) {
        try {
            ensureLogosDir();
            
            const archivos = fs.readdirSync(LOGOS_DIR);
            const logos = archivos
                .filter(archivo => {
                    const ext = path.extname(archivo).toLowerCase();
                    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);
                })
                .map(archivo => ({
                    nombre: archivo,
                    url: `/uploads/logos/${archivo}`
                }));

            const logoActivo = await ConfiguracionModel.obtenerValor('logo_farmacia', null);

            res.json({
                success: true,
                logos,
                logoActivo
            });
        } catch (error) {
            console.error('Error al listar logos:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al obtener los logos'
            });
        }
    },

    async establecerLogoActivo(req, res) {
        try {
            const { logo } = req.body;
            
            await ConfiguracionModel.actualizar('logo_farmacia', logo || '');
            
            res.json({
                success: true,
                mensaje: logo ? 'Logo establecido correctamente' : 'Logo removido'
            });
        } catch (error) {
            console.error('Error al establecer logo:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al establecer el logo'
            });
        }
    },

    async eliminarLogo(req, res) {
        try {
            const { nombre } = req.params;
            
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Nombre de archivo requerido'
                });
            }

            const rutaArchivo = path.join(LOGOS_DIR, nombre);
            
            if (!fs.existsSync(rutaArchivo)) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Archivo no encontrado'
                });
            }

            const logoActivo = await ConfiguracionModel.obtenerValor('logo_farmacia', null);
            if (logoActivo === `/uploads/logos/${nombre}`) {
                await ConfiguracionModel.actualizar('logo_farmacia', '');
            }

            fs.unlinkSync(rutaArchivo);

            res.json({
                success: true,
                mensaje: 'Logo eliminado correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar logo:', error);
            res.status(500).json({
                success: false,
                mensaje: 'Error al eliminar el logo'
            });
        }
    },

    async obtenerLogoActivo(req, res) {
        try {
            const logoActivo = await ConfiguracionModel.obtenerValor('logo_farmacia', null);
            
            res.json({
                success: true,
                logo: logoActivo || null
            });
        } catch (error) {
            res.json({
                success: true,
                logo: null
            });
        }
    }
};

module.exports = LogoController;
