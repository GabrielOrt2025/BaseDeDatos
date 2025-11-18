
        
// Para filtrar el producto
//estos para modal y filtros pero filtros no sirve

document.addEventListener('DOMContentLoaded', function() {
    
    //variables ah
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const navTabs = document.querySelectorAll('.nav-tab');
    const filterOptions = document.querySelectorAll('.filter-option');
    const productCards = document.querySelectorAll('.product-card');
    const productCount = document.getElementById('productCount');

    //abre 
    filterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        filterDropdown.classList.toggle('show');
    });

    // este cierra
    document.addEventListener('click', function(e) {
        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('show');
        }
    });


    //filtrar categoria pero no sirve
    navTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {

            navTabs.forEach(function(t) {
                t.classList.remove('active');
            });
        
            this.classList.add('active');
            
            const categoria = this.getAttribute('data-filter');
            
            let contador = 0;
            productCards.forEach(function(card) {
                const cardCategoria = card.getAttribute('data-category');
                
                if (categoria === 'todos' || cardCategoria === categoria) {
                    card.style.display = 'block';
                    contador++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            productCount.textContent = contador + ' productos';
        });
    });

  
    // ordena productos
    filterOptions.forEach(function(option) {
        option.addEventListener('click', function() {
            const tipo = this.getAttribute('data-sort');
            const container = document.querySelector('.products-grid');
            const cards = Array.from(productCards);
            
            cards.sort(function(a, b) {
                const precioA = parseInt(a.getAttribute('data-price'));
                const precioB = parseInt(b.getAttribute('data-price'));
                const nombreA = a.getAttribute('data-name');
                const nombreB = b.getAttribute('data-name');
                
                if (tipo === 'precio-asc') {
                    return precioA - precioB;
                } else if (tipo === 'precio-desc') {
                    return precioB - precioA;
                } else if (tipo === 'nombre') {
                    return nombreA.localeCompare(nombreB);
                }
            });
            
            cards.forEach(function(card) {
                container.appendChild(card);
            });
            
            filterDropdown.classList.remove('show');
        });
    });

    //esto ya es modal o sea la ventana emergente cuando se selecciona un producto
    productCards.forEach(function(card) {
        card.addEventListener('click', function() {
            const nombre = this.getAttribute('data-name');
            const precio = this.getAttribute('data-price');
            const imagen = this.querySelector('.product-img img').src;
            
            abrirModal(nombre, precio, imagen);
        });
    });

    function abrirModal(nombre, precio, imagen) {

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
                            <h2 class="modal-nombre"></h2>
                            <p class="modal-precio"></p>
                            
                            <div class="selector-color">
                                <p>Color:</p>
                                <div class="colores">
                                    <span class="color" style="background: #000"></span>
                                    <span class="color" style="background: #ebd63aff"></span>
                                    <span class="color" style="background: #e31f1fff"></span>
                                    <span class="color" style="background: #5e5e5eff"></span>
                                    <span class="color" style="background: #044173ff"></span>
                                </div>
                            </div>
                            
                            <div class="selector-talla">
                                <p>Talla:</p>
                                <div class="tallas">
                                    <button class="talla">S</button>
                                    <button class="talla activo">M</button>
                                    <button class="talla">L</button>
                                    <button class="talla">XL</button>
                                </div>
                            </div>
                            
                            <div class="selector-cantidad">
                                <div class="controles-cantidad">
                                    <button class="btn-cantidad menos">-</button>
                                    <input type="number" class="input-cantidad" value="1" min="1">
                                    <button class="btn-cantidad mas">+</button>
                                </div>
                            </div>
                            
                            <button class="btn-agregar">
                                AGREGAR AL CARRITO
                            </button>
                            
                           
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            configurarEventosModal(modal);
        }
        
        modal.querySelector('.modal-nombre').textContent = nombre;
        modal.querySelector('.modal-precio').textContent = '₡' + parseInt(precio).toLocaleString('es-CR');
        modal.querySelector('.modal-imagen').src = imagen;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    //configurar css del modal o sea se conectan
    function configurarEventosModal(modal) {
        const btnCerrar = modal.querySelector('.modal-cerrar');
        const fondo = modal.querySelector('.modal-fondo');
        const btnMenos = modal.querySelector('.menos');
        const btnMas = modal.querySelector('.mas');
        const inputCantidad = modal.querySelector('.input-cantidad');
        const btnAgregar = modal.querySelector('.btn-agregar');
        const colores = modal.querySelectorAll('.color');
        const tallas = modal.querySelectorAll('.talla');
        
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
        
        colores.forEach(function(color) {
            color.addEventListener('click', function() {
                colores.forEach(function(c) {
                    c.classList.remove('activo');
                });
                this.classList.add('activo');
            });
        });
        
        tallas.forEach(function(talla) {
            talla.addEventListener('click', function() {
                tallas.forEach(function(t) {
                    t.classList.remove('activo');
                });
                this.classList.add('activo');
            });
        });
        
//este agrega al carrito
        btnAgregar.addEventListener('click', function() {
            const nombre = modal.querySelector('.modal-nombre').textContent;
            const cantidad = inputCantidad.value;
            const talla = modal.querySelector('.talla.activo').textContent;
            
            alert('Agregado al carrito:\n' + cantidad + 'x ' + nombre + ' (Talla: ' + talla + ')');
            
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});
    