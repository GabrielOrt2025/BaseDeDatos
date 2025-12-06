// Admin Panel JS

// ---- PRODUCTOS ----
let productos = [];

function agregarProducto() {
  const nombre = document.getElementById('prod_nombre').value;
  const precio = document.getElementById('prod_precio').value;
  const categoria = document.getElementById('prod_categoria').value;

  if (!nombre || !precio) return alert('Debe llenar todos los campos');

  productos.push({ nombre, precio, categoria });
  mostrarProductos();
}

function mostrarProductos() {
  const lista = document.getElementById('lista_productos');
  lista.innerHTML = "";

  productos.forEach((p, index) => {
    lista.innerHTML += `
      <div class="item">
        <strong>${p.nombre}</strong> - $${p.precio} - ${p.categoria}
        <button onclick="eliminarProducto(${index})">Eliminar</button>
      </div>
    `;
  });
}

function eliminarProducto(i) {
  productos.splice(i, 1);
  mostrarProductos();
}

// ---- CATEGORIAS ----
let categorias = [];

function agregarCategoria() {
  const nombre = document.getElementById('cat_nombre').value;
  if (!nombre) return alert('Debe ingresar una categoria');

  categorias.push(nombre);
  mostrarCategorias();
}

function mostrarCategorias() {
  const lista = document.getElementById('lista_categorias');
  lista.innerHTML = "";

  categorias.forEach((c, i) => {
    lista.innerHTML += `
      <div class="item">
        ${c}
        <button onclick="eliminarCategoria(${i})">Eliminar</button>
      </div>
    `;
  });
}

function eliminarCategoria(i) {
  categorias.splice(i, 1);
  mostrarCategorias();
}

// ---- BODEGAS ----
let bodegas = [];

function agregarBodega() {
  const nombre = document.getElementById('bod_nombre').value;
  if (!nombre) return alert('Debe ingresar una bodega');

  bodegas.push(nombre);
  mostrarBodegas();
}

function mostrarBodegas() {
  const lista = document.getElementById('lista_bodegas');
  lista.innerHTML = "";

  bodegas.forEach((b, i) => {
    lista.innerHTML += `
      <div class="item">
        ${b}
        <button onclick="eliminarBodega(${i})">Eliminar</button>
      </div>
    `;
  });
}

function eliminarBodega(i) {
  bodegas.splice(i, 1);
  mostrarBodegas();
}
