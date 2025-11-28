const API_URL = 'http://127.0.0.1:5000/api/obtenerDatos';

let imageMap = {};

// Obtener datos de la API
fetch(API_URL)
    .then(response => response.json())
    .then(data => {
        // Construir el mapa de imágenes dinámicamente
        
        // Mujeres
        if (data.mujer && Array.isArray(data.mujer)) {
            data.mujer.forEach((item, index) => {
                imageMap[`mujer-${index + 1}`] = item.url;
            });
        }
        
        // Hombres
        if (data.hombre && Array.isArray(data.hombre)) {
            data.hombre.forEach((item, index) => {
                imageMap[`hombre-${index + 1}`] = item.url;
            });
        }
        
        // Gorros
        if (data.gorro && Array.isArray(data.gorro)) {
            data.gorro.forEach((item, index) => {
                imageMap[`gorro-${index + 1}`] = item.url;
            });
        }
        
        console.log('imageMap construido:', imageMap);
        inicializarImagenes();
    })
    .catch(error => console.error('Error fetching API:', error));

function changeImage(listId, imageId) {
    const list = document.getElementById(listId);
    const imageContainer = document.getElementById(imageId);

    if (!list || !imageContainer) return;

    const items = list.querySelectorAll('li');
    items.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const imageName = this.getAttribute('data-image');
            const imageSrc = imageMap[imageName];
            
            if (imageSrc) {
                const img = imageContainer.querySelector('img');
                if (img) {
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.src = imageSrc;
                        img.alt = this.textContent;
                        img.style.opacity = '1';
                    }, 250);
                }
            }
        });
    });
}

function inicializarImagenes() {
    changeImage('women-list', 'women-image');
    changeImage('mens-list', 'mens-image');
    changeImage('accessories-list', 'accessories-image');
}

