let productosVenta = [];
let carrito = [];
let clienteSeleccionado = null;

function formatFechaBolivia(dateStr) {
    if (!dateStr) return '-';
    const formatter = new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(new Date(dateStr));
}

async function initPuntoVenta() {
    await cargarProductosVenta();
    renderPuntoVentaPage();
}

async function cargarProductosVenta() {
    try {
        const res = await api.get('/productos');
        productosVenta = (res.data || []).filter(p => p.activo && p.stock_actual > 0);
    } catch (error) {
        console.error('Error cargando productos:', error);
        productosVenta = [];
    }
}

function renderPuntoVentaPage() {
    const content = document.getElementById('pageContent');
    
    content.innerHTML = `
        <div class="pos-container">
            <div class="pos-left">
                <div class="pos-header">
                    <h2 class="pos-title">
                        <i class="pi pi-shopping-cart"></i>
                        Punto de Venta
                    </h2>
                    <div class="pos-search">
                        <i class="pi pi-search"></i>
                        <input type="text" id="buscarProductoPOS" placeholder="Buscar producto por nombre o código..." onkeyup="filtrarProductosPOS()">
                    </div>
                </div>
                <div class="pos-products" id="productosGrid">
                    ${renderProductosGrid()}
                </div>
            </div>
            <div class="pos-right">
                <div class="pos-cart-header">
                    <h3><i class="pi pi-list"></i> Carrito de Venta</h3>
                    <button class="btn-icon" onclick="limpiarCarrito()" title="Limpiar carrito">
                        <i class="pi pi-trash"></i>
                    </button>
                </div>
                <div class="pos-cliente">
                    <div class="cliente-search">
                        <input type="text" id="buscarCliente" placeholder="Buscar cliente..." onkeyup="buscarClientePOS(event)">
                        <button class="btn btn-sm btn-secondary" onclick="abrirModalClienteRapido()">
                            <i class="pi pi-plus"></i>
                        </button>
                    </div>
                    <div id="clienteInfo" class="cliente-info ${clienteSeleccionado ? '' : 'hidden'}">
                        ${clienteSeleccionado ? `
                            <span><i class="pi pi-user"></i> ${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ''}</span>
                            <button class="btn-icon-sm" onclick="quitarCliente()"><i class="pi pi-times"></i></button>
                        ` : ''}
                    </div>
                    <div id="clientesSugeridos" class="clientes-sugeridos hidden"></div>
                </div>
                <div class="pos-cart-items" id="carritoItems">
                    ${renderCarritoItems()}
                </div>
                <div class="pos-cart-footer">
                    <div class="pos-totales">
                        <div class="pos-total-row">
                            <span>Subtotal:</span>
                            <span id="posSubtotal">Bs. ${calcularSubtotal().toFixed(2)}</span>
                        </div>
                        <div class="pos-total-row descuento-row">
                            <span>Descuento:</span>
                            <div class="descuento-input">
                                <span>Bs.</span>
                                <input type="number" id="descuentoTotal" value="0" min="0" step="0.5" onchange="actualizarTotales()">
                            </div>
                        </div>
                        <div class="pos-total-row total-final">
                            <span>TOTAL:</span>
                            <span id="posTotal">Bs. ${calcularTotal().toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="pos-pago">
                        <div class="metodo-pago">
                            <label>Método de Pago:</label>
                            <select id="metodoPago" onchange="toggleMontoPago()">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="QR">QR</option>
                                <option value="Transferencia">Transferencia</option>
                            </select>
                        </div>
                        <div class="monto-pago" id="montoPagoContainer">
                            <label>Monto Recibido:</label>
                            <input type="number" id="montoRecibido" placeholder="0.00" onkeyup="calcularCambio()">
                        </div>
                        <div class="cambio-pago" id="cambioContainer">
                            <label>Cambio:</label>
                            <span id="cambioMonto">Bs. 0.00</span>
                        </div>
                    </div>
                    <button class="btn btn-success btn-block btn-lg" onclick="procesarVenta()" ${carrito.length === 0 ? 'disabled' : ''}>
                        <i class="pi pi-check"></i>
                        Procesar Venta (F12)
                    </button>
                </div>
            </div>
        </div>
        <div id="modalContainer"></div>
    `;
    
    document.addEventListener('keydown', atajosTecladoPOS);
}

