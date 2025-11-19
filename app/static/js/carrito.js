// Carrito de compras
let cart = [];
let discountPercentage = 0;

// === helper para asegurar imagen ===
function ensureItemImage(item) {
  // base de /static/ que viene desde el template (carrito.html)
  const base =
    (window.STATIC_URL_PREFIX || "/static/").replace(/\/+$/, "") + "/";

  if (!item.image || item.image === "") {
    // usa tienda1..tienda6 segun el id (puedes ajustar)
    const idx = ((item.id - 1) % 6) + 1; // 1..6
    item.image = `${base}img/tienda${idx}.jpeg`; // cambia a .jpg si tus archivos son .jpg
  } else if (!item.image.startsWith("http") && !item.image.startsWith("/")) {
    // si viene algo como "img/tienda1.jpeg" lo volvemos ruta completa
    item.image = base + item.image.replace(/^\/+/, "");
  }
  return item;
}

// Cargar carrito desde localStorage al iniciar
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  renderCart();
  updateSummary();
});

// Guardar carrito en localStorage
function saveCartToStorage() {
  localStorage.setItem("pijamasCart", JSON.stringify(cart));
}

// Cargar carrito desde localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem("pijamasCart");
  if (savedCart) {
    cart = JSON.parse(savedCart).map(ensureItemImage); // *** asegurar imagen
  } else {
    // Datos de ejemplo si no hay carrito guardado
    cart = [
      {
        id: 1,
        name: "Pijama Satin Elegante",
        size: "M",
        color: "Negro",
        price: 45.0,
        quantity: 2,
        image: "img/tienda1.jpeg",
      },
      {
        id: 2,
        name: "Pijama Algodon Suave",
        size: "L",
        color: "Rosa",
        price: 38.0,
        quantity: 1,
        image: "img/tienda2.jpeg",
      },
      {
        id: 3,
        name: "Conjunto Encaje Deluxe",
        size: "S",
        color: "Blanco",
        price: 52.0,
        quantity: 3,
        image: "img/tienda3.jpeg",
      },
    ].map(ensureItemImage); // *** por si acaso
    saveCartToStorage();
  }
}

// Renderizar items del carrito
function renderCart() {
  const cartItemsContainer = document.getElementById("cartItems");

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <p style="font-size: 1.2rem; margin-bottom: 10px;">🛒 Tu carrito esta vacio</p>
        <p>Agrega productos para comenzar tu compra</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map((rawItem) => {
      const item = ensureItemImage({ ...rawItem }); // *** aseguramos imagen al pintar
      return `
    <div class="cart-item" data-id="${item.id}">
      <div class="product-info">
        <img src="${item.image}" alt="${item.name}" class="product-image">
        <div class="product-details">
          <h4>${item.name}</h4>
          <p>Talla: ${item.size} | Color: ${item.color}</p>
          <button class="remove-btn" onclick="removeItem(${
            item.id
          })" title="Eliminar">🗑️</button>
        </div>
      </div>
      <div class="price">$${item.price.toFixed(2)}</div>
      <div class="quantity-controls">
        <button class="qty-btn" onclick="decreaseQuantity(${
          item.id
        })">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="increaseQuantity(${
          item.id
        })">+</button>
      </div>
      <div class="subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `;
    })
    .join("");
}

// Aumentar cantidad
function increaseQuantity(id) {
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.quantity++;
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification("Cantidad actualizada");
  }
}

// Disminuir cantidad
function decreaseQuantity(id) {
  const item = cart.find((item) => item.id === id);
  if (item && item.quantity > 1) {
    item.quantity--;
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification("Cantidad actualizada");
  }
}

// Eliminar item
function removeItem(id) {
  if (confirm("Estas seguro de que quieres eliminar este producto?")) {
    cart = cart.filter((item) => item.id !== id);
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification("Producto eliminado del carrito", "error");
  }
}

