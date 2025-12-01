const formatearFecha = (fecha, formato = 'DD/MM/YYYY') => {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');

    switch (formato) {
        case 'DD/MM/YYYY':
            return `${dia}/${mes}/${anio}`;
        case 'YYYY-MM-DD':
            return `${anio}-${mes}-${dia}`;
        case 'DD/MM/YYYY HH:mm':
            return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
        default:
            return `${dia}/${mes}/${anio}`;
    }
};

const generarCodigoVenta = (prefijo = 'V') => {
    const fecha = new Date();
    const anio = fecha.getFullYear().toString().slice(-2);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefijo}${anio}${mes}${dia}${random}`;
};

const calcularPorcentaje = (valor, porcentaje) => {
    return (valor * porcentaje) / 100;
};

const redondear = (numero, decimales = 2) => {
    return Math.round(numero * Math.pow(10, decimales)) / Math.pow(10, decimales);
};

module.exports = {
    formatearFecha,
    generarCodigoVenta,
    calcularPorcentaje,
    redondear
};
