function renderMainLayout() {
    const container = document.getElementById('main-container');
    
    container.innerHTML = `
        ${renderSidebar()}
        <div class="mobile-overlay" id="mobileOverlay"></div>
        <div class="main-wrapper">
            ${renderTopbar()}
            <main class="main-content" id="pageContent">
            </main>
        </div>
    `;
    
    initSidebarEvents();
    initTopbarEvents();
    
    const savedPage = localStorage.getItem('pharmacy_current_page') || 'dashboard';
    window.currentPage = savedPage;
    renderPageContent(savedPage);
    
    const menuItems = document.querySelectorAll('.sidebar-menu li[data-page]');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === savedPage) {
            item.classList.add('active');
        }
    });
}

function renderPageContent(pageId) {
    const content = document.getElementById('pageContent');
    
    window.currentPage = pageId;
    localStorage.setItem('pharmacy_current_page', pageId);
    
    switch (pageId) {
        case 'dashboard':
            content.innerHTML = renderDashboard();
            initDashboard();
            break;
        case 'punto-venta':
            if (typeof initPuntoVenta === 'function') {
                initPuntoVenta();
            } else {
                content.innerHTML = renderComingSoon('Punto de Venta', 'pi-shopping-cart');
            }
            break;
        case 'ventas':
            if (typeof initHistorialVentas === 'function') {
                initHistorialVentas();
            } else {
                content.innerHTML = renderComingSoon('Historial de Ventas', 'pi-list');
            }
            break;
        case 'clientes':
            if (typeof initClientes === 'function') {
                initClientes();
            } else {
                content.innerHTML = renderComingSoon('Gestión de Clientes', 'pi-users');
            }
            break;
        case 'productos':
            if (typeof initProductos === 'function') {
                initProductos();
            } else {
                content.innerHTML = renderComingSoon('Gestión de Productos', 'pi-box');
            }
            break;
        case 'categorias':
            if (typeof initCategorias === 'function') {
                initCategorias();
            } else {
                content.innerHTML = renderComingSoon('Categorías', 'pi-tags');
            }
            break;
        case 'laboratorios':
            if (typeof initLaboratorios === 'function') {
                initLaboratorios();
            } else {
                content.innerHTML = renderComingSoon('Laboratorios', 'pi-building');
            }
            break;
        case 'lotes':
            if (typeof initLotes === 'function') {
                initLotes();
            } else {
                content.innerHTML = renderComingSoon('Control de Lotes', 'pi-calendar');
            }
            break;
        case 'movimientos':
            if (typeof initMovimientos === 'function') {
                initMovimientos();
            } else {
                content.innerHTML = renderComingSoon('Movimientos de Inventario', 'pi-arrows-h');
            }
            break;
        case 'nueva-compra':
            content.innerHTML = renderComingSoon('Nueva Compra', 'pi-plus-circle');
            break;
        case 'compras':
            content.innerHTML = renderComingSoon('Historial de Compras', 'pi-file');
            break;
        case 'proveedores':
            content.innerHTML = renderComingSoon('Proveedores', 'pi-truck');
            break;
        case 'reporte-ventas':
            if (typeof initReporteVentas === 'function') {
                initReporteVentas();
            } else {
                content.innerHTML = renderComingSoon('Reporte de Ventas', 'pi-chart-bar');
            }
            break;
        case 'reporte-inventario':
            if (typeof initReporteInventario === 'function') {
                initReporteInventario();
            } else {
                content.innerHTML = renderComingSoon('Reporte de Inventario', 'pi-chart-pie');
            }
            break;
        case 'reporte-vencimientos':
            if (typeof initReporteVencimientos === 'function') {
                initReporteVencimientos();
            } else {
                content.innerHTML = renderComingSoon('Productos Próximos a Vencer', 'pi-exclamation-triangle');
            }
            break;
        case 'reportes-profesionales':
            if (typeof initReportesProfesionales === 'function') {
                initReportesProfesionales();
            } else {
                content.innerHTML = renderComingSoon('Reportes Exportables', 'pi-file-pdf');
            }
            break;
        case 'usuarios':
            if (typeof initUsuarios === 'function') {
                initUsuarios();
            } else {
                content.innerHTML = renderComingSoon('Gestión de Usuarios', 'pi-user-edit');
            }
            break;
        case 'caja':
            if (typeof initCaja === 'function') {
                initCaja();
            } else {
                content.innerHTML = renderComingSoon('Control de Caja', 'pi-wallet');
            }
            break;
        case 'configuracion':
            if (typeof initConfiguracion === 'function') {
                initConfiguracion();
            } else {
                content.innerHTML = renderComingSoon('Configuración del Sistema', 'pi-cog');
            }
            break;
        default:
            content.innerHTML = renderDashboard();
            initDashboard();
    }
}

