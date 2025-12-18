// static/js/admin/usuarios.js

let usuariosData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let usuarioActual = null;
let accionPendiente = null;
let usuarioIdPendiente = null;
let nuevoEstadoPendiente = null;

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
        } else {
            mostrarError('Error al cargar usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

function prepararCambioEstado(id, nombre, estadoActual) {
    usuarioIdPendiente = id;
    nuevoEstadoPendiente = estadoActual === 1 ? 0 : 1; // Invierte el estado
    
    const accion = nuevoEstadoPendiente === 1 ? 'activar' : 'desactivar';
    const mensaje = `¿Estás seguro de que deseas <strong>${accion}</strong> al usuario <strong>${nombre}</strong>?`;
    
    document.getElementById('confirmar-mensaje').innerHTML = mensaje;
    abrirModal('modal-confirmar-estado'); // Asegúrate de tener esta función definida
}

/**
 * Ejecuta la llamada a la API tras la confirmación del usuario.
 */
async function confirmarCambioEstado() {
    if (usuarioIdPendiente === null) return;

    try {
        const response = await fetch('/api/usuarios/cambiar-estado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: usuarioIdPendiente,
                activo: nuevoEstadoPendiente === 1
            })
        });

        const data = await response.json();

        if (data.success) {
            cerrarModal('modal-confirmar-estado');
            mostrarExito('El estado del usuario ha sido actualizado.'); // Opcional: Función de notificación
            cargarUsuarios(); // Recarga la tabla o lista de usuarios
            actualizarEstadisticas(); // Refresca los contadores del dashboard
        } else {
            mostrarError(data.error || 'Error al actualizar el estado');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión con el servidor');
    } finally {
        usuarioIdPendiente = null;
        nuevoEstadoPendiente = null;
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
                <td colspan="7">
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
            <td>${formatearFecha(usuario.creado)}</td>
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
            <span class="badge ${usuario.activo ? 'activo' : 'inactivo'}">
                ${usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
            <div class="user-card-info">
                <div class="info-item">
                    <span class="label">Roles</span>
                    <span class="value">${usuario.roles ? usuario.roles.length : 0}</span>
                </div>
                <div class="info-item">
                    <span class="label">Direcciones</span>
                    <span class="value">${usuario.direcciones_count || 0}</span>
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
        const matchEstado = !estado || usuario.activo == estado;
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

// Modales
function mostrarModalCrearUsuario() {
    document.getElementById('form-crear-usuario').reset();
    cargarRolesCheckboxes('roles-nuevo-usuario');
    document.getElementById('modal-crear-usuario').classList.add('active');
}

function mostrarModalEditarUsuario(usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    if (!usuario) return;
    
    document.getElementById('edit-usuario-id').value = usuario.id;
    document.getElementById('edit-email').value = usuario.nombre;
    document.getElementById('edit-nombre').value = usuario.email;
    document.getElementById('edit-password').value = '';
    document.getElementById('edit-activo').checked = usuario.activo;
    
    document.getElementById('modal-editar-usuario').classList.add('active');
}

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
            document.getElementById('detalle-estado').textContent = usuario.activo ? 'Activo' : 'Inactivo';
            document.getElementById('detalle-estado').className = `badge ${usuario.activo ? 'activo' : 'inactivo'}`;
            
            // Cargar roles
            cargarRolesTab(usuario.roles || []);
            
            // Cargar direcciones
            cargarDireccionesTab(usuario.direcciones || []);
            
            // Cargar órdenes
            cargarOrdenesTab(usuario.ordenes || []);
            
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

function cargarDireccionesTab(direcciones) {
    const container = document.getElementById('detalle-direcciones-lista');
    
    if (direcciones.length === 0) {
        container.innerHTML = `
            <div class="info-message">
                <i class="bi bi-info-circle"></i>
                No hay direcciones registradas
            </div>
        `;
        return;
    }
    
    container.innerHTML = direcciones.map(dir => `
        <div class="direccion-item">
            <h5>${dir.etiqueta}</h5>
            <p>${dir.linea_1}, ${dir.ciudad}, ${dir.provincia}</p>
            <small>${dir.telefono}</small>
        </div>
    `).join('');
}

function cargarOrdenesTab(ordenes) {
    const container = document.getElementById('detalle-ordenes-lista');
    
    if (ordenes.length === 0) {
        container.innerHTML = `
            <div class="info-message">
                <i class="bi bi-info-circle"></i>
                No hay órdenes registradas
            </div>
        `;
        return;
    }
    
    container.innerHTML = ordenes.map(orden => `
        <div class="orden-item">
            <div>
                <strong>${orden.numero_orden}</strong>
                <span class="badge ${orden.estado.toLowerCase()}">${orden.estado}</span>
            </div>
            <p>₡${formatearNumero(orden.total)} - ${formatearFecha(orden.fecha)}</p>
        </div>
    `).join('');
}

function cambiarTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

// CRUD Operations
async function crearUsuario(event) {
    event.preventDefault();
    
    const password = document.getElementById('nuevo-password').value;
    const confirmPassword = document.getElementById('nuevo-password-confirm').value;
    
    if (password !== confirmPassword) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }
    
    const data = {
        nombre: document.getElementById('nuevo-nombre').value,
        email: document.getElementById('nuevo-email').value,
        password: password,
        roles: obtenerRolesSeleccionados('roles-nuevo-usuario')
    };
    
    try {
        const response = await fetch('/api/usuarios/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Usuario creado correctamente');
            cerrarModal('modal-crear-usuario');
            cargarUsuarios();
        } else {
            mostrarError(result.error || 'Error al crear usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

async function actualizarUsuario(event) {
    event.preventDefault();
    
    const data = {
        usuario_id: document.getElementById('edit-usuario-id').value,
        nombre: document.getElementById('edit-nombre').value,
        email: document.getElementById('edit-email').value,
        password: document.getElementById('edit-password').value || null,
        activo: document.getElementById('edit-activo').checked ? 1 : 0
    };
    
    try {
        const response = await fetch('/api/usuarios/actualizar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Usuario actualizado correctamente');
            cerrarModal('modal-editar-usuario');
            cargarUsuarios();
        } else {
            mostrarError(result.error || 'Error al actualizar usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

function confirmarCambioEstadoUsuario(usuarioId, nuevoEstado) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    
    if (!usuario) {
        console.error("Usuario no encontrado en los datos locales");
        return;
    }
    accionPendiente = { 
        usuario_id: usuarioId, 
        activo: nuevoEstado
    };
    
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    document.getElementById('confirmar-mensaje').innerHTML = 
        `¿Estás seguro de que deseas <strong>${accion}</strong> al usuario "<strong>${usuario.nombre}</strong>"?`;
    
    document.getElementById('modal-confirmar-estado').classList.add('active');
}

async function confirmarCambioEstado() {
    if (!accionPendiente) return;
    
    try {
        const response = await fetch('/api/usuarios/cambiar-estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accionPendiente)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Estado actualizado correctamente');
            cerrarModal('modal-confirmar-estado');
            cargarUsuarios();
            accionPendiente = null;
        } else {
            mostrarError(result.error || 'Error al cambiar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
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

function cargarRolesCheckboxes(containerId) {
    // Implementar carga de roles en checkboxes
}

function obtenerRolesSeleccionados(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function editarUsuarioDesdeDetalle() {
    cerrarModal('modal-detalles-usuario');
    mostrarModalEditarUsuario(usuarioActual.id);
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
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
    try {
        const response = await fetch('/api/usuarios/estadisticas');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('total-usuarios').textContent = data.total || 0;
            document.getElementById('usuarios-activos').textContent = data.activos || 0;
            document.getElementById('usuarios-admins').textContent = data.admins || 0;
            document.getElementById('nuevos-mes').textContent = data.nuevos_mes || 0;
        }
    } catch (error) {
        console.error('Error:', error);
    }
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
}

function mostrarExito(mensaje) {
    alert(mensaje);
}

function mostrarError(mensaje) {
    alert(mensaje);
}