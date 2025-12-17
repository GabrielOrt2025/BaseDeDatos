// ============================================
// CHECKOUT - SISTEMA COMPLETO
// app/static/js/checkout.js
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
    configurarSelectDireccion();
});

// ============================================
// CARGAR DATOS DEL BACKEND
// ============================================

async function cargarCarrito() {
    const loadingCart = document.getElementById('loading-cart');
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const totalsSection = document.getElementById('totals-section');
    
    console.log('🔄 Cargando carrito desde API...');
    
    try {
        const response = await fetch('/api/carrito');
        console.log('📡 Respuesta recibida:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Datos del carrito:', data);
        
        if (loadingCart) loadingCart.style.display = 'none';
        
        if (data.success && data.items && data.items.length > 0) {
            // Guardar datos del carrito desde la API
            carritoData = {
                items: data.items,
                subtotal: parseFloat(data.total) || 0,
                envio: parseFloat(data.total) >= 50000 ? 0 : 5000,
                impuestos: parseFloat(data.total) * 0.13,
                total: 0
            };
            
            // Calcular total final
            carritoData.total = carritoData.subtotal + carritoData.envio + carritoData.impuestos;
            
            console.log('✅ Carrito procesado:', {
                items: carritoData.items.length,
                subtotal: carritoData.subtotal,
                envio: carritoData.envio,
                impuestos: carritoData.impuestos,
                total: carritoData.total
            });
            
            if (cartItems) cartItems.style.display = 'block';
            if (totalsSection) totalsSection.style.display = 'block';
            
            renderCarrito();
            actualizarTotales();
        } else {
            console.log('⚠️ Carrito vacío o sin items');
            if (cartEmpty) {
                cartEmpty.style.display = 'block';
            }
            // Redirigir al carrito si está vacío
            setTimeout(() => {
                window.location.href = '/carrito';
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Error al cargar carrito:', error);
        if (loadingCart) {
            loadingCart.innerHTML = '<p style="color: #ef4444;">Error al cargar el carrito. Por favor recarga la página.</p>';
        }
        
        // Mostrar error al usuario
        mostrarError('No se pudo cargar el carrito. Verifica tu conexión e intenta de nuevo.');
    }
}

async function cargarDirecciones() {
    console.log('🔄 Cargando direcciones desde API...');
    
    try {
        const response = await fetch('/api/direcciones');
        console.log('📡 Respuesta direcciones:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📍 Datos de direcciones:', data);
        
        if (data.success && data.direcciones && data.direcciones.length > 0) {
            direccionesUsuario = data.direcciones;
            console.log(`✅ ${direccionesUsuario.length} direcciones cargadas`);
            renderDirecciones();
        } else {
            console.log('⚠️ No hay direcciones guardadas - Mostrando formulario');
            // Si no hay direcciones, mostrar formulario directamente
            const selectContainer = document.getElementById('direcciones-guardadas');
            if (selectContainer) selectContainer.style.display = 'none';
            
            const formulario = document.getElementById('nueva-direccion');
            if (formulario) formulario.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Error al cargar direcciones:', error);
        // En caso de error, mostrar formulario
        const selectContainer = document.getElementById('direcciones-guardadas');
        if (selectContainer) selectContainer.style.display = 'none';
        
        const formulario = document.getElementById('nueva-direccion');
        if (formulario) formulario.style.display = 'block';
    }
}

// ============================================
// RENDERIZADO DE ELEMENTOS
// ============================================

function renderCarrito() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    container.innerHTML = carritoData.items.map(item => {
        const imagenUrl = item.imagen_url 
            ? `/static/${item.imagen_url}` 
            : '/static/img/placeholder.png';
        
        return `
            <div class="cart-item">
                <img src="${imagenUrl}" 
                     alt="${item.producto_nombre}"
                     onerror="this.src='/static/img/placeholder.png'"
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                <div class="cart-item-info" style="flex: 1; margin-left: 16px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 1rem;">${item.producto_nombre}</h4>
                    <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
                        Cantidad: ${item.cantidad} × ₡${formatearPrecio(item.precio_unitario)}
                    </p>
                </div>
                <div style="font-weight: 600; font-size: 1.125rem; color: #b794c9;">
                    ₡${formatearPrecio(item.subtotal)}
                </div>
            </div>
        `;
    }).join('');
}

function renderDirecciones() {
    const select = document.getElementById('select-direccion');
    if (!select) return;
    
    // Limpiar opciones existentes excepto la primera
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Agregar direcciones al select
    direccionesUsuario.forEach(dir => {
        const option = document.createElement('option');
        option.value = dir.id_direccion;
        option.textContent = `${dir.etiqueta || 'Dirección'} - ${dir.linea_1}, ${dir.ciudad}`;
        select.appendChild(option);
    });
}

function actualizarTotales() {
    const subtotal = document.getElementById('subtotal');
    const shipping = document.getElementById('shipping');
    const taxes = document.getElementById('taxes');
    const total = document.getElementById('total');
    
    if (!subtotal || !total) return;
    
    subtotal.textContent = `₡${formatearPrecio(carritoData.subtotal)}`;
    taxes.textContent = `₡${formatearPrecio(carritoData.impuestos)}`;
    total.textContent = `₡${formatearPrecio(carritoData.total)}`;
    
    // Mostrar mensaje de envío gratis si aplica
    if (shipping) {
        if (carritoData.envio === 0 && carritoData.subtotal > 0) {
            shipping.innerHTML = '₡0 <small style="color: #10b981; font-weight: 500;">(¡Gratis!)</small>';
        } else {
            shipping.textContent = `₡${formatearPrecio(carritoData.envio)}`;
        }
    }
}

// ============================================
// CONFIGURACIÓN DE EVENTOS
// ============================================

function configurarSelectDireccion() {
    const selectDireccion = document.getElementById('select-direccion');
    if (!selectDireccion) return;
    
    selectDireccion.addEventListener('change', function() {
        const formulario = document.getElementById('nueva-direccion');
        
        if (this.value) {
            // Dirección seleccionada
            if (formulario) formulario.style.display = 'none';
            direccionSeleccionada = parseInt(this.value);
        } else {
            // Mostrar formulario para nueva dirección
            if (formulario) formulario.style.display = 'block';
            direccionSeleccionada = null;
        }
    });
}

function configurarMetodosPago() {
    const radios = document.querySelectorAll('input[name="metodo-pago"]');
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Ocultar todas las infos de pago
            document.querySelectorAll('.payment-info').forEach(info => {
                info.style.display = 'none';
            });
            
            // Mostrar info del método seleccionado
            const infoId = `info-${this.value.toLowerCase()}`;
            const infoElement = document.getElementById(infoId);
            if (infoElement) {
                infoElement.style.display = 'block';
            }
        });
    });
}

