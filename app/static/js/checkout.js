// ============================================
// CHECKOUT - LÓGICA COMPLETA
// ============================================

let carritoData = {
    items: [],
    total: 0,
    subtotal: 0,
    envio: 0,
    impuestos: 0
};

let direccionesUsuario = [];
let direccionSeleccionada = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await cargarCarrito();
    await cargarDirecciones();
    configurarFormulario();
    configurarMetodosPago();
});

// ============================================
// CARGAR DATOS
// ============================================

async function cargarCarrito() {
    const loadingCart = document.getElementById('loading-cart');
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const totalsSection = document.getElementById('totals-section');
    
    try {
        const response = await fetch('/api/carrito');
        const data = await response.json();
        
        loadingCart.style.display = 'none';
        
        if (data.success && data.items.length > 0) {
            carritoData.items = data.items;
            carritoData.subtotal = data.total;
            
            // Calcular envío e impuestos
            carritoData.envio = data.total >= 50000 ? 0 : 5000;
            carritoData.impuestos = data.total * 0.13;
            carritoData.total = data.total + carritoData.envio + carritoData.impuestos;
            
            cartItems.style.display = 'block';
            totalsSection.style.display = 'block';
            renderCarrito();
            actualizarTotales();
        } else {
            cartEmpty.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        loadingCart.innerHTML = '<p style="color: #ef4444;">Error al cargar el carrito</p>';
    }
}

async function cargarDirecciones() {
    try {
        const response = await fetch('/api/direcciones');
        const data = await response.json();
        
        if (data.success && data.direcciones) {
            direccionesUsuario = data.direcciones;
            renderDirecciones();
        }
    } catch (error) {
        console.error('Error al cargar direcciones:', error);
    }
}

// ============================================
// RENDERIZADO
// ============================================

function renderCarrito() {
    const container = document.getElementById('cart-items');
    
    container.innerHTML = carritoData.items.map(item => {
        const imagenUrl = item.imagen_url 
            ? `/static/${item.imagen_url}` 
            : '/static/img/placeholder.png';
        
        return `
            <div class="cart-item">
                <img src="${imagenUrl}" 
                     alt="${item.producto_nombre}"
                     onerror="this.src='/static/img/placeholder.png'">
                <div class="cart-item-info">
                    <h4>${item.producto_nombre}</h4>
                    <p>Cantidad: ${item.cantidad} × ₡${formatearPrecio(item.precio_unitario)}</p>
                </div>
                <div style="font-weight: 600;">
                    ₡${formatearPrecio(item.subtotal)}
                </div>
            </div>
        `;
    }).join('');
}

function renderDirecciones() {
    const select = document.getElementById('select-direccion');
    
    if (!select || direccionesUsuario.length === 0) return;
    
    direccionesUsuario.forEach(dir => {
        const option = document.createElement('option');
        option.value = dir.id_direccion;
        option.textContent = `${dir.etiqueta || 'Dirección'} - ${dir.linea_1}, ${dir.ciudad}`;
        select.appendChild(option);
    });
}

function actualizarTotales() {
    document.getElementById('subtotal').textContent = `₡${formatearPrecio(carritoData.subtotal)}`;
    document.getElementById('shipping').textContent = `₡${formatearPrecio(carritoData.envio)}`;
    document.getElementById('taxes').textContent = `₡${formatearPrecio(carritoData.impuestos)}`;
    document.getElementById('total').textContent = `₡${formatearPrecio(carritoData.total)}`;
}

// ============================================
// MANEJO DE DIRECCIONES
// ============================================

function mostrarFormularioDireccion() {
    const select = document.getElementById('select-direccion');
    const formulario = document.getElementById('nueva-direccion');
    
    select.value = '';
    formulario.style.display = 'block';
    direccionSeleccionada = null;
}

document.getElementById('select-direccion')?.addEventListener('change', function() {
    const formulario = document.getElementById('nueva-direccion');
    
    if (this.value) {
        formulario.style.display = 'none';
        direccionSeleccionada = parseInt(this.value);
    } else {
        formulario.style.display = 'block';
        direccionSeleccionada = null;
    }
});

async function guardarNuevaDireccion() {
    const nombreDestinatario = document.getElementById('nombre-destinatario').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;
    const ciudad = document.getElementById('ciudad').value;
    const provincia = document.getElementById('provincia').value;
    const codigoPostal = document.getElementById('codigo-postal').value;
    
    try {
        const response = await fetch('/api/direcciones/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                etiqueta: 'Nueva Dirección',
                nombre_destinatario: nombreDestinatario,
                linea_1: direccion,
                ciudad: ciudad,
                provincia: provincia,
                codigo_postal: codigoPostal,
                pais: 'Costa Rica',
                telefono: telefono
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.direccion_id;
        } else {
            throw new Error(data.error || 'Error al guardar dirección');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// ============================================
// MÉTODOS DE PAGO
// ============================================

function configurarMetodosPago() {
    const radios = document.querySelectorAll('input[name="metodo-pago"]');
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Ocultar todas las infos
            document.querySelectorAll('.payment-info').forEach(info => {
                info.style.display = 'none';
            });
            
            // Mostrar info del método seleccionado
            if (this.value === 'SINPE') {
                document.getElementById('info-sinpe').style.display = 'block';
            } else if (this.value === 'TRANSFERENCIA') {
                document.getElementById('info-transferencia').style.display = 'block';
            }
        });
    });
}

