let cajaActual = null;
let historialCajas = [];
let ventasDelDia = [];
let ultimaCajaCerrada = null;
let historialPaginacion = { pagina: 1, limite: 10, total: 0 };

async function initCaja() {
    if (!auth.hasPermission('caja', 'ver')) {
        document.getElementById('pageContent').innerHTML = `
            <div class="access-denied">
                <i class="pi pi-lock"></i>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos para acceder a este módulo.</p>
            </div>
        `;
        return;
    }
    
    await cargarEstadoCaja(1);
}

async function cargarEstadoCaja(paginaHistorial = historialPaginacion.pagina || 1) {
    try {
        showLoading();
        const response = await api.get('/caja/estado');
        cajaActual = response.data;
        ultimaCajaCerrada = response.ultimaCajaCerrada || null;
        const limiteHistorial = historialPaginacion.limite || 10;
        const historial = await api.get(`/caja/historial?limite=${limiteHistorial}&pagina=${paginaHistorial}`);
        if (Array.isArray(historial)) {
            historialCajas = historial;
            historialPaginacion = { pagina: 1, limite: limiteHistorial, total: historial.length };
        } else {
            historialCajas = historial.data || [];
            historialPaginacion = {
                pagina: historial.pagina || paginaHistorial,
                limite: historial.limite || limiteHistorial,
                total: historial.total || historialCajas.length
            };
        }
        
        if (cajaActual) {
            ventasDelDia = await api.get(`/caja/${cajaActual.id}/ventas`);
        } else {
            ventasDelDia = [];
        }
        
        renderCaja();
    } catch (error) {
        console.error('Error cargando caja:', error);
        showNotification('Error al cargar estado de caja', 'error');
    } finally {
        hideLoading();
    }
}

function renderCaja() {
    const content = `
        <div class="caja-container">
            <div class="caja-header">
                <h1><i class="pi pi-wallet"></i> Control de Caja</h1>
                ${cajaActual ? `
                    <button class="btn btn-secondary" onclick="actualizarCaja()">
                        <i class="pi pi-refresh"></i> Actualizar
                    </button>
                ` : ''}
            </div>
            
            ${cajaActual ? renderCajaAbierta() : renderCajaCerrada()}
            
            ${cajaActual ? renderVentasDelDia() : ''}
            
            <div class="caja-historial">
                <h2><i class="pi pi-history"></i> Historial de Cajas</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Caja</th>
                                <th>Fecha Apertura</th>
                                <th>Usuario</th>
                                <th>Monto Inicial</th>
                                <th>Fondos Previos</th>
                                <th>Ventas</th>
                                <th>Gastos</th>
                                <th>Monto Final</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderHistorialCajas()}
                        </tbody>
                    </table>
                </div>
                ${renderPaginacionHistorial()}
            </div>
        </div>
        
        ${renderModalAbrirCaja()}
        ${renderModalCerrarCaja()}
        ${renderModalGasto()}
    `;
    
    document.getElementById('pageContent').innerHTML = content;
}

