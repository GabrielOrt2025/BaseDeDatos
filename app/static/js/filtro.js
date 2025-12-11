
        
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
            const precioStr = this.getAttribute('data-price');
            const imagen = this.querySelector('.product-img img').src;
            const categoria = this.getAttribute('data-category');
            const stock = this.getAttribute('data-stock') || 'disponible';
            
            const precioNum = parseInt(precioStr);
            const precioFormateado = '₡' + precioNum.toLocaleString('es-CR');
            
            abrirModal(nombre, precioFormateado, imagen, categoria, stock);
        });
    });

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
                            
                            <button class="btn-agregar">
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
        
        modal.querySelector('.modal-nombre').textContent = nombre;
        modal.querySelector('.modal-categoria').textContent = categoria;
        modal.querySelector('.modal-precio').textContent = precio;
        modal.querySelector('.modal-imagen').src = imagen;
        
        // Actualizar disponibilidad basado en stock
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

    //configurar css del modal o sea se conectan
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
        
//este agrega al carrito
        btnAgregar.addEventListener('click', function() {
            const nombre = modal.querySelector('.modal-nombre').textContent;
            const cantidad = inputCantidad.value;
            
            alert('Agregado al carrito:\n' + cantidad + 'x ' + nombre);
            
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
});
    