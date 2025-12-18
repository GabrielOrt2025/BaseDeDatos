// static/js/admin/productos.js

let productosData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 12;
let productoActual = null;

/* =============================
   INIT
============================= */
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategorias();
});

/* =============================
   API – PRODUCTOS
============================= */
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al obtener productos');
        }

        productosData = data.productos.map(p => {

            // 🔥 MANEJO CORRECTO DE IMÁGENES
            let imagenPrincipal = '/static/img/placeholder.png';

            if (p.urls_imagenes && typeof p.urls_imagenes === 'string') {
                const imagenes = p.urls_imagenes
                    .split(';')
                    .map(i => i.trim())
                    .filter(i => i !== '');

                if (imagenes.length > 0) {
                    imagenPrincipal = `/static/${imagenes[0]}`;
                }
            }

            return {
                id: p.id,
                nombre: p.nombre_producto,
                categoria: p.nombre_categoria,
                url: imagenPrincipal,
                precio: p.precio_base,
                stock: p.stock_disponible ?? 0,
                activo: true // ⚠️ tu SP no devuelve estado
            };
        });

        filteredData = [...productosData];

        renderizarProductos();
        actualizarEstadisticas();

    } catch (error) {
        console.error('Error en cargarProductos:', error);
        mostrarError('No se pudieron cargar los productos');
    }
}



/* =============================
   RENDER
============================= */
function renderizarProductos() {
    const vista = document.querySelector('.toggle-btn.active')?.dataset.view || 'tarjetas';
    vista === 'tabla' ? renderizarTabla() : renderizarTarjetas();
    actualizarPaginacion();
}

function renderizarTarjetas() {
    const container = document.getElementById('products-grid');
    const pageData = paginarDatos();

    if (!pageData.length) {
        container.innerHTML = emptyState();
        return;
    }

    container.innerHTML = pageData.map(p => `
        <div class="product-card" onclick="verDetallesProducto(${p.id})">
            <div class="product-image-container">
                <img src="${p.url || '/static/img/placeholder.png'}">
            </div>
            <div class="product-card-body">
                <span class="badge${p.activo ? 'activo' : 'inactivo'}">
                    ${p.activo ? 'Activo' : 'Inactivo'}
                </span>
                <h3>${p.nombre}</h3>
                <p>SKU: ${p.sku || 'N/A'}</p>
                <strong>₡${formatearNumero(p.precio || 0)}</strong>
                <p>${p.categoria || 'Sin categoría'}</p>
            </div>
        </div>
    `).join('');
}

function renderizarTabla() {
    const tbody = document.getElementById('products-tbody');
    const pageData = paginarDatos();

    if (!pageData.length) {
        tbody.innerHTML = `<tr><td colspan="7">${emptyState()}</td></tr>`;
        return;
    }

    tbody.innerHTML = pageData.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.sku || '-'}</td>
            <td>${p.categoria || '-'}</td>
            <td>₡${formatearNumero(p.precio || 0)}</td>
            <td>${p.stock || 0}</td>
            <td>
                <span class="badge ${p.activo ? 'activo' : 'inactivo'}">
                    ${p.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button onclick="verDetallesProducto(${p.id})">👁</button>
                <button onclick="editarProducto(${p.id})">✏</button>
            </td>
        </tr>
    `).join('');
}

function paginarDatos() {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
}

function emptyState() {
    return `
        <div class="empty-state">
            <i class="bi bi-inbox"></i>
            <p>No hay productos</p>
        </div>
    `;
}

/* =============================
   FILTROS
============================= */
function aplicarFiltros() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const categoria = document.getElementById('filter-categoria').value;
    const estado = document.getElementById('filter-estado').value;

    filteredData = productosData.filter(p => {
        const matchText = p.nombre.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search);
        const matchCat = !categoria || p.categoria === categoria;
        const matchEstado = estado === '' || String(p.activo) === estado;
        return matchText && matchCat && matchEstado;
    });

    currentPage = 1;
    renderizarProductos();
}

/* =============================
   CRUD
============================= */
async function crearProducto(e) {
    e.preventDefault();

    const data = new FormData(e.target);

    try {
        const res = await fetch('/api/productos', { method: 'POST', body: data });
        const result = await res.json();

        if (!res.ok) throw result.error;
        mostrarExito('Producto creado');
        cerrarModal('modal-crear-producto');
        cargarProductos();
    } catch (err) {
        mostrarError(err || 'Error al crear producto');
    }
}

async function actualizarProducto(e) {
    e.preventDefault();

    const id = document.getElementById('edit-producto-id').value;
    const payload = {
        nombre: document.getElementById('edit-nombre').value,
        sku: document.getElementById('edit-sku').value,
        categoria_id: document.getElementById('edit-categoria').value,
        descripcion: document.getElementById('edit-descripcion').value,
        precio: document.getElementById('edit-precio').value,
        activo: document.getElementById('edit-activo').value
    };

    try {
        const res = await fetch(`/api/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) throw result.error;

        mostrarExito('Producto actualizado');
        cerrarModal('modal-editar-producto');
        cargarProductos();
    } catch (err) {
        mostrarError(err || 'Error al actualizar');
    }
}

/* =============================
   MODALES
============================= */
function verDetallesProducto(id) {
    productoActual = productosData.find(p => p.id === id);
    if (!productoActual) return;

    document.getElementById('detalle-nombre').textContent = productoActual.nombre;
    document.getElementById('detalle-precio').textContent = `₡${formatearNumero(productoActual.precio || 0)}`;
    document.getElementById('detalle-categoria').textContent = productoActual.categoria || '-';
    document.getElementById('detalle-estado').textContent = productoActual.activo ? 'Activo' : 'Inactivo';

    document.getElementById('modal-detalles-producto').classList.add('active');
}

function editarProducto(id) {
    const p = productosData.find(x => x.id === id);
    if (!p) return;

    document.getElementById('edit-producto-id').value = p.id;
    document.getElementById('edit-nombre').value = p.nombre;
    document.getElementById('edit-sku').value = p.sku || '';
    document.getElementById('edit-categoria').value = p.categoria_id || '';
    document.getElementById('edit-descripcion').value = p.descripcion || '';
    document.getElementById('edit-precio').value = p.precio || 0;
    document.getElementById('edit-activo').value = p.activo ? 1 : 0;

    document.getElementById('modal-editar-producto').classList.add('active');
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('active');
}

/* =============================
   STATS
============================= */
function actualizarEstadisticas() {
    document.getElementById('total-productos').textContent = productosData.length;
    document.getElementById('productos-activos').textContent =
        productosData.filter(p => p.activo).length;
}

/* =============================
   HELPERS
============================= */
function cargarCategorias() {
    const categorias = ['Hombre', 'Mujer', 'Gorros'];
    const select = document.getElementById('filter-categoria');

    select.innerHTML = '<option value="">Todas</option>' +
        categorias.map(c => `<option value="${c}">${c}</option>`).join('');
}

function actualizarPaginacion() {
    const total = Math.ceil(filteredData.length / itemsPerPage);
    document.getElementById('pagination').innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="cambiarPagina(${currentPage - 1})">‹</button>
        <span>${currentPage} / ${total || 1}</span>
        <button ${currentPage === total ? 'disabled' : ''} onclick="cambiarPagina(${currentPage + 1})">›</button>
    `;
}

function cambiarPagina(p) {
    currentPage = p;
    renderizarProductos();
}

function formatearNumero(n) {
    return new Intl.NumberFormat('es-CR').format(n);
}

function mostrarExito(msg) { alert(msg); }
function mostrarError(msg) { alert(msg); }