function renderCajaAbierta() {
    const reutilizado = parseFloat(cajaActual.monto_reutilizado || 0);
    const usaFondosPrevios = reutilizado > 0;
    const origen = cajaActual.origen_caja_id ? `Caja #${cajaActual.origen_caja_id}` : 'Cierre anterior';

    return `
        <div class="caja-estado caja-abierta">
            <div class="caja-estado-header">
                <div class="caja-estado-icon">
                    <i class="pi pi-lock-open"></i>
                </div>
                <div class="caja-estado-info">
                    <h2>Caja Abierta</h2>
                    <p>Abierta por: ${cajaActual.usuario_nombre} ${cajaActual.usuario_apellido}</p>
                    <p>Desde: ${formatearFechaHora(cajaActual.fecha_apertura)}</p>
                    ${parseFloat(cajaActual.monto_reutilizado || 0) > 0 ? `<p>Reutilizó: <strong>Bs. ${parseFloat(cajaActual.monto_reutilizado).toFixed(2)}</strong> del cierre anterior</p>` : ''}
                </div>
            </div>
            
            <div class="caja-resumen">
                ${usaFondosPrevios ? `
                    <div class="caja-stat reutiliza-fondos">
                        <span class="stat-label">Fondos reutilizados</span>
                        <span class="stat-value">Bs. ${reutilizado.toFixed(2)}</span>
                        <small>${origen}</small>
                    </div>
                ` : `
                    <div class="caja-stat">
                        <span class="stat-label">Monto Inicial</span>
                        <span class="stat-value">Bs. ${parseFloat(cajaActual.monto_inicial).toFixed(2)}</span>
                    </div>
                `}
                <div class="caja-stat">
                    <span class="stat-label">Ventas del Día</span>
                    <span class="stat-value text-success">Bs. ${parseFloat(cajaActual.ventas_actuales || 0).toFixed(2)}</span>
                </div>
                <div class="caja-stat">
                    <span class="stat-label">Gastos</span>
                    <span class="stat-value text-danger">Bs. ${parseFloat(cajaActual.monto_gastos || 0).toFixed(2)}</span>
                </div>
                <div class="caja-stat caja-stat-total">
                    <span class="stat-label">Saldo Actual</span>
                    <span class="stat-value">Bs. ${parseFloat(cajaActual.saldo_actual || 0).toFixed(2)}</span>
                </div>
            </div>
            
            <div class="caja-info-extra">
                <p><i class="pi pi-shopping-cart"></i> ${cajaActual.cantidad_ventas || 0} ventas realizadas</p>
            </div>
            
            <div class="caja-acciones">
                ${auth.hasPermission('caja', 'editar') ? `
                    <button class="btn btn-warning" onclick="abrirModalGasto()">
                        <i class="pi pi-money-bill"></i> Registrar Gasto
                    </button>
                    <button class="btn btn-danger" onclick="abrirModalCerrarCaja()">
                        <i class="pi pi-lock"></i> Cerrar Caja
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderCajaCerrada() {
    return `
        <div class="caja-estado caja-cerrada">
            <div class="caja-estado-header">
                <div class="caja-estado-icon">
                    <i class="pi pi-lock"></i>
                </div>
                <div class="caja-estado-info">
                    <h2>Caja Cerrada</h2>
                    <p>No hay una caja abierta actualmente</p>
                </div>
            </div>
            
            <div class="caja-acciones">
                ${auth.hasPermission('caja', 'crear') ? `
                    <button class="btn btn-primary btn-lg" onclick="abrirModalAbrirCaja()">
                        <i class="pi pi-lock-open"></i> Abrir Caja
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderHistorialCajas() {
    if (!historialCajas || historialCajas.length === 0) {
        return `<tr><td colspan="9" class="empty-table">No hay registros de caja</td></tr>`;
    }
    
    return historialCajas.map(c => {
        const estadoClass = c.estado === 'abierta' ? 'badge-success' : 'badge-secondary';
        return `
            <tr>
                <td><strong>Caja #${c.id}</strong></td>
                <td>${formatearFechaHora(c.fecha_apertura)}</td>
                <td>${c.usuario_nombre} ${c.usuario_apellido}</td>
                <td>Bs. ${parseFloat(c.monto_inicial).toFixed(2)}</td>
                <td>${renderFondosPrevios(c)}</td>
                <td class="text-success">Bs. ${parseFloat(c.monto_ventas || 0).toFixed(2)}</td>
                <td class="text-danger">Bs. ${parseFloat(c.monto_gastos || 0).toFixed(2)}</td>
                <td><strong>Bs. ${parseFloat(c.monto_final || 0).toFixed(2)}</strong></td>
                <td><span class="badge ${estadoClass}">${c.estado}</span></td>
            </tr>
        `;
    }).join('');
}

function renderFondosPrevios(caja) {
    const reutilizado = parseFloat(caja.monto_reutilizado || 0);
    if (!reutilizado || reutilizado <= 0) {
        return '<span class="fondo-previo-no">—</span>';
    }
    const origen = caja.origen_caja_id ? `Caja #${caja.origen_caja_id}` : 'Cierre anterior';
    return `
        <div class="fondo-previo">
            <span class="fondo-previo-valor">Bs. ${reutilizado.toFixed(2)}</span>
            <small>${origen}</small>
        </div>
    `;
}

function renderPaginacionHistorial() {
    const total = historialPaginacion.total || historialCajas.length || 0;
    if (total === 0) return '';
    const limite = historialPaginacion.limite || 10;
    const pagina = historialPaginacion.pagina || 1;
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const inicio = (pagina - 1) * limite + 1;
    const fin = Math.min(pagina * limite, total);
    const prevDisabled = pagina === 1 ? 'disabled' : '';
    const nextDisabled = pagina === totalPaginas ? 'disabled' : '';

    let paginas = '';
    for (let i = 1; i <= totalPaginas; i++) {
        if (i === 1 || i === totalPaginas || (i >= pagina - 1 && i <= pagina + 1)) {
            paginas += `<button class="pagination-btn ${i === pagina ? 'active' : ''}" onclick="cambiarPaginaHistorial(${i})">${i}</button>`;
        } else if (i === pagina - 2 || i === pagina + 2) {
            paginas += '<span class="pagination-dots">...</span>';
        }
    }

    return `
        <div class="table-pagination">
            <div class="pagination-info">
                Mostrando ${inicio}-${fin} de ${total} cajas
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" onclick="cambiarPaginaHistorial(${pagina - 1})" ${prevDisabled}>
                    <i class="pi pi-angle-left"></i>
                </button>
                ${paginas}
                <button class="pagination-btn" onclick="cambiarPaginaHistorial(${pagina + 1})" ${nextDisabled}>
                    <i class="pi pi-angle-right"></i>
                </button>
            </div>
        </div>
    `;
}

function renderModalAbrirCaja() {
    const disponibleAnterior = ultimaCajaCerrada ? parseFloat(ultimaCajaCerrada.monto_final || 0) : 0;
    const puedeReutilizar = disponibleAnterior > 0;
    const fechaAnterior = ultimaCajaCerrada ? formatearFechaHora(ultimaCajaCerrada.fecha_cierre || ultimaCajaCerrada.fecha_apertura) : '';
    const disponibleTexto = disponibleAnterior.toFixed(2);
    return `
        <div class="modal-overlay" id="modal-abrir-caja" style="display: none;">
            <div class="modal-container modal-sm">
                <div class="modal-header">
                    <h3><i class="pi pi-lock-open"></i> Abrir Caja</h3>
                    <button class="modal-close" onclick="cerrarModalAbrirCaja()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${puedeReutilizar ? `
                        <div class="fondo-anterior-card">
                            <div class="fondo-anterior-header">
                                <div>
                                    <p class="fondo-label">Saldo disponible del cierre anterior</p>
                                    <p class="fondo-valor">Bs. ${disponibleTexto}</p>
                                    <small>${fechaAnterior}</small>
                                </div>
                                <label class="fondo-toggle">
                                    <input type="checkbox" id="usar-fondo-anterior" onchange="toggleFondosAnteriores()">
                                    <span>Utilizar fondos del día anterior</span>
                                </label>
                            </div>
                            <div class="form-group fondo-reutilizado-grupo" id="grupo-monto-reutilizado" style="display: none;">
                                <label for="monto-reutilizado">Monto a reutilizar (max. Bs. ${disponibleTexto})</label>
                                <input type="number" id="monto-reutilizado" min="0" step="0.01" data-max="${disponibleTexto}" value="" inputmode="decimal" autocomplete="off" disabled oninput="validarMontoReutilizado()">
                                <small>Se mostrará en el historial de caja.</small>
                            </div>
                        </div>
                    ` : ''}
                    <div class="form-group" id="grupo-monto-inicial">
                        <label for="monto-inicial">Monto Inicial (Bs.) *</label>
                        <input type="number" id="monto-inicial" min="0" step="0.01" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="observaciones-apertura">Observaciones</label>
                        <textarea id="observaciones-apertura" rows="3" placeholder="Observaciones opcionales..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalAbrirCaja()">Cancelar</button>
                    <button class="btn btn-primary" onclick="abrirCaja()">
                        <i class="pi pi-check"></i> Abrir Caja
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderModalCerrarCaja() {
    return `
        <div class="modal-overlay" id="modal-cerrar-caja" style="display: none;">
            <div class="modal-container modal-sm">
                <div class="modal-header">
                    <h3><i class="pi pi-lock"></i> Cerrar Caja</h3>
                    <button class="modal-close" onclick="cerrarModalCerrarCaja()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="cierre-resumen">
                        <p><strong>Monto Inicial:</strong> Bs. ${cajaActual ? parseFloat(cajaActual.monto_inicial).toFixed(2) : '0.00'}</p>
                        <p><strong>Ventas:</strong> Bs. ${cajaActual ? parseFloat(cajaActual.ventas_actuales || 0).toFixed(2) : '0.00'}</p>
                        <p><strong>Gastos:</strong> Bs. ${cajaActual ? parseFloat(cajaActual.monto_gastos || 0).toFixed(2) : '0.00'}</p>
                        <p class="cierre-total"><strong>Total a Entregar:</strong> Bs. ${cajaActual ? parseFloat(cajaActual.saldo_actual || 0).toFixed(2) : '0.00'}</p>
                    </div>
                    <div class="form-group">
                        <label for="observaciones-cierre">Observaciones de Cierre</label>
                        <textarea id="observaciones-cierre" rows="3" placeholder="Observaciones del cierre..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalCerrarCaja()">Cancelar</button>
                    <button class="btn btn-danger" onclick="cerrarCaja()">
                        <i class="pi pi-lock"></i> Confirmar Cierre
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderModalGasto() {
    return `
        <div class="modal-overlay" id="modal-gasto" style="display: none;">
            <div class="modal-container modal-sm">
                <div class="modal-header">
                    <h3><i class="pi pi-money-bill"></i> Registrar Gasto</h3>
                    <button class="modal-close" onclick="cerrarModalGasto()">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="monto-gasto">Monto del Gasto (Bs.) *</label>
                        <input type="number" id="monto-gasto" min="0.01" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="descripcion-gasto">Descripción *</label>
                        <textarea id="descripcion-gasto" rows="3" placeholder="Descripción del gasto..." required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalGasto()">Cancelar</button>
                    <button class="btn btn-primary" onclick="registrarGasto()">
                        <i class="pi pi-check"></i> Registrar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function abrirModalAbrirCaja() {
    const modal = document.getElementById('modal-abrir-caja');
    if (!modal) return;
    modal.style.display = 'flex';
    const montoInicialInput = document.getElementById('monto-inicial');
    const grupoMontoInicial = document.getElementById('grupo-monto-inicial');
    if (montoInicialInput) {
        montoInicialInput.value = '0';
        if (grupoMontoInicial) {
            grupoMontoInicial.style.display = 'block';
        }
    }
    const observacionesInput = document.getElementById('observaciones-apertura');
    if (observacionesInput) {
        observacionesInput.value = '';
    }
    const checkbox = document.getElementById('usar-fondo-anterior');
    const reutilizadoInput = document.getElementById('monto-reutilizado');
    const grupo = document.getElementById('grupo-monto-reutilizado');
    if (checkbox && reutilizadoInput) {
        checkbox.checked = false;
        reutilizadoInput.disabled = true;
        reutilizadoInput.value = '';
        if (grupo) {
            grupo.style.display = 'none';
        }
    }
}

function cerrarModalAbrirCaja() {
    const modal = document.getElementById('modal-abrir-caja');
    if (modal) {
        modal.style.display = 'none';
    }
}

function abrirModalCerrarCaja() {
    const modal = document.getElementById('modal-cerrar-caja');
    if (!modal) return;
    const observacionesInput = document.getElementById('observaciones-cierre');
    if (observacionesInput) {
        observacionesInput.value = '';
    }
    modal.style.display = 'flex';
}

function cerrarModalCerrarCaja() {
    const modal = document.getElementById('modal-cerrar-caja');
    if (modal) {
        modal.style.display = 'none';
    }
}

function abrirModalGasto() {
    const modal = document.getElementById('modal-gasto');
    if (!modal) return;
    const montoInput = document.getElementById('monto-gasto');
    if (montoInput) {
        montoInput.value = '';
    }
    const descripcionInput = document.getElementById('descripcion-gasto');
    if (descripcionInput) {
        descripcionInput.value = '';
    }
    modal.style.display = 'flex';
}

function cerrarModalGasto() {
    const modal = document.getElementById('modal-gasto');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function abrirCaja() {
    const montoInicial = parseFloat(document.getElementById('monto-inicial').value) || 0;
    const observaciones = document.getElementById('observaciones-apertura').value.trim();
    const checkbox = document.getElementById('usar-fondo-anterior');
    const reutilizadoInput = document.getElementById('monto-reutilizado');
    const usarFondos = checkbox ? checkbox.checked : false;
    let montoReutilizado = 0;
    let origenCajaId = null;
    const disponibleAnterior = ultimaCajaCerrada ? parseFloat(ultimaCajaCerrada.monto_final || 0) : 0;

    if (usarFondos) {
        if (!ultimaCajaCerrada || !ultimaCajaCerrada.id) {
            showNotification('No existe una caja anterior para reutilizar fondos', 'warning');
            return;
        }
        montoReutilizado = reutilizadoInput ? parseFloat(reutilizadoInput.value) || 0 : 0;
        if (montoReutilizado <= 0) {
            showNotification('El monto a reutilizar debe ser mayor a 0', 'warning');
            return;
        }
        if (montoReutilizado > disponibleAnterior) {
            showNotification('El monto reutilizado no puede superar el saldo anterior disponible', 'warning');
            return;
        }
        origenCajaId = ultimaCajaCerrada.id;
    }

    if (montoInicial <= 0 && montoReutilizado <= 0) {
        showNotification('Ingrese un monto inicial válido o reutilice fondos del cierre anterior', 'warning');
        return;
    }
    
    try {
        showLoading();
        await api.post('/caja/abrir', {
            monto_inicial: montoInicial,
            observaciones,
            monto_reutilizado: montoReutilizado,
            origen_caja_id: origenCajaId
        });
        showNotification('Caja abierta correctamente', 'success');
        cerrarModalAbrirCaja();
        await cargarEstadoCaja();
    } catch (error) {
        showNotification(error.message || 'Error al abrir caja', 'error');
    } finally {
        hideLoading();
    }
}

async function cerrarCaja() {
    if (!cajaActual) return;
    
    const observaciones = document.getElementById('observaciones-cierre').value.trim();
    
    if (!confirm('¿Está seguro de cerrar la caja? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        showLoading();
        await api.post(`/caja/${cajaActual.id}/cerrar`, { observaciones });
        showNotification('Caja cerrada correctamente', 'success');
        cerrarModalCerrarCaja();
        await cargarEstadoCaja();
    } catch (error) {
        showNotification(error.message || 'Error al cerrar caja', 'error');
    } finally {
        hideLoading();
    }
}

function toggleFondosAnteriores() {
    const checkbox = document.getElementById('usar-fondo-anterior');
    const reutilizadoInput = document.getElementById('monto-reutilizado');
    const grupo = document.getElementById('grupo-monto-reutilizado');
    const montoInicialInput = document.getElementById('monto-inicial');
    const grupoMontoInicial = document.getElementById('grupo-monto-inicial');
    if (!checkbox || !reutilizadoInput || !grupo) return;
    if (checkbox.checked) {
        reutilizadoInput.disabled = false;
        reutilizadoInput.value = '';
        grupo.style.display = 'block';
        reutilizadoInput.focus();
        if (grupoMontoInicial) {
            grupoMontoInicial.style.display = 'none';
        }
        if (montoInicialInput) {
            montoInicialInput.value = '0';
        }
    } else {
        reutilizadoInput.disabled = true;
        reutilizadoInput.value = '';
        grupo.style.display = 'none';
        if (grupoMontoInicial) {
            grupoMontoInicial.style.display = 'block';
        }
        if (montoInicialInput) {
            montoInicialInput.focus();
        }
    }
}

function validarMontoReutilizado() {
    const reutilizadoInput = document.getElementById('monto-reutilizado');
    if (!reutilizadoInput) return;
    const max = parseFloat(reutilizadoInput.dataset.max || '0') || 0;
    const valorTexto = reutilizadoInput.value;
    if (valorTexto === '') {
        return;
    }
    let valor = parseFloat(valorTexto);
    if (isNaN(valor)) {
        reutilizadoInput.value = '';
        return;
    }
    if (valor < 0) {
        valor = 0;
    }
    if (valor > max) {
        valor = max;
        showNotification('No puede reutilizar más de lo disponible del cierre anterior', 'warning');
    }
    reutilizadoInput.value = valor.toString();
}

async function registrarGasto() {
    if (!cajaActual) return;
    
    const monto = parseFloat(document.getElementById('monto-gasto').value);
    const descripcion = document.getElementById('descripcion-gasto').value.trim();
    
    if (!monto || monto <= 0) {
        showNotification('Ingrese un monto válido', 'warning');
        return;
    }
    
    if (!descripcion) {
        showNotification('Ingrese una descripción', 'warning');
        return;
    }
    
    try {
        showLoading();
        await api.post(`/caja/${cajaActual.id}/gasto`, { monto, descripcion });
        showNotification('Gasto registrado correctamente', 'success');
        cerrarModalGasto();
        await cargarEstadoCaja();
    } catch (error) {
        showNotification(error.message || 'Error al registrar gasto', 'error');
    } finally {
        hideLoading();
    }
}

async function actualizarCaja() {
    await cargarEstadoCaja();
    showNotification('Datos actualizados', 'success');
}

async function cambiarPaginaHistorial(pagina) {
    const totalPaginas = Math.max(1, Math.ceil((historialPaginacion.total || 0) / (historialPaginacion.limite || 10)));
    if (pagina < 1 || pagina > totalPaginas || pagina === historialPaginacion.pagina) {
        return;
    }
    await cargarEstadoCaja(pagina);
}

function renderVentasDelDia() {
    if (!ventasDelDia || ventasDelDia.length === 0) {
        return `
            <div class="caja-ventas-dia">
                <h2><i class="pi pi-shopping-cart"></i> Ventas de esta Caja</h2>
                <p class="empty-message">No hay ventas registradas desde la apertura de caja</p>
            </div>
        `;
    }
    
    return `
        <div class="caja-ventas-dia">
            <h2><i class="pi pi-shopping-cart"></i> Ventas de esta Caja (${ventasDelDia.length})</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>N° Venta</th>
                            <th>Hora</th>
                            <th>Cliente</th>
                            <th>Método Pago</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ventasDelDia.map(v => `
                            <tr>
                                <td>${v.numero_venta}</td>
                                <td>${formatearHoraCorta(v.fecha_venta)}</td>
                                <td>${v.cliente_nombre || 'Cliente General'}</td>
                                <td><span class="badge badge-info">${v.metodo_pago}</span></td>
                                <td><strong>Bs. ${parseFloat(v.total).toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function formatearFechaHora(fecha) {
    if (!fecha) return '';
    const formatter = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(new Date(fecha));
}

function formatearHoraCorta(fecha) {
    if (!fecha) return '';
    const formatter = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(new Date(fecha));
}

window.initCaja = initCaja;
window.abrirModalAbrirCaja = abrirModalAbrirCaja;
window.cerrarModalAbrirCaja = cerrarModalAbrirCaja;
window.abrirModalCerrarCaja = abrirModalCerrarCaja;
window.cerrarModalCerrarCaja = cerrarModalCerrarCaja;
window.abrirModalGasto = abrirModalGasto;
window.cerrarModalGasto = cerrarModalGasto;
window.abrirCaja = abrirCaja;
window.cerrarCaja = cerrarCaja;
window.registrarGasto = registrarGasto;
window.actualizarCaja = actualizarCaja;
window.toggleFondosAnteriores = toggleFondosAnteriores;
window.validarMontoReutilizado = validarMontoReutilizado;
window.cambiarPaginaHistorial = cambiarPaginaHistorial;
