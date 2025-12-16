// ============================================
// FUNCIONES DE INTEGRACIÓN CON BACKEND
// ============================================

async function agregarProductoDesdeModal(productoId, nombre, precio) {
    const cantidadInput = document.querySelector('.input-cantidad');
    const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
    
    try {
        // Verificar stock antes de agregar
        const stockInfo = await verificarStock(productoId, cantidad);
        
        if (!stockInfo.disponible) {
            if (stockInfo.stock === 0) {
                mostrarNotificacionModal('Producto sin stock disponible', 'error');
            } else {
                mostrarNotificacionModal(`Solo hay ${stockInfo.stock} unidades disponibles`, 'warning');
            }
            return;
        }
        
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                producto_id: productoId,
                cantidad: cantidad,
                precio_unitario: precio
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacionModal('¡Producto agregado al carrito!', 'success');
            actualizarContadorCarrito();
            
            setTimeout(() => {
                const modal = document.getElementById('modalProducto');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }, 1000);
        } else {
            mostrarNotificacionModal(data.error || 'Error al agregar producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionModal('Error de conexión', 'error');
    }
}

async function verificarStock(productoId, cantidadSolicitada) {
    try {
        const response = await fetch(`/api/producto/${productoId}/stock`);
        const data = await response.json();
        
        if (data.success) {
            return {
                disponible: data.stock_disponible >= cantidadSolicitada,
                stock: data.stock_disponible
            };
        }
        return { disponible: false, stock: 0 };
    } catch (error) {
        console.error('Error al verificar stock:', error);
        return { disponible: false, stock: 0 };
    }
}

async function agregarProductoDirecto(productoId, nombre, precio) {
    try {
        // Verificar stock antes de agregar
        const stockInfo = await verificarStock(productoId, 1);
        
        if (!stockInfo.disponible) {
            if (stockInfo.stock === 0) {
                mostrarNotificacionModal('Producto sin stock disponible', 'error');
            } else {
                mostrarNotificacionModal(`Solo hay ${stockInfo.stock} unidades disponibles`, 'warning');
            }
            return;
        }
        
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                producto_id: productoId,
                cantidad: 1,
                precio_unitario: precio
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacionModal('¡Producto agregado al carrito!', 'success');
            actualizarContadorCarrito();
        } else {
            mostrarNotificacionModal(data.error || 'Error al agregar producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacionModal('Error de conexión', 'error');
    }
}

async function actualizarContadorCarrito() {
    try {
        const response = await fetch('/api/carrito/count');
        const data = await response.json();
        
        if (data.success) {
            const badge = document.getElementById('cart-count-badge');
            if (badge) {
                badge.textContent = data.count;
                badge.style.display = data.count > 0 ? 'flex' : 'none';
            }
        }
    } catch (error) {
        console.error('Error al actualizar contador:', error);
    }
}

function mostrarNotificacionModal(mensaje, tipo = 'info') {
    const existente = document.querySelector('.notification-modal');
    if (existente) {
        existente.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-modal notification-${tipo}`;
    notification.innerHTML = `
        <i class="bi ${tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}"></i>
        <span>${mensaje}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10002;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.style.backgroundColor = colores[tipo] || colores.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// MODAL DE PRODUCTO
// ============================================

function abrirModal(nombre, precio, imagen, categoria, stock, productoId) {
    let modal = document.getElementById('modalProducto');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalProducto';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-fondo"></div>
            <div class="modal-caja">
                <button class="modal-cerrar">&times;</button>
                
                <div class="modal-contenido">
                    <div class="modal-izquierda">
                        <img src="" class="modal-imagen" alt="Producto">
                    </div>
                    
                    <div class="modal-derecha">
                        <div class="modal-header">
                            <p class="modal-categoria"></p>
                        </div>
                        
                        <h2 class="modal-nombre"></h2>
                        <p class="modal-precio"></p>
                        
                        <div class="modal-separador"></div>
                        
                        <div class="selector-cantidad">
                            <p class="selector-label">Cantidad:</p>
                            <div class="controles-cantidad">
                                <button class="btn-cantidad menos">−</button>
                                <input type="number" class="input-cantidad" value="1" min="1">
                                <button class="btn-cantidad mas">+</button>
                            </div>
                        </div>
                        
                        <button class="btn-agregar" data-producto-id="" data-precio="">
                            AGREGAR AL CARRITO
                        </button>
                        
                        <div class="modal-footer">
                            <p class="modal-disponible"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        configurarEventosModal(modal);
    }
    
    modal.querySelector('.modal-nombre').textContent = nombre;
    modal.querySelector('.modal-categoria').textContent = categoria;
    modal.querySelector('.modal-precio').textContent = precio;
    modal.querySelector('.modal-imagen').src = imagen;
    
    const btnAgregar = modal.querySelector('.btn-agregar');
    const inputCantidad = modal.querySelector('.input-cantidad');
    let precioLimpio = precio.toString().replace('₡', '').replace(/,/g, '').trim();
    
    if (productoId) {
        btnAgregar.setAttribute('data-producto-id', productoId);
        btnAgregar.setAttribute('data-precio', precioLimpio);
    }
    
    // Configurar disponibilidad y controles según stock
    const disponibleEl = modal.querySelector('.modal-disponible');
    const stockNum = parseInt(stock) || 0;
    
    if (stockNum > 0) {
        disponibleEl.textContent = `✓ Disponible en stock (${stockNum} unidades)`;
        disponibleEl.style.color = '#27ae60';
        btnAgregar.disabled = false;
        btnAgregar.style.opacity = '1';
        btnAgregar.style.cursor = 'pointer';
        inputCantidad.max = stockNum;
    } else {
        disponibleEl.textContent = '✗ Sin stock disponible';
        disponibleEl.style.color = '#e74c3c';
        btnAgregar.disabled = true;
        btnAgregar.style.opacity = '0.5';
        btnAgregar.style.cursor = 'not-allowed';
        btnAgregar.title = 'Producto sin stock';
        inputCantidad.disabled = true;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function configurarEventosModal(modal) {
    const btnCerrar = modal.querySelector('.modal-cerrar');
    const fondo = modal.querySelector('.modal-fondo');
    const btnMenos = modal.querySelector('.menos');
    const btnMas = modal.querySelector('.mas');
    const inputCantidad = modal.querySelector('.input-cantidad');
    const btnAgregar = modal.querySelector('.btn-agregar');
    
    btnCerrar.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    fondo.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    btnMenos.addEventListener('click', function() {
        let valor = parseInt(inputCantidad.value);
        if (valor > 1) {
            inputCantidad.value = valor - 1;
        }
    });
    
    btnMas.addEventListener('click', function() {
        let valor = parseInt(inputCantidad.value);
        const max = parseInt(inputCantidad.max) || 999;
        if (valor < max) {
            inputCantidad.value = valor + 1;
        } else {
            mostrarNotificacionModal(`Máximo ${max} unidades disponibles`, 'warning');
        }
    });
    
    // Validar que no se exceda el máximo al escribir
    inputCantidad.addEventListener('input', function() {
        const max = parseInt(this.max) || 999;
        const valor = parseInt(this.value) || 1;
        
        if (valor > max) {
            this.value = max;
            mostrarNotificacionModal(`Máximo ${max} unidades disponibles`, 'warning');
        }
        if (valor < 1) {
            this.value = 1;
        }
    });
    
    btnAgregar.addEventListener('click', function() {
        if (this.disabled) {
            mostrarNotificacionModal('Producto sin stock disponible', 'error');
            return;
        }
        
        const productoId = this.getAttribute('data-producto-id');
        const precio = parseFloat(this.getAttribute('data-precio'));
        const nombre = modal.querySelector('.modal-nombre').textContent;
        
        if (productoId && precio) {
            agregarProductoDesdeModal(parseInt(productoId), nombre, precio);
        } else {
            console.error('No se encontró ID o precio del producto');
            mostrarNotificacionModal('Error: No se pudo identificar el producto', 'error');
        }
    });
}

// ============================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para botones de productos
    const setupProductButtons = () => {
        // Botón "Agregar al carrito" directo
        document.querySelectorAll('.btn-add-cart').forEach(boton => {
            boton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const card = boton.closest('.product-card');
                const id = card.getAttribute('data-producto-id');
                const nombre = card.getAttribute('data-name');
                const precio = card.getAttribute('data-price');
                const stock = parseInt(card.getAttribute('data-stock')) || 0;
                
                console.log('Agregar al carrito:', { id, nombre, precio, stock });
                
                // Verificar stock antes de intentar agregar
                if (stock <= 0) {
                    mostrarNotificacionModal('Producto sin stock disponible', 'error');
                    return;
                }
                
                if (id && precio) {
                    let precioLimpio = precio.toString().replace('₡', '').replace(/,/g, '').trim();
                    await agregarProductoDirecto(parseInt(id), nombre, parseFloat(precioLimpio));
                } else {
                    console.error('Datos incompletos:', { id, nombre, precio });
                    mostrarNotificacionModal('Error: Datos del producto incompletos', 'error');
                }
            });
        });
        
        // Botón "Ver producto" (abre modal)
        document.querySelectorAll('.btn-view-product').forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const card = boton.closest('.product-card');
                const id = card.getAttribute('data-producto-id');
                const nombre = card.getAttribute('data-name');
                const precio = card.getAttribute('data-price');
                const categoria = card.getAttribute('data-category');
                const stock = card.getAttribute('data-stock');
                
                const imgElement = card.querySelector('.product-img img');
                const imagen = imgElement ? imgElement.src : '';
                
                console.log('Abrir modal:', { id, nombre, precio, categoria, stock });
                
                abrirModal(nombre, precio, imagen, categoria, stock, id);
            });
        });
    };
    
    // Configurar botones al cargar
    setupProductButtons();
    
    // ============================================
    // FUNCIONALIDAD DE FILTROS
    // ============================================
    
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const navTabs = document.querySelectorAll('.nav-tab');
    const productCards = document.querySelectorAll('.product-card');
    const productCount = document.getElementById('productCount');
    
    // Toggle dropdown de filtros
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('active');
            }
        });
    }
    
    // Filtros por categoría
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filter = tab.getAttribute('data-filter');
            filtrarProductos(filter);
        });
    });
    
    // Opciones de ordenamiento
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.getAttribute('data-sort');
            ordenarProductos(sortType);
            filterDropdown.classList.remove('active');
        });
    });
    
    function filtrarProductos(categoria) {
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            
            if (categoria === 'todos' || cardCategory === categoria) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        if (productCount) {
            productCount.textContent = `${visibleCount} producto${visibleCount !== 1 ? 's' : ''}`;
        }
    }
    
    function ordenarProductos(tipo) {
        const grid = document.querySelector('.products-grid');
        const cards = Array.from(productCards);
        
        cards.sort((a, b) => {
            const precioA = parseFloat(a.getAttribute('data-price').replace(/[^\d.-]/g, ''));
            const precioB = parseFloat(b.getAttribute('data-price').replace(/[^\d.-]/g, ''));
            const nombreA = a.getAttribute('data-name').toLowerCase();
            const nombreB = b.getAttribute('data-name').toLowerCase();
            
            switch(tipo) {
                case 'precio-asc':
                    return precioA - precioB;
                case 'precio-desc':
                    return precioB - precioA;
                case 'nombre':
                    return nombreA.localeCompare(nombreB);
                default:
                    return 0;
            }
        });
        
        cards.forEach(card => grid.appendChild(card));
        
        // Reconfigurar event listeners después de reordenar
        setupProductButtons();
    }
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);