function renderProductosGrid() {
    const termino = document.getElementById('buscarProductoPOS')?.value?.toLowerCase() || '';
    
    let productosMostrar = productosVenta;
    if (termino) {
        productosMostrar = productosVenta.filter(p => 
            p.nombre.toLowerCase().includes(termino) || 
            (p.codigo_barras && p.codigo_barras.toLowerCase().includes(termino))
        );
    }
    
    if (productosMostrar.length === 0) {
        return `
            <div class="pos-empty">
                <i class="pi pi-search"></i>
                <p>No se encontraron productos</p>
            </div>
        `;
    }
    
    return productosMostrar.map(p => `
        <div class="pos-product-card" onclick="agregarAlCarrito(${p.id})">
            <div class="pos-product-name">${escapeHtml(p.nombre)}</div>
            <div class="pos-product-info">
                <span class="pos-product-price">Bs. ${formatNumber(p.precio_venta)}</span>
                <span class="pos-product-stock ${p.stock_actual <= p.stock_minimo ? 'stock-bajo' : ''}">
                    Stock: ${p.stock_actual}
                </span>
            </div>
        </div>
    `).join('');
}

function filtrarProductosPOS() {
    document.getElementById('productosGrid').innerHTML = renderProductosGrid();
}

function agregarAlCarrito(productoId) {
    const producto = productosVenta.find(p => p.id === productoId);
    if (!producto) return;
    
    const itemExistente = carrito.find(item => item.producto_id === productoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock_actual) {
            itemExistente.cantidad++;
        } else {
            mostrarNotificacion('No hay suficiente stock', 'warning');
            return;
        }
    } else {
        carrito.push({
            producto_id: productoId,
            nombre: producto.nombre,
            precio_unitario: producto.precio_venta,
            cantidad: 1,
            stock_disponible: producto.stock_actual
        });
    }
    
    actualizarCarritoUI();
}

function renderCarritoItems() {
    if (carrito.length === 0) {
        return `
            <div class="pos-cart-empty">
                <i class="pi pi-shopping-cart"></i>
                <p>Carrito vacío</p>
                <span>Agrega productos para comenzar</span>
            </div>
        `;
    }
    
    return carrito.map((item, index) => `
        <div class="pos-cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.nombre)}</div>
                <div class="cart-item-price">Bs. ${formatNumber(item.precio_unitario)} c/u</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="cambiarCantidad(${index}, -1)">-</button>
                <input type="number" value="${item.cantidad}" min="1" max="${item.stock_disponible}" 
                    onchange="setCantidad(${index}, this.value)">
                <button class="qty-btn" onclick="cambiarCantidad(${index}, 1)">+</button>
            </div>
            <div class="cart-item-subtotal">
                Bs. ${formatNumber(item.precio_unitario * item.cantidad)}
            </div>
            <button class="cart-item-remove" onclick="quitarDelCarrito(${index})">
                <i class="pi pi-times"></i>
            </button>
        </div>
    `).join('');
}

function cambiarCantidad(index, delta) {
    const item = carrito[index];
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad < 1) {
        quitarDelCarrito(index);
        return;
    }
    
    if (nuevaCantidad > item.stock_disponible) {
        mostrarNotificacion('No hay suficiente stock', 'warning');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    actualizarCarritoUI();
}

