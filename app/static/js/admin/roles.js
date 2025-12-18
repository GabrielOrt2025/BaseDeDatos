// static/js/admin/roles.js

let rolesData = [];
let usuariosData = [];
let usuarioSeleccionado = null;
let rolParaRevocar = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarRoles();
    cargarUsuarios(); // Para el select
    cargarUsuariosTabla(); // Para la tabla principal
    actualizarEstadisticas();
});

// ==========================================
// GESTIÓN DE ROLES (CRUD)
// ==========================================

// 1. Cargar roles desde la API
async function cargarRoles() {
    try {
        const response = await fetch('/api/roles');
        const data = await response.json();

        if (data.success) {
            rolesData = data.roles || [];
            renderizarRoles();
            cargarRolesSelect();
        } else {
            console.error('Error backend:', data.error);
            mostrarError('No se pudieron cargar los roles');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión al cargar roles');
    }
}

function renderizarRoles() {
    const container = document.getElementById('roles-container');
    
    if (rolesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-shield-x"></i>
                <p>No hay roles creados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = rolesData.map(rol => `
        <div class="role-item">
            <div class="role-header">
                <div class="role-info">
                    <h3>
                        <i class="bi bi-shield-check"></i>
                        ${rol.nombre}
                    </h3>
                    <p>${rol.descripcion || 'Sin descripción'}</p>
                </div>
                <div class="role-actions">
                    <button class="btn-icon edit" 
                            onclick="editarRol(${rol.id})" 
                            title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" 
                            onclick="eliminarRol(${rol.id})" 
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="role-stats">
                <div class="role-stat">
                    <i class="bi bi-people"></i>
                    <span>${rol.usuarios_asignados || 0} usuarios</span>
                </div>
                <div class="role-stat">
                    <i class="bi bi-calendar"></i>
                    <span>${rol.fecha_creacion ? formatearFecha(rol.fecha_creacion) : '-'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 2. Guardar Rol (Crear o Actualizar)
async function guardarRol(event) {
    event.preventDefault();
    
    const rolId = document.getElementById('rol-id').value;
    const nombre = document.getElementById('rol-nombre').value;
    const descripcion = document.getElementById('rol-descripcion').value;
    // Asumimos que existen checkboxes de permisos, si no, enviamos array vacío
    const permisos = []; 

    const esEdicion = !!rolId;
    const url = esEdicion ? '/api/roles/actualizar' : '/api/roles/crear';
    
    const payload = {
        nombre: nombre,
        descripcion: descripcion,
        permisos: permisos
    };

    if (esEdicion) {
        payload.id = parseInt(rolId);
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito(result.mensaje);
            cerrarModal('modal-rol');
            cargarRoles(); // Recargar lista
            actualizarEstadisticas();
        } else {
            mostrarError(result.error || 'Error al guardar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// 3. Eliminar Rol
async function eliminarRol(rolId) {
    if (!confirm('¿Estás seguro de eliminar este rol? esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/roles/${rolId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            mostrarExito(result.mensaje);
            cargarRoles();
            actualizarEstadisticas();
        } else {
            mostrarError(result.error || 'Error al eliminar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// ==========================================
// GESTIÓN DE USUARIOS Y ASIGNACIONES
// ==========================================

// Cargar usuarios para el SELECT
async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        const data = await response.json();
        
        if (data.success) {
            usuariosData = data.usuarios || [];
            const select = document.getElementById('select-usuario');
            // Guardamos el value actual si existe para no perder la selección al recargar
            const currentValue = select.value;
            
            select.innerHTML = '<option value="">Seleccionar usuario...</option>' +
                usuariosData.map(u => 
                    `<option value="${u.id}">${u.nombre} (${u.email})</option>`
                ).join('');
            
            if (currentValue) select.value = currentValue;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Llenar el select de roles disponible
function cargarRolesSelect() {
    const select = document.getElementById('select-rol');
    select.innerHTML = '<option value="">Seleccionar rol...</option>' +
        rolesData.map(r => 
            `<option value="${r.id}">${r.nombre}</option>`
        ).join('');
}

// Cargar roles específicos de un usuario seleccionado
async function cargarRolesUsuario() {
    const usuarioId = document.getElementById('select-usuario').value;
    
    if (!usuarioId) {
        document.getElementById('roles-usuario-actual').innerHTML = `
            <div class="info-message">
                <i class="bi bi-info-circle"></i>
                Selecciona un usuario para ver sus roles
            </div>
        `;
        return;
    }
    
    usuarioSeleccionado = usuarioId;
    
    try {
        const response = await fetch(`/api/usuarios/${usuarioId}/roles`);
        const data = await response.json();
        
        if (data.success) {
            const roles = data.roles || [];
            
            if (roles.length === 0) {
                document.getElementById('roles-usuario-actual').innerHTML = `
                    <div class="info-message">
                        <i class="bi bi-info-circle"></i>
                        Este usuario no tiene roles asignados
                    </div>
                `;
                return;
            }
            
            // Renderizamos los roles como "chips" con botón de eliminar
            document.getElementById('roles-usuario-actual').innerHTML = 
                roles.map(rol => `
                    <div class="role-chip">
                        <i class="bi bi-shield-check"></i>
                        <span>${rol.nombre}</span>
                        <button onclick="prepararRevocarRol(${usuarioId}, ${rol.id}, '${rol.nombre}', '${getNombreUsuario(usuarioId)}')">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                `).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Asignar rol (API: /api/roles/asignar)
async function asignarRol(event) {
    event.preventDefault();
    
    const usuarioId = document.getElementById('select-usuario').value;
    const rolId = document.getElementById('select-rol').value;
    
    if (!usuarioId || !rolId) {
        mostrarError('Selecciona usuario y rol');
        return;
    }
    
    try {
        // NOTA: routes.py espera snake_case: 'usuario_id', 'rol_id'
        const response = await fetch('/api/roles/asignar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario_id: parseInt(usuarioId), 
                rol_id: parseInt(rolId)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Rol asignado correctamente');
            document.getElementById('select-rol').value = ''; // Reset select rol
            cargarRolesUsuario(); // Actualizar chips
            cargarUsuariosTabla(); // Actualizar tabla general
            actualizarEstadisticas();
        } else {
            mostrarError(result.error || 'Error al asignar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Preparar modal de confirmación para revocar
function prepararRevocarRol(usuarioId, rolId, rolNombre, usuarioNombre) {
    rolParaRevocar = { usuarioId: parseInt(usuarioId), rolId: parseInt(rolId) };
    document.getElementById('revocar-rol-nombre').textContent = rolNombre;
    document.getElementById('revocar-usuario-nombre').textContent = usuarioNombre;
    document.getElementById('modal-confirmar-revocar').classList.add('active');
}

// Confirmar revocación (API: /api/roles/revocar)
async function confirmarRevocacion() {
    if (!rolParaRevocar) return;
    
    try {
        // NOTA: routes.py espera camelCase: 'usuarioId', 'rolId'
        const response = await fetch('/api/roles/revocar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rolParaRevocar)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Rol revocado correctamente');
            cerrarModal('modal-confirmar-revocar');
            cargarRolesUsuario(); // Actualizar chips del usuario seleccionado
            cargarUsuariosTabla(); // Actualizar tabla general
            actualizarEstadisticas();
            rolParaRevocar = null;
        } else {
            mostrarError(result.error || 'Error al revocar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// ==========================================
// TABLA PRINCIPAL DE USUARIOS
// ==========================================

async function cargarUsuariosTabla() {
    try {
        const response = await fetch('/api/usuarios-con-roles');
        const data = await response.json();
        
        if (data.success) {
            renderizarUsuariosTabla(data.usuarios || []);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderizarUsuariosTabla(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="bi bi-people"></i>
                        <p>No hay usuarios registrados</p>
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
                    <div class="user-avatar-small">
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
                        ? usuario.roles.map(rol => 
                            `<span class="role-pill">${rol}</span>`
                          ).join('')
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
                <button class="btn-icon edit" 
                        onclick="verDetallesUsuario(${usuario.id})"
                        title="Ver detalles">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// DETALLES Y MODALES
// ==========================================

// Ver detalles completos de usuario
async function verDetallesUsuario(usuarioId) {
    try {
        const response = await fetch(`/api/usuarios/${usuarioId}/detalles`);
        const data = await response.json();
        
        if (data.success) {
            const usuario = data.usuario;
            
            document.getElementById('usuario-detalle-nombre').textContent = usuario.nombre;
            document.getElementById('detalle-nombre').textContent = usuario.nombre;
            document.getElementById('detalle-email').textContent = usuario.email;
            
            // Estado y clase
            const estadoElem = document.getElementById('detalle-estado');
            estadoElem.textContent = usuario.activo === 1 ? 'Activo' : 'Inactivo';
            estadoElem.className = `badge ${usuario.activo === 1 ? 'activo' : 'inactivo'}`;
            
            // Renderizar lista de roles en el modal
            const rolesLista = document.getElementById('detalle-roles-lista');
            if (usuario.roles && usuario.roles.length > 0) {
                rolesLista.innerHTML = usuario.roles.map(rol => `
                    <div class="role-detail-item">
                        <div class="role-detail-info">
                            <div class="role-icon">
                                <i class="bi bi-shield-check"></i>
                            </div>
                            <div>
                                <h4>${rol}</h4>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                rolesLista.innerHTML = `
                    <div class="info-message">
                        <i class="bi bi-info-circle"></i>
                        Este usuario no tiene roles asignados
                    </div>
                `;
            }
            
            document.getElementById('modal-detalles-usuario').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los detalles');
    }
}

// Funciones del Modal Crear/Editar
function mostrarModalCrearRol() {
    document.getElementById('modal-rol-title').textContent = 'Crear Rol';
    document.getElementById('rol-id').value = ''; // ID vacío indica creación
    document.getElementById('form-rol').reset();
    document.getElementById('modal-rol').classList.add('active');
}

function editarRol(rolId) {
    const rol = rolesData.find(r => r.id === rolId);
    if (!rol) return;
    
    document.getElementById('modal-rol-title').textContent = 'Editar Rol';
    document.getElementById('rol-id').value = rol.id;
    document.getElementById('rol-nombre').value = rol.nombre;
    document.getElementById('rol-descripcion').value = rol.descripcion || '';
    
    document.getElementById('modal-rol').classList.add('active');
}

// ==========================================
// ESTADÍSTICAS
// ==========================================

async function actualizarEstadisticas() {
    try {
        const response = await fetch('/api/roles/estadisticas');
        const data = await response.json();

        if (data.success) {
            document.getElementById('total-roles').textContent = data.total_roles || 0;
            document.getElementById('total-usuarios-roles').textContent = data.usuarios_con_roles || 0;
            document.getElementById('total-admins').textContent = data.administradores || 0;
            document.getElementById('cambios-recientes').textContent = data.cambios_hoy || 0;
        }
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

// Búsqueda en tabla frontend
document.getElementById('search-usuarios')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usuarios-tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function getNombreUsuario(usuarioId) {
    // Usamos '=='' para permitir coincidencia entre string "1" y number 1
    const usuario = usuariosData.find(u => u.id == usuarioId);
    return usuario ? usuario.nombre : 'Usuario';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    // Manejo básico de formatos ISO o Strings de fecha
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha; 
    
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function mostrarExito(mensaje) {
    // Si usas SweetAlert, cámbialo aquí. Por defecto usamos alert simple.
    alert('✅ ' + mensaje);
}

function mostrarError(mensaje) {
    alert('❌ Error: ' + mensaje);
}