function renderDashboard() {
    const user = auth.getUser();
    const hora = new Date().getHours();
    let saludo = 'Buenos días';
    if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
    if (hora >= 18) saludo = 'Buenas noches';

    return `
        <div class="fade-in dashboard-page" id="dashboardRoot">
            <div class="welcome-card dashboard-welcome">
                <div class="welcome-card-content">
                    <p class="dashboard-subtitle">Panel en vivo</p>
                    <h2 class="welcome-title">${saludo}, ${user?.nombre || 'Usuario'}!</h2>
                    <p class="welcome-text">Estos indicadores se alimentan directamente de tus ventas, inventario y caja.</p>
                    <div class="dashboard-periods">
                        <div>
                            <span class="meta-label">Semana</span>
                            <strong id="dashboardWeekRange">--</strong>
                        </div>
                        <div>
                            <span class="meta-label">Mes</span>
                            <strong id="dashboardMonthRange">--</strong>
                        </div>
                        <div>
                            <span class="meta-label">Actualizado</span>
                            <strong id="dashboardUpdatedAt">--</strong>
                        </div>
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm" id="dashboardReload">
                    <i class="pi pi-refresh"></i>
                    <span>Actualizar</span>
                </button>
            </div>

            <div class="dashboard-alert hidden" id="dashboardError">
                <i class="pi pi-exclamation-triangle"></i>
                <span id="dashboardErrorText">No se pudieron cargar los datos</span>
            </div>

            <div class="stats-grid summary-cards">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="pi pi-shopping-cart"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="ventasHoyCantidad">--</div>
                        <div class="stat-label">Ventas del día</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="ventasHoyTotal">--</div>
                        <div class="stat-label">Ingresos hoy</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">
                        <i class="pi pi-database"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="inventarioValor">--</div>
                        <div class="stat-label">Valor inventario</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="alertasInventario">--</div>
                        <div class="stat-label">Alertas de stock</div>
                    </div>
                </div>
            </div>

            <div class="stats-grid secondary-stats">
                <div class="stat-card compact">
                    <div>
                        <p class="meta-label">Ingresos del mes</p>
                        <p class="stat-value" id="ingresosMes">--</p>
                    </div>
                    <div class="stat-extra" id="ventasMesCantidad">-- ventas</div>
                </div>
                <div class="stat-card compact">
                    <div>
                        <p class="meta-label">Promedio por ticket</p>
                        <p class="stat-value" id="promedioVentaMes">--</p>
                    </div>
                    <div class="stat-extra" id="productosVendidosMes">-- productos</div>
                </div>
                <div class="stat-card compact">
                    <div>
                        <p class="meta-label">Descuentos aplicados</p>
                        <p class="stat-value" id="descuentosMes">--</p>
                    </div>
                    <div class="stat-extra" id="inventarioUnidades">-- unidades</div>
                </div>
                <div class="stat-card compact">
                    <div>
                        <p class="meta-label">Productos activos</p>
                        <p class="stat-value" id="productosActivos">--</p>
                    </div>
                    <div class="stat-extra" id="sinStockTotal">-- sin stock</div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Ventas últimos 7 días</h3>
                        <span class="panel-subtitle" id="ventasSemanaTotal">--</span>
                    </div>
                    <div id="ventasSemanaChart" class="progress-list"></div>
                </div>
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Métodos de pago</h3>
                    </div>
                    <ul class="dashboard-list" id="metodosPagoList"></ul>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Top productos del mes</h3>
                    </div>
                    <ul class="dashboard-list" id="topProductosList"></ul>
                </div>
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Alertas de stock</h3>
                    </div>
                    <ul class="dashboard-list" id="stockCriticoList"></ul>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Ventas recientes</h3>
                    </div>
                    <div class="dashboard-timeline" id="ventasRecientesList"></div>
                </div>
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Próximos vencimientos</h3>
                    </div>
                    <ul class="dashboard-list" id="proximosVencerList"></ul>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Caja en curso</h3>
                    </div>
                    <div id="cajaResumen" class="caja-summary"></div>
                </div>
                <div class="stat-card dashboard-panel">
                    <div class="panel-header">
                        <h3>Conteos generales</h3>
                    </div>
                    <div id="conteosGenerales" class="conteos-grid"></div>
                </div>
            </div>

            <div class="dashboard-loading hidden" data-dashboard-loading>
                <div class="loader" style="width: 36px; height: 36px; border-width: 3px;"></div>
                <p>Cargando datos del sistema...</p>
            </div>
        </div>
    `;
}

