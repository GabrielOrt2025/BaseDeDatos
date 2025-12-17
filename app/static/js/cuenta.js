// app/static/js/cuenta.js - VERSIÓN FLEXIBLE CON AMBAS RUTAS

document.addEventListener("DOMContentLoaded", function () {
  // ----- NAVEGACIÓN LATERAL -----
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".seccion");

  function cambiarSeccion(targetId) {
    if (!targetId) return;

    menuItems.forEach((m) => m.classList.remove("active"));
    const itemActivo = document.querySelector(`.menu-item[data-section="${targetId}"]`);
    if (itemActivo) itemActivo.classList.add("active");

    sections.forEach((sec) => {
      if (sec.id === targetId) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    window.history.pushState({}, '', `#${targetId}`);
  }

  menuItems.forEach((item) => {
    if (item.classList.contains("logout")) return;

    item.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = item.getAttribute("data-section");
      cambiarSeccion(targetId);
    });
  });

  // Manejar navegación con hash
  function manejarHashInicial() {
    const hash = window.location.hash.substring(1);
    
    if (hash) {
      const [seccion, queryString] = hash.split('?');
      
      if (seccion) {
        cambiarSeccion(seccion);
        
        if (queryString) {
          const params = new URLSearchParams(queryString);
          const ordenId = params.get('orden');
          
          if (ordenId && seccion === 'pedidos') {
            setTimeout(() => {
              const pedidoCard = document.querySelector(`[data-orden-id="${ordenId}"]`);
              if (pedidoCard) {
                pedidoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                pedidoCard.style.animation = 'highlight 2s ease-in-out';
              }
            }, 500);
          }
        }
      }
    }
  }

  manejarHashInicial();
  window.addEventListener('hashchange', manejarHashInicial);

  // ----- CERRAR SESIÓN -----
  const logoutLink = document.querySelector(".menu-item.logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      if (confirm("¿Seguro que quieres cerrar sesión?")) {
        window.location.href = "/logout";
      }
    });
  }

  // Cargar pedidos automáticamente
  cargarPedidosUsuario();
});

