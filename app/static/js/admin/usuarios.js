// static/js/admin/usuarios.js - CORREGIDO

let usuariosData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let usuarioActual = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarios();
    cargarRoles();
    actualizarEstadisticas();
});

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios-con-roles');
        const data = await response.json();
        
        if (data.success) {
            usuariosData = data.usuarios || [];
            filteredData = [...usuariosData];
            renderizarUsuarios();
            actualizarEstadisticas();
        } else {
            mostrarError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Preparar cambio de estado
function prepararCambioEstado(id, nombre, estadoActual) {
    const nuevoEstado = estadoActual === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    document.getElementById('confirmar-mensaje').innerHTML = 
        `¿Estás seguro de que deseas <strong>${accion}</strong> al usuario <strong>${nombre}</strong>?`;
    
    // Guardar en variables globales para usar en confirmarCambioEstado
    window.usuarioIdPendiente = id;
    window.nuevoEstadoPendiente = nuevoEstado;
    
    document.getElementById('modal-confirmar-estado').classList.add('active');
}

// Confirmar cambio de estado
async function confirmarCambioEstado() {
    if (window.usuarioIdPendiente === null || window.usuarioIdPendiente === undefined) return;

    try {
        const response = await fetch('/api/usuarios/cambiar-estado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuarioId: window.usuarioIdPendiente,
                activo: window.nuevoEstadoPendiente === 1
            })
        });

        const data = await response.json();

        if (data.success) {
            cerrarModal('modal-confirmar-estado');
            cargarUsuarios();
        } else {
            mostrarError(data.error || 'Error al actualizar el estado');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión con el servidor');
    } finally {
        window.usuarioIdPendiente = null;
        window.nuevoEstadoPendiente = null;
    }
}

// Renderizar usuarios
function renderizarUsuarios() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);
    
    const vistaActual = document.querySelector('.toggle-btn.active')?.dataset.view || 'tabla';
    
    if (vistaActual === 'tabla') {
        renderizarTabla(pageData);
    } else {
        renderizarTarjetas(pageData);
    }
    
    actualizarPaginacion();
}

