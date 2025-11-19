// JavaScript actualizado para trabajar con Flask
let cart = [];

// Cargar carrito desde la API de Flask
async function loadCartFromAPI() {
    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            cart = await response.json();
        } else {
            console.error('Error al cargar el carrito');
            cart = [];
        }
    } catch (error) {
        console.error('Error:', error);
        cart = [];
    }
    updateOrderSummary();
}

// Procesar pedido con Flask
async function processOrder() {
    if (!validateForm()) {
        return;
    }
    
    const orderData = {
        shipping: getShippingInfo(),
        payment: getPaymentInfo(),
        cart: cart
    };
    
    const completeButton = document.getElementById('complete-order');
    completeButton.textContent = 'Procesando...';
    completeButton.disabled = true;
    
    try {
        const response = await fetch('/api/process-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Mostrar modal de éxito
            document.getElementById('confirmation-modal').style.display = 'block';
            document.getElementById('order-id').textContent = result.order_id;
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        alert('Error al procesar el pedido: ' + error.message);
    } finally {
        completeButton.textContent = 'Completar Pedido';
        completeButton.disabled = false;
    }
}

// Obtener información de envío
function getShippingInfo() {
    return {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        direccion: document.getElementById('direccion').value,
        ciudad: document.getElementById('ciudad').value,
        codigo_postal: document.getElementById('codigo-postal').value,
        pais: document.getElementById('pais').value
    };
}

// Obtener información de pago
function getPaymentInfo() {
    return {
        card_number: document.getElementById('tarjeta').value,
        expiry_date: document.getElementById('vencimiento').value,
        cvv: document.getElementById('cvv').value,
        card_holder: document.getElementById('titular').value
    };
}

// Resto del código JavaScript permanece igual...
function updateOrderSummary() {
    const cartSummary = document.getElementById('cart-summary');
    cartSummary.innerHTML = '';
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>Talla: ${item.size} | Color: ${item.color}</p>
                <p>Cantidad: ${item.quantity}</p>
            </div>
            <div class="item-price">$${itemTotal.toFixed(2)}</div>
        `;
        
        cartSummary.appendChild(itemElement);
    });
    
    const shipping = 5.00;
    const taxes = subtotal * 0.16;
    const total = subtotal + shipping + taxes;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('taxes').textContent = `$${taxes.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Inicializar checkout
async function initCheckout() {
    await loadCartFromAPI();
    
    document.getElementById('complete-order').addEventListener('click', processOrder);
    
    // Eventos del modal...
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('confirmation-modal').style.display = 'none';
    });
    
    document.getElementById('continue-shopping').addEventListener('click', function() {
        window.location.href = '/';
    });
}

document.addEventListener('DOMContentLoaded', initCheckout);