function configurarFormulario() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await procesarCompra();
    });
}

// ============================================
// FUNCIONES DE DIRECCIONES
// ============================================

function mostrarFormularioDireccion() {
    const select = document.getElementById('select-direccion');
    const formulario = document.getElementById('nueva-direccion');
    
    if (select) select.value = '';
    if (formulario) formulario.style.display = 'block';
    direccionSeleccionada = null;
}

async function guardarNuevaDireccion() {
    const nombreDestinatario = document.getElementById('nombre-destinatario')?.value;
    const telefono = document.getElementById('telefono')?.value;
    const direccion = document.getElementById('direccion')?.value;
    const ciudad = document.getElementById('ciudad')?.value;
    const provincia = document.getElementById('provincia')?.value;
    const codigoPostal = document.getElementById('codigo-postal')?.value || '';
    
    try {
        const response = await fetch('/api/direcciones/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                etiqueta: 'Dirección Principal',
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
        console.error('Error al guardar dirección:', error);
        throw error;
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
    
    for (const campoId of campos) {
        const elemento = document.getElementById(campoId);
        if (!elemento || !elemento.value.trim()) {
            if (elemento) {
                elemento.focus();
                elemento.style.borderColor = '#ef4444';
                setTimeout(() => {
                    elemento.style.borderColor = '';
                }, 2000);
            }
            return false;
        }
    }
    
    return true;
}

// ============================================
// PROCESO DE COMPRA
// ============================================

async function procesarCompra() {
    const btnFinalizar = document.getElementById('btn-finalizar');
    if (!btnFinalizar) return;
    
    const originalText = btnFinalizar.innerHTML;
    
    console.log('🛒 Iniciando proceso de compra...');
    console.log('📦 Estado del carrito:', carritoData);
    
    try {
        // 1. Validar que haya items en el carrito
        if (!carritoData.items || carritoData.items.length === 0) {
            console.error('❌ Carrito vacío');
            mostrarError('El carrito está vacío');
            return;
        }
        
        console.log(`✅ Carrito válido: ${carritoData.items.length} items`);
        
        // 2. Validar términos y condiciones
        const aceptarTerminos = document.getElementById('aceptar-terminos');
        if (!aceptarTerminos || !aceptarTerminos.checked) {
            console.error('❌ Términos no aceptados');
            mostrarError('Debes aceptar los términos y condiciones');
            aceptarTerminos?.focus();
            return;
        }
        
        console.log('✅ Términos aceptados');
        
        // 3. Obtener o crear dirección
        let direccionId = direccionSeleccionada;
        
        if (!direccionId) {
            console.log('🏠 No hay dirección seleccionada - Validando formulario...');
            
            // Validar formulario de dirección
            if (!validarFormularioDireccion()) {
                console.error('❌ Formulario de dirección inválido');
                mostrarError('Por favor completa todos los campos de dirección obligatorios');
                return;
            }
            
            console.log('✅ Formulario válido - Guardando dirección...');
            
            // Guardar dirección
            btnFinalizar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando dirección...';
            btnFinalizar.disabled = true;
            
            try {
                direccionId = await guardarNuevaDireccion();
                console.log(`✅ Dirección guardada con ID: ${direccionId}`);
            } catch (error) {
                console.error('❌ Error al guardar dirección:', error);
                throw new Error('Error al guardar la dirección: ' + error.message);
            }
        } else {
            console.log(`✅ Usando dirección guardada ID: ${direccionId}`);
        }
        
        // 4. Validar método de pago
        const metodoPagoRadio = document.querySelector('input[name="metodo-pago"]:checked');
        if (!metodoPagoRadio) {
            console.error('❌ Método de pago no seleccionado');
            mostrarError('Por favor selecciona un método de pago');
            return;
        }
        
        const metodoPago = metodoPagoRadio.value;
        console.log(`✅ Método de pago: ${metodoPago}`);
        
        const notas = document.getElementById('notas')?.value || '';
        
        // 5. Crear la orden
        btnFinalizar.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando compra...';
        btnFinalizar.disabled = true;
        
        const ordenData = {
            sucursal_id: 1,
            direccion_envio_id: direccionId,
            metodo_pago: metodoPago,
            notas: notas
        };
        
        console.log('📤 Enviando orden:', ordenData);
        
        const response = await fetch('/api/orden/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ordenData)
        });
        
        console.log('📡 Respuesta orden:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (data.success) {
            console.log('✅ Orden creada exitosamente:', data.numero_orden);
            // Éxito - mostrar confirmación
            mostrarConfirmacion(data.numero_orden);
        } else {
            throw new Error(data.error || 'Error al procesar la compra');
        }
        
    } catch (error) {
        console.error('❌ Error en procesarCompra:', error);
        mostrarError(error.message || 'Error al procesar la compra. Por favor intenta de nuevo.');
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = originalText;
    }
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
    // Remover notificación existente si hay
    const existente = document.querySelector('.notification-error');
    if (existente) existente.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
        <i class="bi bi-exclamation-circle-fill" style="font-size: 1.25rem;"></i>
        <span>${mensaje}</span>
    `;
    
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
        display: flex;
        align-items: center;
        gap: 12px;
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
    
    if (numeroOrdenSpan) numeroOrdenSpan.textContent = numeroOrden;
    if (modal) modal.style.display = 'flex';
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
        window.location.href = '/mis-pedidos';
    }, 3000);
}

// Agregar estilos de animación
if (!document.getElementById('checkout-animations')) {
    const style = document.createElement('style');
    style.id = 'checkout-animations';
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
        
        .cart-item {
            display: flex;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .cart-item:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
}

// Exponer funciones globalmente para uso en HTML
window.mostrarFormularioDireccion = mostrarFormularioDireccion;
window.procesarCompra = procesarCompra;

console.log('✅ Checkout.js cargado correctamente');