function renderizarTabla(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="bi bi-people"></i>
                        <p>No se encontraron usuarios</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar">
                        ${usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-details">
                        <h4>${usuario.nombre}</h4>
                    </div>
                </div>
            </td>
            <td>${usuario.email}</td>
            <td>
                <div class="role-pills">
                    ${usuario.roles && usuario.roles.length > 0 
                        ? usuario.roles.map(rol => `<span class="role-pill">${rol}</span>`).join('')
                        : '<span style="color: #9ca3af;">Sin roles</span>'}
                </div>
            </td>
            <td>${formatearFecha(usuario.fecha_creacion)}</td>
            <td>
                <span class="badge ${usuario.activo === 1 ? 'activo' : 'inactivo'}">
                    ${usuario.activo === 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view" onclick="verDetallesUsuario(${usuario.id})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="mostrarModalEditarUsuario(${usuario.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon toggle" 
                            onclick="prepararCambioEstado(${usuario.id}, '${usuario.nombre}', ${usuario.activo})" 
                            title="${usuario.activo === 1 ? 'Desactivar' : 'Activar'}">
                        <i class="bi bi-power" style="color: ${usuario.activo === 1 ? '#ef4444' : '#10b981'};"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderizarTarjetas(usuarios) {
    const container = document.getElementById('users-grid');
    
    if (usuarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <p>No se encontraron usuarios</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = usuarios.map(usuario => `
        <div class="user-card" onclick="verDetallesUsuario(${usuario.id})">
            <div class="user-card-avatar">
                ${usuario.nombre.charAt(0).toUpperCase()}
            </div>
            <h3>${usuario.nombre}</h3>
            <p class="email">${usuario.email}</p>
            <span class="badge ${usuario.activo === 1 ? 'activo' : 'inactivo'}">
                ${usuario.activo === 1 ? 'Activo' : 'Inactivo'}
            </span>
            <div class="user-card-info">
                <div class="info-item">
                    <span class="label">Roles</span>
                    <span class="value">${usuario.roles ? usuario.roles.length : 0}</span>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); mostrarModalEditarUsuario(${usuario.id})">
                    <i class="bi bi-pencil"></i>
                    Editar
                </button>
            </div>
        </div>
    `).join('');
}

// Ver detalles de usuario
async function verDetallesUsuario(usuarioId) {
    try {
        const response = await fetch(`/api/usuarios/${usuarioId}/detalles`);
        const data = await response.json();
        
        if (data.success) {
            const usuario = data.usuario;
            usuarioActual = usuario;
            
            document.getElementById('detalle-nombre').textContent = usuario.nombre;
            document.getElementById('detalle-email').textContent = usuario.email;
            document.getElementById('detalle-fecha').textContent = formatearFecha(usuario.creado);
            document.getElementById('detalle-estado').textContent = usuario.activo === 1 ? 'Activo' : 'Inactivo';
            document.getElementById('detalle-estado').className = `badge ${usuario.activo === 1 ? 'activo' : 'inactivo'}`;
            
            // Cargar roles
            cargarRolesTab(usuario.roles || []);
            
            document.getElementById('modal-detalles-usuario').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar detalles');
    }
}

function cargarRolesTab(roles) {
    const container = document.getElementById('detalle-roles-lista');
    
    if (roles.length === 0) {
        container.innerHTML = `
            <div class="info-message">
                <i class="bi bi-info-circle"></i>
                Este usuario no tiene roles asignados
            </div>
        `;
        return;
    }
    
    container.innerHTML = roles.map(rol => `
        <div class="role-chip">
            <i class="bi bi-shield-check"></i>
            <span>${rol}</span>
        </div>
    `).join('');
}

function cambiarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

// Filtros
document.getElementById('search-input')?.addEventListener('input', aplicarFiltros);
document.getElementById('filter-estado')?.addEventListener('change', aplicarFiltros);
document.getElementById('filter-rol')?.addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const estado = document.getElementById('filter-estado')?.value;
    const rol = document.getElementById('filter-rol')?.value;
    
    filteredData = usuariosData.filter(usuario => {
        const matchSearch = usuario.nombre.toLowerCase().includes(searchTerm) || 
                          usuario.email.toLowerCase().includes(searchTerm);
        const matchEstado = estado === '' || usuario.activo == estado;
        const matchRol = !rol || (usuario.roles && usuario.roles.includes(rol));
        
        return matchSearch && matchEstado && matchRol;
    });
    
    currentPage = 1;
    renderizarUsuarios();
}

function limpiarFiltros() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-estado').value = '';
    document.getElementById('filter-rol').value = '';
    aplicarFiltros();
}

// Cambiar vista
function cambiarVista(vista) {
    const tableView = document.getElementById('table-view');
    const cardView = document.getElementById('card-view');
    const buttons = document.querySelectorAll('.toggle-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${vista}"]`)?.classList.add('active');
    
    if (vista === 'tabla') {
        tableView.style.display = 'block';
        cardView.style.display = 'none';
    } else {
        tableView.style.display = 'none';
        cardView.style.display = 'block';
    }
    
    renderizarUsuarios();
}

// Helpers
async function cargarRoles() {
    try {
        const response = await fetch('/api/roles');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('filter-rol');
            select.innerHTML = '<option value="">Todos los roles</option>' +
                data.roles.map(r => `<option value="${r.nombre}">${r.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function actualizarPaginacion() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    document.getElementById('showing-from').textContent = 
        filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    document.getElementById('showing-to').textContent = 
        Math.min(currentPage * itemsPerPage, filteredData.length);
    document.getElementById('total-items').textContent = filteredData.length;
    
    let html = `
        <button class="page-btn" onclick="cambiarPagina(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="cambiarPagina(${i})">${i}</button>
        `;
    }
    
    html += `
        <button class="page-btn" onclick="cambiarPagina(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
}

function cambiarPagina(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarUsuarios();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function actualizarEstadisticas() {
    const totalUsuarios = usuariosData.length;
    const usuariosActivos = usuariosData.filter(u => u.activo === 1).length;
    const administradores = usuariosData.filter(u => 
        u.roles && u.roles.includes('Administrador')).length;
    
    document.getElementById('total-usuarios').textContent = totalUsuarios;
    document.getElementById('usuarios-activos').textContent = usuariosActivos;
    document.getElementById('usuarios-admins').textContent = administradores;
    document.getElementById('nuevos-mes').textContent = '0'; // Implementar según necesidad
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatearNumero(num) {
    return new Intl.NumberFormat('es-CR').format(num);
}

function exportarUsuarios() {
    console.log('Exportar usuarios');
    mostrarExito('Función de exportación en desarrollo');
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert('Error: ' + mensaje);
}

function mostrarModalEditarUsuario(usuarioId) {
    // Implementación básica
    mostrarExito('Función de edición en desarrollo');
}

function mostrarModalCrearUsuario() {
    // Implementación básica
    mostrarExito('Función de creación en desarrollo');
}

function editarUsuarioDesdeDetalle() {
    cerrarModal('modal-detalles-usuario');
    if (usuarioActual) {
        mostrarModalEditarUsuario(usuarioActual.id);
    }
}