async function initDashboard() {
    const root = document.getElementById('dashboardRoot');
    if (!root) return;

    if (!root.dataset.initialized) {
        const reloadBtn = document.getElementById('dashboardReload');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => loadDashboardData(true));
        }
        root.dataset.initialized = 'true';
    }

    await loadDashboardData();
}

async function loadDashboardData(showToast = false) {
    const root = document.getElementById('dashboardRoot');
    if (!root) return;

    toggleDashboardLoading(true);
    hideDashboardError();

    try {
        const response = await api.get('/dashboard/resumen');
        if (!response?.success) {
            throw new Error(response?.mensaje || 'No se pudo obtener el resumen');
        }

        renderDashboardData(response.data || {});

        const updatedAt = document.getElementById('dashboardUpdatedAt');
        if (updatedAt) {
            updatedAt.textContent = formatDateTimeFriendly(new Date());
        }

        if (showToast && typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('Datos del dashboard actualizados', 'success');
        }
    } catch (error) {
        console.error('Dashboard error:', error);
        showDashboardError(error.message || 'Error al cargar los datos del dashboard');
    } finally {
        toggleDashboardLoading(false);
    }
}

function renderDashboardData(data) {
    const ventasHoy = data.ventasHoy || {};
    const resumenMensual = data.resumenMensual || {};
    const inventarioResumen = data.inventarioResumen || {};
    const productosStats = data.productosStats || {};

    setText('ventasHoyCantidad', ventasHoy.cantidad);
    setText('ventasHoyTotal', formatCurrency(ventasHoy.total));
    setText('inventarioValor', formatCurrency(inventarioResumen.valor_total_inventario));

    const alertas = (productosStats.bajo_stock || 0) + (inventarioResumen.productos_sin_stock || 0);
    setText('alertasInventario', alertas);

    setText('ingresosMes', formatCurrency(resumenMensual.ingresos_totales));
    setText('ventasMesCantidad', `${resumenMensual.total_ventas || 0} ventas`);
    setText('promedioVentaMes', formatCurrency(resumenMensual.promedio_venta));
    setText('productosVendidosMes', `${resumenMensual.productos_vendidos || 0} productos`);
    setText('descuentosMes', formatCurrency(resumenMensual.descuentos_totales));
    setText('inventarioUnidades', `${formatNumberCompact(inventarioResumen.total_unidades)} uds.`);
    setText('productosActivos', productosStats.total_productos || inventarioResumen.total_productos || 0);
    setText('sinStockTotal', `${inventarioResumen.productos_sin_stock || productosStats.sin_stock || 0} sin stock`);

    if (data.periodoSemana) {
        setText('dashboardWeekRange', formatDateRange(data.periodoSemana));
    }
    if (data.periodoMes) {
        setText('dashboardMonthRange', formatDateRange(data.periodoMes));
    }

    renderVentasSemanal(data.ventasDiarias || []);
    renderMetodosPago(data.metodosPago || []);
    renderTopProductos(data.topProductos || []);
    renderStockCritico(data.stockCritico || []);
    renderVentasRecientes(data.ventasRecientes || []);
    renderProximosVencer(data.proximosVencer || []);
    renderCajaResumen(data.cajaActual);
    renderConteosGenerales(data.conteos || {});
}

