// static/js/cuenta.js

document.addEventListener("DOMContentLoaded", function () {
  // ----- NAVEGACION LATERAL (cambiar secciones) -----
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".seccion");

  menuItems.forEach((item) => {
    // Cerrar sesion se maneja aparte
    if (item.classList.contains("logout")) return;

    item.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = item.getAttribute("data-section");
      if (!targetId) return;

      // marcar item activo
      menuItems.forEach((m) => m.classList.remove("active"));
      item.classList.add("active");

      // mostrar solo la seccion seleccionada
      sections.forEach((sec) => {
        if (sec.id === targetId) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });
    });
  });

  // ----- CERRAR SESION -----
  const logoutLink = document.querySelector(".menu-item.logout");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      const ok = confirm("Seguro que quieres cerrar sesion?");
      if (ok) {
        // cambia esta ruta a tu endpoint real de logout
        window.location.href = "/logout";
      }
    });
  }
});

// ----- EDITAR PERFIL -----
let modoEdicionPerfil = false;

window.editarPerfil = function () {
  const btn = document.querySelector(".btn-editar");
  const campos = document.querySelectorAll("#perfil .info-item p");

  if (!btn || campos.length === 0) return;

  if (!modoEdicionPerfil) {
    // activar modo edicion
    campos.forEach((p) => {
      p.setAttribute("contenteditable", "true");
      p.classList.add("editable");
    });
    btn.innerHTML = '<i class="bi bi-check"></i> Guardar';
    modoEdicionPerfil = true;
  } else {
    // aqui podrias mandar los datos al backend con fetch/ajax
    campos.forEach((p) => {
      p.setAttribute("contenteditable", "false");
      p.classList.remove("editable");
    });
    btn.innerHTML = '<i class="bi bi-pencil"></i> Editar';
    alert("Cambios guardados (ejemplo front, falta conectarlo al backend)");
    modoEdicionPerfil = false;
  }
};

// ----- DIRECCIONES -----
window.agregarDireccion = function () {
  alert("Aqui podrias abrir un modal o redirigir a un formulario para agregar direccion.");
};

window.editarDireccion = function (id) {
  alert("Editar direccion con id: " + id);
};

window.eliminarDireccion = function (id) {
  const confirmar = confirm("Seguro que deseas eliminar la direccion " + id + "?");
  if (!confirmar) return;

  // Si mas adelante agregas data-id a las tarjetas:
  // <div class="direccion-card" data-id="1">
  const card = document.querySelector('.direccion-card[data-id="' + id + '"]');
  if (card) {
    card.remove();
  } else {
    alert("Direccion eliminada (simulado, agrega data-id en el HTML para borrar del DOM).");
  }
};

window.hacerPrincipal = function (id) {
  alert("Hacer principal la direccion " + id);
  // Aqui podrias mover la tarjeta o marcarla visualmente como principal
};

// ----- FAVORITOS -----
window.quitarFavorito = function (id) {
  const card = document.querySelector('.favorito-card[data-id="' + id + '"]');
  if (card) {
    card.remove();
    alert("Favorito eliminado (id " + id + ")");
  } else {
    alert("No se encontro el favorito con id " + id);
  }
};

window.agregarAlCarrito = function (id) {
  // Aqui podrias llamar a /carrito con fetch
  alert("Producto " + id + " agregado al carrito (simulado).");
};

// ----- SEGURIDAD: CAMBIAR PASSWORD -----
window.cambiarPassword = function (event) {
  event.preventDefault();

  const form = event.target;
  const actual = form.password_actual.value.trim();
  const nueva = form.password_nueva.value.trim();
  const confirmar = form.password_confirmar.value.trim();

  if (!actual || !nueva || !confirmar) {
    alert("Por favor completa todos los campos.");
    return false;
  }

  if (nueva.length < 6) {
    alert("La nueva contrasena debe tener al menos 6 caracteres.");
    return false;
  }

  if (nueva !== confirmar) {
    alert("La confirmacion de contrasena no coincide.");
    return false;
  }

  // Aqui deberias hacer un fetch POST al backend para cambiar la contrasena
  alert("Contrasena actualizada (simulado, falta conectar con el backend).");
  form.reset();
  return false;
};

// ----- SEGURIDAD: 2FA -----
window.activar2FA = function () {
  alert("Aqui podrias mostrar un QR o pasos para activar 2FA.");
};
