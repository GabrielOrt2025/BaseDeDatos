document.addEventListener('DOMContentLoaded', function () {
    const searchToggle = document.getElementById('search-toggle');
    const searchContainer = document.getElementById('search-container');
    const nav = document.querySelector('header nav');
    const searchInput = document.getElementById('search-input');
    const searchClose = document.getElementById('search-close');

    if (!searchToggle || !searchContainer) return;

    function openSearch() {
        // Hide nav, show search
        if (nav) nav.style.display = 'none';
        searchContainer.style.display = 'flex';
        searchContainer.classList.add('active');
        searchContainer.setAttribute('aria-hidden', 'false');
        if (searchInput) searchInput.focus();
    }

    function closeSearch() {
        if (nav) nav.style.display = '';
        searchContainer.style.display = 'none';
        searchContainer.classList.remove('active');
        searchContainer.setAttribute('aria-hidden', 'true');
        if (searchInput) searchInput.value = '';
    }

    searchToggle.addEventListener('click', function (e) {
        const visible = searchContainer.classList.contains('active');
        if (visible) closeSearch(); else openSearch();
    });

    // Close when clicking the close button
    if (searchClose) {
        searchClose.addEventListener('click', function () {
            closeSearch();
        });
    }

    // Close on ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeSearch();
        }
    });

    // Close when clicking outside the search container
    document.addEventListener('click', function (e) {
        const target = e.target;
        if (!searchContainer.contains(target) && !searchToggle.contains(target) && searchContainer.classList.contains('active')) {
            closeSearch();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const userIcon = document.getElementById('user-icon');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', function(e) {
            e.preventDefault();
            userDropdown.classList.toggle('active');
        });
        
        // Cerrar al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }
});