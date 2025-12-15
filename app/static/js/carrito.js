// ============================================
// CARRITO CON INTEGRACIÓN BACKEND COMPLETA
// ============================================

let carritoData = {
    items: [],
    total: 0,
    count: 0,
    subtotal: 0,
    envio: 0,
    impuestos: 0
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    cargarCarritoDesdeBackend();
    actualizarContadorHeader();
});

// ============================================
// FUNCIONES DE API
// ============================================

async function cargarCarritoDesdeBackend() {
    const loadingState = document.getElementById('loading-state');
    const cartItems = document.getElementById('cartItems');
    const emptyState = document.getElementById('empty-state');
    const couponSection = document.getElementById('coupon-section');
    const summarySection = document.getElementById('order-summary-section');
    
    try {
        const response = await fetch('/api/carrito');
        const data = await response.json();
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (data.success && data.items.length > 0) {
            carritoData = {
                items: data.items,
                count: data.count,
                subtotal: data.total,
                envio: data.total >= 50000 ? 0 : 5000, // Envío gratis si es más de ₡50,000
                impuestos: data.total * 0.13 // IVA 13%
            };
            
            carritoData.total = carritoData.subtotal + carritoData.envio + carritoData.impuestos;
            
            if (cartItems) {
                cartItems.style.display = 'block';
                renderCarrito();
            }
            if (couponSection) couponSection.style.display = 'flex';
            if (summarySection) summarySection.style.display = 'block';
            
            actualizarResumen();
            actualizarContadorHeader();
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        if (loadingState) {
            loadingState.innerHTML = '<p style="color: #ef4444;">Error al cargar el carrito</p>';
        }
        mostrarNotificacion('Error de conexión', 'error');
    }
}

async function agregarProductoAlCarrito(productoId, cantidad, precioUnitario) {
    try {
        const response = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                producto_id: productoId,
                cantidad: cantidad,
                precio_unitario: precioUnitario
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion(data.mensaje, 'success');
            await cargarCarritoDesdeBackend();
            return true;
        } else {
            mostrarNotificacion(data.error, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar producto', 'error');
        return false;
    }
}

async function actualizarCantidad(productoId, nuevaCantidad) {
    try {
        const response = await fetch('/api/carrito/actualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                producto_id: productoId,
                cantidad: nuevaCantidad
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await cargarCarritoDesdeBackend();
            mostrarNotificacion('Cantidad actualizada', 'info');
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');
    }
}

async function eliminarProducto(productoId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/carrito/eliminar/${productoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await cargarCarritoDesdeBackend();
            mostrarNotificacion(data.mensaje, 'success');
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar producto', 'error');
    }
}

async function vaciarCarritoCompleto() {
    if (!confirm('¿Estás seguro de vaciar todo el carrito?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/carrito/vaciar', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await cargarCarritoDesdeBackend();
            mostrarNotificacion(data.mensaje, 'success');
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al vaciar carrito', 'error');
    }
}

async function actualizarContadorHeader() {
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

// ============================================
// RENDERIZADO
// ============================================

function renderCarrito() {
    const container = document.getElementById('cartItems');
    
    if (!container) return;
    
    container.innerHTML = carritoData.items.map(item => {
        const imagenUrl = item.imagen_url 
            ? `/static/${item.imagen_url}` 
            : '/static/img/placeholder.png';
        
        return `
            <div class="cart-item" data-producto-id="${item.producto_id}">
                <div class="product-info">
                    <img src="${imagenUrl}" 
                         alt="${item.producto_nombre}" 
                         class="product-image"
                         onerror="this.src='/static/img/placeholder.png'">
                    <div class="product-details">
                        <h4>${item.producto_nombre}</h4>
                        <p>SKU: ${item.sku} | ${item.categoria || 'Sin categoría'}</p>
                        <button class="remove-btn" 
                                onclick="eliminarProducto(${item.producto_id})" 
                                title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="price">₡${formatearPrecio(item.precio_unitario)}</div>
                <div class="quantity-controls">
                    <button class="qty-btn" 
                            onclick="cambiarCantidad(${item.producto_id}, ${item.cantidad - 1})">
                        −
                    </button>
                    <span class="qty-display">${item.cantidad}</span>
                    <button class="qty-btn" 
                            onclick="cambiarCantidad(${item.producto_id}, ${item.cantidad + 1})">
                        +
                    </button>
                </div>
                <div class="subtotal">₡${formatearPrecio(item.subtotal)}</div>
            </div>
        `;
    }).join('');
}

function actualizarResumen() {
    const itemCount = document.getElementById('itemCount');
    const subtotal = document.getElementById('subtotal');
    const shipping = document.getElementById('shipping');
    const taxes = document.getElementById('taxes');
    const total = document.getElementById('total');
    
    if (!itemCount || !subtotal || !total) return;
    
    itemCount.textContent = carritoData.count;
    subtotal.textContent = `₡${formatearPrecio(carritoData.subtotal)}`;
    shipping.textContent = `₡${formatearPrecio(carritoData.envio)}`;
    taxes.textContent = `₡${formatearPrecio(carritoData.impuestos)}`;
    total.textContent = `₡${formatearPrecio(carritoData.total)}`;
    
    // Mostrar mensaje de envío gratis
    if (carritoData.envio === 0 && carritoData.subtotal > 0) {
        const shippingElement = document.getElementById('shipping');
        if (shippingElement) {
            shippingElement.innerHTML = '₡0 <small style="color: #10b981;">(¡Gratis!)</small>';
        }
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function cambiarCantidad(productoId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarProducto(productoId);
        return;
    }
    
    actualizarCantidad(productoId, nuevaCantidad);
}

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const existente = document.querySelector('.notification');
    if (existente) {
        existente.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${tipo}`;
    notification.textContent = mensaje;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
    `;
    
    const colores = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#b794c9'
    };
    
    notification.style.backgroundColor = colores[tipo] || colores.info;
    
    document.body.appendChild(notification);
    
    // Agregar estilos de animación si no existen
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
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
    }
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// CUPONES
// ============================================

async function aplicarCupon() {
    const couponInput = document.getElementById('couponInput');
    const couponCode = couponInput?.value.trim().toUpperCase();
    
    if (!couponCode) {
        mostrarNotificacion('Por favor ingresa un código de cupón', 'warning');
        return;
    }
    
    // Por ahora, cupones hardcodeados
    const cupones = {
        'PIJAMAS10': 10,
        'PIJAMAS20': 20,
        'WELCOME15': 15
    };
    
    if (cupones[couponCode]) {
        const descuento = carritoData.subtotal * (cupones[couponCode] / 100);
        
        document.getElementById('discountRow').style.display = 'flex';
        document.getElementById('discount').textContent = `-₡${formatearPrecio(descuento)}`;
        
        carritoData.total = carritoData.subtotal + carritoData.envio + carritoData.impuestos - descuento;
        document.getElementById('total').textContent = `₡${formatearPrecio(carritoData.total)}`;
        
        mostrarNotificacion(`¡Cupón aplicado! ${cupones[couponCode]}% de descuento`, 'success');
        couponInput.value = '';
    } else {
        mostrarNotificacion('Cupón inválido o expirado', 'error');
    }
}

// ============================================
// CHECKOUT
// ============================================

function procederAlCheckout() {
    if (carritoData.items.length === 0) {
        mostrarNotificacion('Tu carrito está vacío', 'warning');
        return;
    }
    
    window.location.href = '/carrito/checkout';
}

// ============================================
// AGREGAR DESDE MODAL DE PRODUCTO
// ============================================

window.agregarDesdeModal = async function(productoId, precioBase) {
    const cantidadInput = document.querySelector('.input-cantidad');
    const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
    
    const success = await agregarProductoAlCarrito(productoId, cantidad, precioBase);
    
    if (success) {
        const modal = document.getElementById('modalProducto');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
};

// Exponer funciones globalmente
window.cargarCarritoDesdeBackend = cargarCarritoDesdeBackend;
window.agregarProductoAlCarrito = agregarProductoAlCarrito;
window.eliminarProducto = eliminarProducto;
window.vaciarCarritoCompleto = vaciarCarritoCompleto;
window.procederAlCheckout = procederAlCheckout;
window.cambiarCantidad = cambiarCantidad;
window.aplicarCupon = aplicarCupon;