// Limpiar carrito
function clearCart() {
  if (cart.length === 0) {
    showNotification("El carrito ya esta vacio", "warning");
    return;
  }

  if (confirm("Estas seguro de que quieres vaciar todo el carrito?")) {
    cart = [];
    discountPercentage = 0;
    document.getElementById("couponInput").value = "";
    document.getElementById("discountRow").style.display = "none";
    saveCartToStorage();
    renderCart();
    updateSummary();
    showNotification("Carrito vaciado", "error");
  }
}

// Calcular subtotal
function calculateSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Calcular envio
function calculateShipping(subtotal) {
  return subtotal >= 50 ? 0 : 5.0;
}

// Calcular impuestos
function calculateTaxes(subtotal) {
  return subtotal * 0.13; // 13% IVA
}

// Aplicar cupon
function applyCoupon() {
  const couponInput = document.getElementById("couponInput");
  const couponCode = couponInput.value.trim().toUpperCase();

  if (!couponCode) {
    showNotification("Por favor ingresa un codigo de cupon", "warning");
    return;
  }

  // Codigos de cupon validos
  const validCoupons = {
    PIJAMAS10: 10,
    PIJAMAS20: 20,
    PIJAMAS25: 25,
    WELCOME15: 15,
  };

  if (validCoupons[couponCode]) {
    discountPercentage = validCoupons[couponCode];
    document.getElementById("discountRow").style.display = "flex";
    updateSummary();
    showNotification(
      `Cupon aplicado! ${discountPercentage}% de descuento`,
      "success"
    );
    couponInput.value = "";
  } else {
    showNotification("Cupon invalido", "error");
  }
}

// Actualizar resumen
function updateSummary() {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateSubtotal();
  const shipping = calculateShipping(subtotal);
  const taxes = calculateTaxes(subtotal);
  const discount = (subtotal * discountPercentage) / 100;
  const total = subtotal + shipping + taxes - discount;

  document.getElementById("itemCount").textContent = itemCount;
  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("shipping").textContent = `$${shipping.toFixed(2)}`;
  document.getElementById("taxes").textContent = `$${taxes.toFixed(2)}`;
  document.getElementById("discount").textContent = `-$${discount.toFixed(2)}`;
  document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

// Proceder al checkout
function checkout() {
  if (cart.length === 0) {
    showNotification("Tu carrito esta vacio", "warning");
    return;
  }

  const total = document.getElementById("total").textContent;
  if (confirm(`Proceder al pago de ${total}?`)) {
    showNotification("Redirigiendo al checkout...", "success");
    setTimeout(() => {
      window.location.href = "/checkout";
    }, 1500);
  }
}

// Suscribirse al newsletter
function subscribe() {
  const emailInput = document.getElementById("emailInput");
  const email = emailInput.value.trim();

  if (!email) {
    showNotification("Por favor ingresa tu correo electronico", "warning");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showNotification("Por favor ingresa un correo valido", "error");
    return;
  }

  showNotification(
    "Gracias por suscribirte! Recibiras 25% de descuento",
    "success"
  );
  emailInput.value = "";
}

// Sistema de notificaciones
function showNotification(message, type = "info") {
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

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

  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#b794c9",
  };

  notification.style.backgroundColor = colors[type] || colors.info;

  document.body.appendChild(notification);

  const style = document.createElement("style");
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
  `;
  document.head.appendChild(style);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in";
    notification.style.cssText += "animation: slideOut 0.3s ease-in;";

    const styleOut = document.createElement("style");
    styleOut.textContent = `
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
    document.head.appendChild(styleOut);

    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Permitir aplicar cupon con Enter
document.addEventListener("DOMContentLoaded", () => {
  const couponInput = document.getElementById("couponInput");
  if (couponInput) {
    couponInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyCoupon();
      }
    });
  }

  const emailInput = document.getElementById("emailInput");
  if (emailInput) {
    emailInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        subscribe();
      }
    });
  }
});