// ============================================
// ENVÍO DEL FORMULARIO
// ============================================

function configurarFormulario() {
    const form = document.getElementById('checkout-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await procesarCompra();
    });
}

async function procesarCompra() {
    const btnFinalizar = document.getElementById('btn-finalizar');
    const originalText = btnFinalizar.innerHTML;
    
    try {
        // Validar que haya items en el carrito
        if (carritoData.items.length === 0) {
            mostrarError('El carrito está vacío');
            return;
        }
        
        // Validar términos y condiciones
        if (!document.getElementById('aceptar-terminos').checked) {
            mostrarError('Debes aceptar los términos y condiciones');
            return;
        }
        
        // Obtener o crear dirección
        let direccionId = direccionSeleccionada;
        
        if (!direccionId) {
            // Validar campos de nueva dirección
            if (!validarFormularioDireccion()) {
                mostrarError('Por favor completa todos los campos de dirección');
                return;
            }
            
            // Guardar nueva dirección si está marcado
            if (document.getElementById('guardar-direccion').checked) {
                btnFinalizar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando dirección...';
                direccionId = await guardarNuevaDireccion();
            } else {
                // Si no se va a guardar, usar una dirección temporal (ID 0)
                // El backend deberá manejar esto
                direccionId = 0;
            }
        }
        
        // Obtener método de pago
        const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
        const notas = document.getElementById('notas').value;
        
        // Mostrar estado de carga
        btnFinalizar.disabled = true;
        btnFinalizar.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando compra...';
        
        // Crear la orden
        const response = await fetch('/api/orden/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sucursal_id: 1,
                direccion_envio_id: direccionId,
                metodo_pago: metodoPago,
                notas: notas
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar modal de confirmación
            mostrarConfirmacion(data.numero_orden);
        } else {
            throw new Error(data.error || 'Error al procesar la compra');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message || 'Error al procesar la compra. Por favor intenta de nuevo.');
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = originalText;
    }
}

function validarFormularioDireccion() {
    const campos = [
        'nombre-destinatario',
        'telefono',
        'direccion',
        'ciudad',
        'provincia'
    ];
    
    for (const campo of campos) {
        const elemento = document.getElementById(campo);
        if (!elemento.value.trim()) {
            elemento.focus();
            return false;
        }
    }
    
    return true;
}

// ============================================
// UTILIDADES
// ============================================

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function mostrarError(mensaje) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.textContent = mensaje;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        background: #ef4444;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function mostrarConfirmacion(numeroOrden) {
    const modal = document.getElementById('modal-confirmacion');
    const numeroOrdenSpan = document.getElementById('numero-orden');
    
    numeroOrdenSpan.textContent = numeroOrden;
    modal.style.display = 'flex';
}

// ============================================
// API HELPER PARA DIRECCIONES
// ============================================

// Esta función debe agregarse al backend en routes.py
async function crearDireccionAPI() {
    // Endpoint: POST /api/direcciones/crear
    // Body: { etiqueta, nombre_destinatario, linea_1, ciudad, provincia, codigo_postal, pais, telefono }
    // Response: { success: boolean, direccion_id: number, error?: string }
}

// Estilos para animaciones
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