// ----- CARGAR PEDIDOS -----
async function cargarPedidosUsuario() {
  const container = document.querySelector('#pedidos .pedidos-lista');
  if (!container) return;
  
  // Mostrar cargando
  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div class="spinner" style="border: 4px solid #f3f4f6; border-top: 4px solid #b361bb; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      <p style="margin-top: 15px; color: #999;">Cargando pedidos...</p>
    </div>
  `;
  
  try {
    // ✅ Intenta primero /api/mis-pedidos, luego /api/pedidos como fallback
    let response = await fetch('/api/mis-pedidos');
    
    if (!response.ok && response.status === 404) {
      // Si no existe /api/mis-pedidos, intenta /api/pedidos
      response = await fetch('/api/pedidos');
    }
    
    const data = await response.json();
    
    if (data.success && data.ordenes && data.ordenes.length > 0) {
      renderizarPedidos(data.ordenes);
    } else {
      mostrarMensajeSinPedidos();
    }
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    mostrarErrorPedidos();
  }
}

function renderizarPedidos(ordenes) {
  const container = document.querySelector('#pedidos .pedidos-lista');
  if (!container) return;
  
  container.innerHTML = ordenes.map(orden => {
    const estadoClass = orden.estado ? orden.estado.toLowerCase().replace(/ /g, '-') : 'pendiente';
    const fecha = formatearFecha(orden.feha_orden || orden.fecha_orden);
    
    return `
      <div class="pedido-card" data-orden-id="${orden.id_orden}">
        <div class="pedido-header">
          <div>
            <span class="pedido-numero">#${orden.numero_orden}</span>
            <span class="pedido-fecha">${fecha}</span>
          </div>
          <span class="badge-estado ${estadoClass}">${orden.estado || 'Pendiente'}</span>
        </div>
        <div class="pedido-footer">
          <span class="pedido-total">Total: ₡${formatearPrecio(orden.total)}</span>
          <button class="btn-secundario" onclick="verDetallePedido(${orden.id_orden})">
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function mostrarMensajeSinPedidos() {
  const container = document.querySelector('#pedidos .pedidos-lista');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: #999;">
      <i class="bi bi-bag-x" style="font-size: 4rem; margin-bottom: 20px; display: block; color: #ddd;"></i>
      <h3 style="margin-bottom: 10px; color: #666;">No tienes pedidos aún</h3>
      <p style="margin-bottom: 20px;">Cuando realices una compra, aparecerá aquí</p>
      <a href="/tienda" class="btn-primario" style="display: inline-block; text-decoration: none;">
        Ir a la tienda
      </a>
    </div>
  `;
}

function mostrarErrorPedidos() {
  const container = document.querySelector('#pedidos .pedidos-lista');
  if (!container) return;
  
  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #ef4444;">
      <i class="bi bi-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
      <p style="margin-bottom: 15px;">Error al cargar los pedidos</p>
      <button class="btn-secundario" onclick="cargarPedidosUsuario()">
        Reintentar
      </button>
    </div>
  `;
}

async function verDetallePedido(ordenId) {
  try {
    // ✅ Intenta primero /api/orden/{id}, luego /api/pedido/{id}/detalle
    let response = await fetch(`/api/orden/${ordenId}`);
    
    if (!response.ok && response.status === 404) {
      response = await fetch(`/api/pedido/${ordenId}/detalle`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      mostrarModalDetallePedido(ordenId, data.items, data.factura);
    } else {
      alert('Error al cargar el detalle del pedido: ' + (data.error || 'Desconocido'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al cargar el detalle del pedido');
  }
}

function mostrarModalDetallePedido(ordenId, items, factura) {
  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'modal-detalle-pedido';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 30px; animation: slideUp 0.3s ease;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
        <h2 style="margin: 0; color: #b361bb;">Detalle del Pedido</h2>
        <button onclick="this.closest('.modal-detalle-pedido').remove()" style="background: none; border: none; font-size: 32px; cursor: pointer; color: #999; line-height: 1;">×</button>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="margin-bottom: 15px; font-size: 1.1rem; color: #666;">Productos</h3>
        ${items && items.length > 0 ? items.map(item => `
          <div style="display: flex; gap: 15px; padding: 15px; border-bottom: 1px solid #eee; align-items: center;">
            <img src="${item.imagen_url ? '/static/' + item.imagen_url : '/static/img/placeholder.png'}" 
                 alt="${item.producto_nombre}"
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                 onerror="this.src='/static/img/placeholder.png'">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 5px 0; font-size: 0.95rem;">${item.producto_nombre}</h4>
              <p style="margin: 0; color: #666; font-size: 0.85rem;">Cantidad: ${item.cantidad} × ₡${formatearPrecio(item.precio_unitario)}</p>
            </div>
            <div style="font-weight: 600;">₡${formatearPrecio(item.subtotal)}</div>
          </div>
        `).join('') : '<p style="text-align: center; color: #999; padding: 20px;">No hay items</p>'}
      </div>
      
      ${factura ? `
        <div style="background: linear-gradient(135deg, #f7fafc 0%, #f0ebf5 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #b361bb;">
          <h3 style="margin: 0 0 15px 0; font-size: 1.1rem; color: #666;">Factura</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Número de Factura:</span>
            <strong>${factura.numero_factura}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Total:</span>
            <strong style="color: #b361bb; font-size: 1.2rem;">₡${formatearPrecio(factura.total)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Estado:</span>
            <strong>${factura.estado}</strong>
          </div>
        </div>
      ` : ''}
      
      <button onclick="this.closest('.modal-detalle-pedido').remove()" 
              class="btn-primario" 
              style="width: 100%; margin-top: 20px; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Cerrar
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Cerrar con ESC
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}

// ----- EDITAR PERFIL -----
let modoEdicionPerfil = false;

window.editarPerfil = function () {
  const btn = document.querySelector(".btn-editar");
  const campos = document.querySelectorAll("#perfil .info-item p");

  if (!btn || campos.length === 0) return;

  if (!modoEdicionPerfil) {
    campos.forEach((p) => {
      p.setAttribute("contenteditable", "true");
      p.classList.add("editable");
      p.style.backgroundColor = "#f9f9f9";
      p.style.padding = "8px";
      p.style.borderRadius = "4px";
      p.style.border = "1px solid #b361bb";
    });
    btn.innerHTML = '<i class="bi bi-check"></i> Guardar';
    modoEdicionPerfil = true;
  } else {
    campos.forEach((p) => {
      p.setAttribute("contenteditable", "false");
      p.classList.remove("editable");
      p.style.backgroundColor = "";
      p.style.padding = "";
      p.style.border = "";
    });
    btn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
    alert("Cambios guardados (conectar al backend)");
    modoEdicionPerfil = false;
  }
};

// ----- OTRAS FUNCIONES -----
window.agregarDireccion = function () {
  alert("Funcionalidad de agregar dirección (por implementar)");
};

window.editarDireccion = function (id) {
  alert("Editar dirección: " + id);
};

window.eliminarDireccion = function (id) {
  if (confirm("¿Eliminar dirección " + id + "?")) {
    const card = document.querySelector(`.direccion-card[data-id="${id}"]`);
    if (card) card.remove();
  }
};

window.hacerPrincipal = function (id) {
  alert("Hacer principal: " + id);
};

window.quitarFavorito = function (id) {
  const card = document.querySelector(`.favorito-card[data-id="${id}"]`);
  if (card) {
    card.remove();
    alert("Favorito eliminado");
  }
};

window.agregarAlCarrito = function (id) {
  alert("Producto " + id + " agregado al carrito");
};

window.cambiarPassword = function (event) {
  event.preventDefault();
  const form = event.target;
  const actual = form.password_actual.value.trim();
  const nueva = form.password_nueva.value.trim();
  const confirmar = form.password_confirmar.value.trim();

  if (!actual || !nueva || !confirmar) {
    alert("Completa todos los campos");
    return false;
  }
  if (nueva.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres");
    return false;
  }
  if (nueva !== confirmar) {
    alert("Las contraseñas no coinciden");
    return false;
  }

  alert("Contraseña actualizada (conectar backend)");
  form.reset();
  return false;
};

// ----- UTILIDADES -----
function formatearPrecio(precio) {
  if (!precio && precio !== 0) return '0';
  return new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
}

function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  try {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return fecha;
  }
}

// CSS Animations
const style = document.createElement('style');
style.textContent = `
  @keyframes highlight {
    0%, 100% { background: white; }
    50% { background: #f0ebf5; }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(style);