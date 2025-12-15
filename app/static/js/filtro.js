// ============================================
// ACTUALIZACIÓN PARA MODALES DE PRODUCTOS
// Agregar esta función en filtro.js y filtroTienda.js
// ============================================

// Modificar la función del botón "Agregar al carrito" en el modal

// ANTES de configurarEventosModal, agregar esta función:

async function agregarProductoDesdeModal(productoId, nombre, precio) {
    const cantidadInput = document.querySelector('.input-cantidad');
    const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
    
    try {
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
            // Mostrar notificación de éxito
            mostrarNotificacionModal('¡Producto agregado al carrito!', 'success');
            
            // Actualizar contador del header
            actualizarContadorCarrito();
            
            // Cerrar modal después de 1 segundo
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
// MODIFICAR LA FUNCIÓN abrirModal
// ============================================

// En la función abrirModal, cambiar la línea del botón agregar para incluir el precio:

function abrirModal(nombre, precio, imagen, categoria, stock) {
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
    
    // Obtener el producto ID del elemento padre
    const productoCard = event.target.closest('.product-card');
    const productoId = productoCard ? productoCard.getAttribute('data-producto-id') : null;
    
    modal.querySelector('.modal-nombre').textContent = nombre;
    modal.querySelector('.modal-categoria').textContent = categoria;
    modal.querySelector('.modal-precio').textContent = precio;
    modal.querySelector('.modal-imagen').src = imagen;
    
    // Guardar ID y precio en el botón
    const btnAgregar = modal.querySelector('.btn-agregar');
    if (productoId) {
        btnAgregar.setAttribute('data-producto-id', productoId);
        btnAgregar.setAttribute('data-precio', precio.replace('₡', '').replace(/,/g, ''));
    }
    
    // Actualizar disponibilidad
    const disponibleEl = modal.querySelector('.modal-disponible');
    if (stock && stock !== 'disponible') {
        const stockNum = parseInt(stock);
        if (stockNum > 0) {
            disponibleEl.textContent = '✓ Disponible en stock (' + stock + ' unidades)';
            disponibleEl.style.color = '#27ae60';
        } else {
            disponibleEl.textContent = 'No disponible en stock';
            disponibleEl.style.color = '#e74c3c';
        }
    } else {
        disponibleEl.textContent = '✓ Disponible en stock';
        disponibleEl.style.color = '#27ae60';
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ============================================
// MODIFICAR configurarEventosModal
// ============================================

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
        inputCantidad.value = valor + 1;
    });
    
    // MODIFICAR EL EVENT LISTENER DEL BOTÓN AGREGAR
    btnAgregar.addEventListener('click', function() {
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
// AGREGAR data-producto-id A LAS TARJETAS
// ============================================

// En tienda.html, mujer.html, hombres.html, gorro.html, agregar el data-producto-id:
// Cambiar de:
// <div class="product-card" data-category="..." data-price="..." data-name="...">

// A:
// <div class="product-card" data-producto-id="{{ productos.id }}" data-category="..." data-price="..." data-name="...">

// Ejemplo completo:
/*
<div class="product-card" 
     data-producto-id="{{ productos.id }}"
     data-category="{{ productos.categoria }}" 
     data-price="{{ productos.precio }}" 
     data-name="{{ productos.nombre }}" 
     data-stock="{{ productos.stock_disponible | default('disponible') }}">
*/