function setCantidad(index, valor) {
    const cantidad = parseInt(valor) || 1;
    const item = carrito[index];
    
    if (cantidad > item.stock_disponible) {
        mostrarNotificacion('No hay suficiente stock', 'warning');
        item.cantidad = item.stock_disponible;
    } else {
        item.cantidad = Math.max(1, cantidad);
    }
    
    actualizarCarritoUI();
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function limpiarCarrito() {
    if (carrito.length === 0) return;
    if (!confirm('¿Limpiar todo el carrito?')) return;
    carrito = [];
    clienteSeleccionado = null;
    actualizarCarritoUI();
    renderPuntoVentaPage();
}

function actualizarCarritoUI() {
    document.getElementById('carritoItems').innerHTML = renderCarritoItems();
    actualizarTotales();
    
    const btnProcesar = document.querySelector('.btn-success.btn-block');
    if (btnProcesar) {
        btnProcesar.disabled = carrito.length === 0;
    }
}

function calcularSubtotal() {
    return carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
}

function calcularTotal() {
    const subtotal = calcularSubtotal();
    const descuento = parseFloat(document.getElementById('descuentoTotal')?.value) || 0;
    return Math.max(0, subtotal - descuento);
}

function actualizarTotales() {
    const subtotal = calcularSubtotal();
    const total = calcularTotal();
    
    document.getElementById('posSubtotal').textContent = `Bs. ${subtotal.toFixed(2)}`;
    document.getElementById('posTotal').textContent = `Bs. ${total.toFixed(2)}`;
    
    calcularCambio();
}

function calcularCambio() {
    const total = calcularTotal();
    const recibido = parseFloat(document.getElementById('montoRecibido')?.value) || 0;
    const cambio = recibido - total;
    
    document.getElementById('cambioMonto').textContent = `Bs. ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}`;
    document.getElementById('cambioMonto').style.color = cambio >= 0 ? 'var(--verde-exito)' : 'var(--rojo-alerta)';
}

function toggleMontoPago() {
    const metodo = document.getElementById('metodoPago').value;
    const container = document.getElementById('montoPagoContainer');
    const cambioContainer = document.getElementById('cambioContainer');
    
    if (metodo === 'Efectivo') {
        container.style.display = 'block';
        cambioContainer.style.display = 'block';
    } else {
        container.style.display = 'none';
        cambioContainer.style.display = 'none';
    }
}

async function buscarClientePOS(e) {
    const termino = e.target.value.trim();
    const container = document.getElementById('clientesSugeridos');
    
    if (termino.length < 2) {
        container.classList.add('hidden');
        return;
    }
    
    try {
        const res = await api.get(`/ventas/clientes/buscar?q=${encodeURIComponent(termino)}`);
        const clientes = res.data || [];
        
        if (clientes.length === 0) {
            container.innerHTML = '<div class="sugerencia-item">No se encontraron clientes</div>';
        } else {
            container.innerHTML = clientes.map(c => `
                <div class="sugerencia-item" onclick="seleccionarCliente(${c.id}, '${escapeHtml(c.nombre)}', '${escapeHtml(c.apellido || '')}')">
                    <strong>${escapeHtml(c.nombre)} ${escapeHtml(c.apellido || '')}</strong>
                    <span>${c.numero_documento || 'Sin documento'}</span>
                </div>
            `).join('');
        }
        container.classList.remove('hidden');
    } catch (error) {
        console.error('Error buscando clientes:', error);
    }
}

function seleccionarCliente(id, nombre, apellido) {
    clienteSeleccionado = { id, nombre, apellido };
    document.getElementById('buscarCliente').value = '';
    document.getElementById('clientesSugeridos').classList.add('hidden');
    
    const clienteInfo = document.getElementById('clienteInfo');
    clienteInfo.innerHTML = `
        <span><i class="pi pi-user"></i> ${nombre} ${apellido}</span>
        <button class="btn-icon-sm" onclick="quitarCliente()"><i class="pi pi-times"></i></button>
    `;
    clienteInfo.classList.remove('hidden');
}

function quitarCliente() {
    clienteSeleccionado = null;
    document.getElementById('clienteInfo').classList.add('hidden');
}

function abrirModalClienteRapido() {
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalPOS(event, true)">
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title"><i class="pi pi-user-plus"></i> Nuevo Cliente</h2>
                    <button class="modal-close" onclick="cerrarModalPOS()"><i class="pi pi-times"></i></button>
                </div>
                <div class="modal-body">
                    <form id="formClienteRapido" onsubmit="guardarClienteRapido(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Nombre <span class="required">*</span></label>
                                <input type="text" class="form-control" id="cliente_nombre" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Apellido</label>
                                <input type="text" class="form-control" id="cliente_apellido">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">CI/NIT</label>
                                <input type="text" class="form-control" id="cliente_documento">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Teléfono</label>
                                <input type="text" class="form-control" id="cliente_telefono">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="cerrarModalPOS()">Cancelar</button>
                    <button type="submit" form="formClienteRapido" class="btn btn-primary">
                        <i class="pi pi-check"></i> Guardar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

async function guardarClienteRapido(e) {
    e.preventDefault();
    
    const datos = {
        nombre: document.getElementById('cliente_nombre').value.trim(),
        apellido: document.getElementById('cliente_apellido').value.trim() || null,
        numero_documento: document.getElementById('cliente_documento').value.trim() || null,
        telefono: document.getElementById('cliente_telefono').value.trim() || null
    };
    
    try {
        const res = await api.post('/ventas/clientes', datos);
        if (res.success) {
            seleccionarCliente(res.data.id, res.data.nombre, res.data.apellido || '');
            cerrarModalPOS();
            mostrarNotificacion('Cliente creado correctamente', 'success');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al crear cliente', 'error');
    }
}

async function procesarVenta() {
    if (carrito.length === 0) {
        mostrarNotificacion('El carrito está vacío', 'warning');
        return;
    }
    
    const metodo = document.getElementById('metodoPago').value;
    const total = calcularTotal();
    const recibido = parseFloat(document.getElementById('montoRecibido')?.value) || total;
    
    if (metodo === 'Efectivo' && recibido < total) {
        mostrarNotificacion('El monto recibido es menor al total', 'warning');
        return;
    }
    
    const datos = {
        cliente_id: clienteSeleccionado?.id || null,
        items: carrito.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario
        })),
        metodo_pago: metodo,
        monto_recibido: recibido,
        descuento_total: parseFloat(document.getElementById('descuentoTotal')?.value) || 0
    };
    
    try {
        const res = await api.post('/ventas', datos);
        if (res.success) {
            mostrarTicketVenta(res.data);
            carrito = [];
            clienteSeleccionado = null;
            await cargarProductosVenta();
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al procesar venta', 'error');
    }
}

function mostrarTicketVenta(venta) {
    const modal = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header modal-header-success">
                    <h2 class="modal-title"><i class="pi pi-check-circle"></i> Venta Exitosa</h2>
                </div>
                <div class="modal-body">
                    <div class="ticket-preview" id="ticketParaImprimir">
                        <div class="ticket-header">
                            <h3>FARMACIA</h3>
                            <p>Venta #${venta.numero_venta}</p>
                            <p>${formatFechaBolivia(venta.fecha_venta)}</p>
                            ${venta.cliente_nombre ? `<p>Cliente: ${venta.cliente_nombre} ${venta.cliente_apellido || ''}</p>` : ''}
                        </div>
                        <div class="ticket-items">
                            ${venta.detalles.map(d => `
                                <div class="ticket-item">
                                    <span>${d.cantidad}x ${d.producto_nombre}</span>
                                    <span>Bs. ${formatNumber(d.subtotal)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="ticket-totals">
                            <div class="ticket-row"><span>Subtotal:</span><span>Bs. ${formatNumber(venta.subtotal)}</span></div>
                            ${venta.descuento > 0 ? `<div class="ticket-row"><span>Descuento:</span><span>-Bs. ${formatNumber(venta.descuento)}</span></div>` : ''}
                            <div class="ticket-row total"><span>TOTAL:</span><span>Bs. ${formatNumber(venta.total)}</span></div>
                            <div class="ticket-row"><span>Pagó:</span><span>Bs. ${formatNumber(venta.monto_recibido)}</span></div>
                            <div class="ticket-row"><span>Cambio:</span><span>Bs. ${formatNumber(venta.cambio)}</span></div>
                        </div>
                        <div class="ticket-footer">
                            <p>¡Gracias por su compra!</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="cerrarModalPOS(); renderPuntoVentaPage();">
                        <i class="pi pi-arrow-left"></i> Nueva Venta
                    </button>
                    <button class="btn btn-primary" onclick="imprimirTicket()">
                        <i class="pi pi-print"></i> Imprimir
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modalContainer').innerHTML = modal;
}

function cerrarModalPOS(e = null, clickFuera = false) {
    if (clickFuera && e && !e.target.classList.contains('modal-overlay')) return;
    document.getElementById('modalContainer').innerHTML = '';
}

function imprimirTicket() {
    const ticket = document.getElementById('ticketParaImprimir');
    const contenido = ticket.innerHTML;
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Ticket</title>
            <style>
                @page { 
                    size: 80mm auto; 
                    margin: 0; 
                }
                @media print {
                    html, body { 
                        margin: 0; 
                        padding: 5mm;
                    }
                }
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; width: 80mm; }
                .ticket-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-header h3 { margin: 0 0 5px 0; font-size: 16px; }
                .ticket-header p { margin: 2px 0; }
                .ticket-item { display: flex; justify-content: space-between; margin: 5px 0; }
                .ticket-items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                .ticket-row { display: flex; justify-content: space-between; margin: 3px 0; }
                .ticket-row.total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                .ticket-footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
                .ticket-totals { margin-top: 10px; }
            </style>
        </head>
        <body>${contenido}</body>
        </html>
    `);
    doc.close();
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
}

function atajosTecladoPOS(e) {
    if (e.key === 'F12') {
        e.preventDefault();
        procesarVenta();
    }
}

window.initPuntoVenta = initPuntoVenta;
window.filtrarProductosPOS = filtrarProductosPOS;
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.setCantidad = setCantidad;
window.quitarDelCarrito = quitarDelCarrito;
window.limpiarCarrito = limpiarCarrito;
window.buscarClientePOS = buscarClientePOS;
window.seleccionarCliente = seleccionarCliente;
window.quitarCliente = quitarCliente;
window.abrirModalClienteRapido = abrirModalClienteRapido;
window.guardarClienteRapido = guardarClienteRapido;
window.procesarVenta = procesarVenta;
window.toggleMontoPago = toggleMontoPago;
window.actualizarTotales = actualizarTotales;
window.calcularCambio = calcularCambio;
window.cerrarModalPOS = cerrarModalPOS;
window.imprimirTicket = imprimirTicket;