function renderVentasSemanal(registros) {
    const container = document.getElementById('ventasSemanaChart');
    if (!container) return;

    if (!registros.length) {
        container.innerHTML = renderEmptyStateInline('Todavía no hay ventas registradas en el periodo.');
        setText('ventasSemanaTotal', '--');
        return;
    }

    const ordenados = [...registros].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const maxTotal = Math.max(...ordenados.map(r => Number(r.total_ventas) || 0));
    const totalSemana = ordenados.reduce((acc, r) => acc + (Number(r.total_ventas) || 0), 0);
    setText('ventasSemanaTotal', formatCurrency(totalSemana));

    container.innerHTML = ordenados.map(item => {
        const valor = Number(item.total_ventas) || 0;
        const width = maxTotal ? (valor / maxTotal) * 100 : 0;
        return `
            <div class="progress-row">
                <div class="progress-info">
                    <span>${formatDateShort(item.fecha)}</span>
                    <strong>${formatCurrency(valor)}</strong>
                </div>
                <div class="progress-bar">
                    <div class="progress-value" style="width: ${width}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderMetodosPago(items) {
    const container = document.getElementById('metodosPagoList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = renderEmptyStateInline('Aún no se registran métodos de pago en este periodo.');
        return;
    }

    const total = items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    container.innerHTML = items.map(item => {
        const monto = Number(item.total) || 0;
        const porcentaje = total ? Math.round((monto / total) * 100) : 0;
        return `
            <li class="list-item">
                <div>
                    <strong>${item.metodo_pago || 'Sin definir'}</strong>
                    <span>${item.cantidad || 0} ventas</span>
                </div>
                <div class="list-value">
                    <span>${formatCurrency(monto)}</span>
                    <span class="badge badge-info">${porcentaje}%</span>
                </div>
            </li>
        `;
    }).join('');
}

function renderTopProductos(items) {
    const container = document.getElementById('topProductosList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = renderEmptyStateInline('No hay productos destacados en este periodo.');
        return;
    }

    container.innerHTML = items.map(item => `
        <li class="list-item">
            <div>
                <strong>${item.nombre}</strong>
                <span>${item.laboratorio || 'Laboratorio no definido'}</span>
            </div>
            <div class="list-value">
                <span>${item.cantidad_vendida || 0} uds.</span>
                <span>${formatCurrency(item.total_vendido)}</span>
            </div>
        </li>
    `).join('');
}

function renderStockCritico(items) {
    const container = document.getElementById('stockCriticoList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = renderEmptyStateInline('No hay alertas de stock en este momento.');
        return;
    }

    container.innerHTML = items.map(item => {
        const restante = `${item.stock_actual || 0} / mín ${item.stock_minimo || 0}`;
        return `
            <li class="list-item">
                <div>
                    <strong>${item.nombre}</strong>
                    <span>Stock crítico</span>
                </div>
                <div class="list-value">
                    <span class="badge badge-warning">${restante}</span>
                </div>
            </li>
        `;
    }).join('');
}

function renderVentasRecientes(items) {
    const container = document.getElementById('ventasRecientesList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = renderEmptyStateInline('Todavía no hay ventas registradas.');
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="timeline-item">
            <div>
                <strong>${item.numero_venta || `Venta #${item.id}`}</strong>
                <span>${formatDateTimeFriendly(item.fecha_venta)}</span>
                <span>${item.cliente || 'Cliente general'}</span>
            </div>
            <div>
                <span class="badge badge-info">${item.metodo_pago || 'N/D'}</span>
                <span class="timeline-amount">${formatCurrency(item.total)}</span>
            </div>
        </div>
    `).join('');
}

function renderProximosVencer(items) {
    const container = document.getElementById('proximosVencerList');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = renderEmptyStateInline('No hay lotes próximos a vencer.');
        return;
    }

    container.innerHTML = items.map(item => {
        const dias = item.dias_para_vencer != null ? `${item.dias_para_vencer} días` : 'N/D';
        return `
            <li class="list-item">
                <div>
                    <strong>${item.producto}</strong>
                    <span>Lote ${item.numero_lote || item.lote_id}</span>
                </div>
                <div class="list-value">
                    <span>${formatDateShort(item.fecha_vencimiento)}</span>
                    <span class="badge badge-warning">${dias}</span>
                </div>
            </li>
        `;
    }).join('');
}

function renderCajaResumen(caja) {
    const container = document.getElementById('cajaResumen');
    if (!container) return;

    if (!caja) {
        container.innerHTML = renderEmptyStateInline('No hay una caja abierta actualmente.');
        return;
    }

    container.innerHTML = `
        <div class="caja-row">
            <span>Responsable</span>
            <strong>${caja.usuario_nombre || 'Sin asignar'}</strong>
        </div>
        <div class="caja-row">
            <span>Estado</span>
            <span class="badge badge-success">${caja.estado || 'abierta'}</span>
        </div>
        <div class="caja-row">
            <span>Monto inicial</span>
            <strong>${formatCurrency(caja.monto_inicial)}</strong>
        </div>
        <div class="caja-row">
            <span>Ventas registradas</span>
            <strong>${formatCurrency(caja.ventas_actuales)}</strong>
        </div>
        <div class="caja-row">
            <span>Saldo estimado</span>
            <strong>${formatCurrency(caja.saldo_actual)}</strong>
        </div>
        <div class="caja-row">
            <span>Movimientos</span>
            <strong>${caja.cantidad_ventas || 0} ventas</strong>
        </div>
    `;
}

function renderConteosGenerales(conteos) {
    const container = document.getElementById('conteosGenerales');
    if (!container) return;

    const items = [
        { label: 'Clientes activos', value: conteos.clientesActivos },
        { label: 'Categorías', value: conteos.categoriasActivas },
        { label: 'Laboratorios', value: conteos.laboratoriosActivos },
        { label: 'Usuarios activos', value: conteos.usuariosActivos }
    ];

    container.innerHTML = items.map(item => `
        <div class="conteo-item">
            <span>${item.label}</span>
            <strong>${item.value ?? 0}</strong>
        </div>
    `).join('');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value ?? '--';
    }
}

function formatCurrency(value) {
    const amount = Number(value) || 0;
    return `Bs. ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumberCompact(value) {
    const num = Number(value) || 0;
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num;
}

function formatDateRange(periodo) {
    if (!periodo?.inicio || !periodo?.fin) return '--';
    return `${formatDateShort(periodo.inicio)} - ${formatDateShort(periodo.fin)}`;
}

function formatDateShort(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' });
}

function formatDateTimeFriendly(dateStr) {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function renderEmptyStateInline(message) {
    return `<p class="empty-state-text">${message}</p>`;
}

function toggleDashboardLoading(show) {
    const loader = document.querySelector('#dashboardRoot [data-dashboard-loading]');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
    const button = document.getElementById('dashboardReload');
    if (button) {
        button.disabled = !!show;
    }
}

function showDashboardError(message) {
    const alert = document.getElementById('dashboardError');
    const text = document.getElementById('dashboardErrorText');
    if (!alert || !text) return;
    text.textContent = message;
    alert.classList.remove('hidden');
}

function hideDashboardError() {
    const alert = document.getElementById('dashboardError');
    if (alert) {
        alert.classList.add('hidden');
    }
}

function renderComingSoon(title, icon) {
    return `
        <div class="fade-in">
            <div class="content-header">
                <h1 class="content-title">${title}</h1>
                <p class="content-subtitle">Módulo en desarrollo</p>
            </div>
            
            <div class="stat-card" style="max-width: 500px; margin: 60px auto; text-align: center; padding: 60px 40px;">
                <div style="width: 100%;">
                    <div style="width: 100px; height: 100px; background: linear-gradient(135deg, rgba(0, 194, 255, 0.1), rgba(37, 110, 255, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class="pi ${icon}" style="font-size: 40px; color: var(--azul-primario);"></i>
                    </div>
                    <h2 style="color: var(--texto-oscuro); margin-bottom: 12px; font-size: 22px;">Próximamente</h2>
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">Este módulo estará disponible muy pronto. Estamos trabajando para brindarte la mejor experiencia.</p>
                </div>
            </div>
        </div>
    `;
}

window.renderMainLayout = renderMainLayout;
window.renderPageContent = renderPageContent;
