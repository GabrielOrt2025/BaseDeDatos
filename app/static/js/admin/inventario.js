// static/js/admin/inventario.js

let inventarioData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarInventario();
    cargarProductosSelect();
    cargarBodegasSelect();
});

// Cargar inventario
async function cargarInventario() {
    try {
        const response = await fetch('/api/inventario/productos');
        const data = await response.json();
        
        if (data.success) {
            inventarioData = data.productos || [];
            filteredData = [...inventarioData];
            actualizarEstadisticas();
            renderizarInventario();
        } else {
            mostrarError('Error al cargar inventario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const totalProductos = inventarioData.length;
    const stockDisponible = inventarioData.reduce((sum, item) => 
        sum + (item.cantidad_disponible || 0), 0);
    const stockReservado = inventarioData.reduce((sum, item) => 
        sum + (item.cantidad_reservada || 0), 0);
    const alertasStock = inventarioData.filter(item => 
        item.cantidad_disponible <= item.cantidad_alerta).length;
    
    document.getElementById('total-productos').textContent = totalProductos;
    document.getElementById('stock-disponible').textContent = stockDisponible;
    document.getElementById('stock-reservado').textContent = stockReservado;
    document.getElementById('alertas-stock').textContent = alertasStock;
}

// Renderizar inventario
function renderizarInventario() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    const tbody = document.getElementById('inventory-tbody');
    
    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <i class="bi bi-inbox"></i>
                        <p>No se encontraron productos</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>
                <div class="product-info">
                    <img src="static/${item.imagenes[0] || '/static/img/placeholder.png'}" 
                         alt="${item.nombre}" 
                         class="product-image">
                    <div class="product-details">
                        <h4>${item.nombre}</h4>
                        <span>${item.categoria || 'Sin categoría'}</span>
                    </div>
                </div>
            </td>
            <td>${item.sku}</td>
            <td>${item.categoria || '-'}</td>
            <td>${item.bodega || 'Bodega Principal'}</td>
            <td>
                <strong>${item.stock || 0}</strong>
                <div class="stock-bar">
                    <div class="stock-fill ${getStockClass(item)}" 
                         style="width: ${getStockPercentage(item)}%"></div>
                </div>
            </td>
            <td>${item.cantidad_reservada || 0}</td>
            <td>${item.cantidad_alerta || 0}</td>
            <td>
                <span class="badge ${getEstadoBadgeClass(item)}">
                    ${getEstadoTexto(item)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" 
                            onclick="editarStock(${item.producto_id}, ${item.bodega_id})"
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" 
                            onclick="confirmarEliminar(${item.producto_id})"
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    actualizarPaginacion();
}

// Obtener clase de estado
function getEstadoBadgeClass(item) {
    const disponible = item.cantidad_disponible || 0;
    const alerta = item.cantidad_alerta || 0;
    
    if (disponible === 0) return 'agotado';
    if (disponible <= alerta) return 'bajo';
    return 'disponible';
}

function getEstadoTexto(item) {
    const disponible = item.cantidad_disponible || 0;
    const alerta = item.cantidad_alerta || 0;
    
    if (disponible === 0) return 'Agotado';
    if (disponible <= alerta) return 'Stock Bajo';
    return 'Disponible';
}

function getStockClass(item) {
    const disponible = item.cantidad_disponible || 0;
    const alerta = item.cantidad_alerta || 0;
    
    if (disponible === 0) return 'low';
    if (disponible <= alerta) return 'medium';
    return 'high';
}

function getStockPercentage(item) {
    const disponible = item.cantidad_disponible || 0;
    const alerta = item.cantidad_alerta || 0;
    const max = Math.max(disponible, alerta * 2, 100);
    return Math.min((disponible / max) * 100, 100);
}

// Filtros
document.getElementById('search-input')?.addEventListener('input', function(e) {
    aplicarFiltros();
});

document.getElementById('filter-categoria')?.addEventListener('change', aplicarFiltros);
document.getElementById('filter-bodega')?.addEventListener('change', aplicarFiltros);
document.getElementById('filter-estado')?.addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoria = document.getElementById('filter-categoria')?.value || '';
    const bodega = document.getElementById('filter-bodega')?.value || '';
    const estado = document.getElementById('filter-estado')?.value || '';
    
    filteredData = inventarioData.filter(item => {
        const matchSearch = item.nombre.toLowerCase().includes(searchTerm) || 
                          item.sku.toLowerCase().includes(searchTerm);
        const matchCategoria = !categoria || item.categoria_id == categoria;
        const matchBodega = !bodega || item.bodega_id == bodega;
        const matchEstado = !estado || getEstadoTexto(item).toLowerCase() === estado;
        
        return matchSearch && matchCategoria && matchBodega && matchEstado;
    });
    
    currentPage = 1;
    renderizarInventario();
}

function limpiarFiltros() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-categoria').value = '';
    document.getElementById('filter-bodega').value = '';
    document.getElementById('filter-estado').value = '';
    aplicarFiltros();
}

// Cambiar vista
function cambiarVista(vista) {
    const tableView = document.getElementById('table-view');
    const cardView = document.getElementById('card-view');
    const buttons = document.querySelectorAll('.toggle-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${vista}"]`)?.classList.add('active');
    
    if (vista === 'tabla') {
        tableView.style.display = 'block';
        cardView.style.display = 'none';
    } else {
        tableView.style.display = 'none';
        cardView.style.display = 'block';
        renderizarTarjetas();
    }
}

function renderizarTarjetas() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    container.innerHTML = pageData.map(item => {
        // Manejo de imagen: tomamos la primera de la lista o el placeholder
        const imagenUrl = (item.imagenes && item.imagenes.length > 0) 
                          ? item.imagenes[0] 
                          : '/static/img/placeholder.png';

        return `
            <div class="product-card">
                <img src="${imagenUrl}" 
                     alt="${item.nombre}" 
                     class="product-card-image">
                
                <div class="product-card-header">
                    <span class="category-tag">${item.categoria}</span>
                    <h3>${item.nombre}</h3>
                    <span class="price">$${item.precio.toFixed(2)}</span>
                </div>

                <div class="product-card-stats">
                    <div class="stat-item">
                        <div class="value">${item.stock || 0}</div>
                        <div class="label">Stock Neto</div>
                    </div>
                    <div class="stat-item">
                        <div class="value">${item.id}</div>
                        <div class="label">ID Producto</div>
                    </div>
                </div>

                <span class="badge ${item.stock > 0 ? 'activo' : 'inactivo'}">
                    ${item.stock > 0 ? 'En Stock' : 'Agotado'}
                </span>

                <div class="action-buttons" style="margin-top: 15px;">
                    <button class="btn btn-primary btn-block" 
                            onclick="abrirModalStock(${item.id})">
                        <i class="bi bi-plus-circle"></i>
                        Gestionar Stock
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Paginación
function actualizarPaginacion() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    document.getElementById('showing-from').textContent = 
        filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    document.getElementById('showing-to').textContent = 
        Math.min(currentPage * itemsPerPage, filteredData.length);
    document.getElementById('total-items').textContent = filteredData.length;
    
    let paginationHTML = `
        <button class="page-btn" onclick="cambiarPagina(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    paginationHTML += `
        <button class="page-btn" onclick="cambiarPagina(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function cambiarPagina(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarInventario();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Modales
function mostrarModalAgregarStock() {
    document.getElementById('modal-agregar-stock').classList.add('active');
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Agregar stock
async function agregarStock(event) {
    event.preventDefault();
    
    const data = {
        producto_id: document.getElementById('stock-producto').value,
        bodega_id: document.getElementById('stock-bodega').value,
        cantidad: document.getElementById('stock-cantidad').value,
        precio_unitario: document.getElementById('stock-precio').value,
        tipo_entrada: document.getElementById('stock-tipo').value,
        referencia: document.getElementById('stock-referencia').value
    };
    
    try {
        const response = await fetch('/api/inventario/agregar-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Stock agregado correctamente');
            cerrarModal('modal-agregar-stock');
            document.getElementById('form-agregar-stock').reset();
            cargarInventario();
        } else {
            mostrarError(result.error || 'Error al agregar stock');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Editar stock
async function editarStock(productoId, bodegaId) {
    // Buscar el item en los datos
    const item = inventarioData.find(i => 
        i.producto_id === productoId && i.bodega_id === bodegaId);
    
    if (!item) return;
    
    document.getElementById('edit-producto-id').value = productoId;
    document.getElementById('edit-bodega-id').value = bodegaId;
    document.getElementById('edit-producto-nombre').textContent = item.nombre;
    document.getElementById('edit-producto-sku').textContent = item.sku;
    document.getElementById('edit-cantidad-disponible').value = item.cantidad_disponible;
    document.getElementById('edit-cantidad-reservada').value = item.cantidad_reservada;
    document.getElementById('edit-cantidad-alerta').value = item.cantidad_alerta;
    
    document.getElementById('modal-editar-stock').classList.add('active');
}

async function actualizarStock(event) {
    event.preventDefault();
    
    const data = {
        producto_id: document.getElementById('edit-producto-id').value,
        bodega_id: document.getElementById('edit-bodega-id').value,
        cantidad_disponible: document.getElementById('edit-cantidad-disponible').value,
        cantidad_reservada: document.getElementById('edit-cantidad-reservada').value,
        cantidad_alerta: document.getElementById('edit-cantidad-alerta').value
    };
    
    try {
        const response = await fetch('/api/inventario/actualizar-stock', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Stock actualizado correctamente');
            cerrarModal('modal-editar-stock');
            cargarInventario();
        } else {
            mostrarError(result.error || 'Error al actualizar stock');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Cargar selects
async function cargarProductosSelect() {
    try {
        const response = await fetch('/api/productos');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('stock-producto');
            select.innerHTML = '<option value="">Seleccionar producto...</option>' +
                data.productos.map(p => 
                    `<option value="${p.id}">${p.nombre} (${p.sku})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function cargarBodegasSelect() {
    try {
        const response = await fetch('/api/bodegas');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('stock-bodega');
            select.innerHTML = '<option value="">Seleccionar bodega...</option>' +
                data.bodegas.map(b => 
                    `<option value="${b.id}">${b.nombre}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Exportar
function exportarInventario() {
    // Implementar exportación a CSV/Excel
    console.log('Exportar inventario');
}

// Notificaciones
function mostrarExito(mensaje) {
    // Implementar notificación de éxito
    alert(mensaje);
}

function mostrarError(mensaje) {
    // Implementar notificación de error
    alert(mensaje);
}