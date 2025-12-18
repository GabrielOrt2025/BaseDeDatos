// static/js/admin/roles.js

let rolesData = [];
let usuariosData = [];
let usuarioSeleccionado = null;
let rolParaRevocar = null;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarRoles();
    cargarUsuarios();
    cargarUsuariosTabla();
    actualizarEstadisticas();
});

// Cargar roles
async function cargarRoles() {
    try {
        const response = await fetch('/api/roles');
        const data = await response.json();
        
        if (data.success) {
            rolesData = data.roles || [];
            renderizarRoles();
            cargarRolesSelect();
        } else {
            mostrarError('Error al cargar roles');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Renderizar roles
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
                    <span>Creado ${formatearFecha(rol.fecha_creacion)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Cargar usuarios en select
async function cargarUsuarios() {
    try {
        const response = await fetch('/api/usuarios');
        const data = await response.json();
        
        if (data.success) {
            usuariosData = data.usuarios || [];
            const select = document.getElementById('select-usuario');
            select.innerHTML = '<option value="">Seleccionar usuario...</option>' +
                usuariosData.map(u => 
                    `<option value="${u.id}">${u.nombre} (${u.email})</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Cargar roles en select
function cargarRolesSelect() {
    const select = document.getElementById('select-rol');
    select.innerHTML = '<option value="">Seleccionar rol...</option>' +
        rolesData.map(r => 
            `<option value="${r.id}">${r.nombre}</option>`
        ).join('');
}

// Cargar roles del usuario seleccionado
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

// Asignar rol
async function asignarRol(event) {
    event.preventDefault();
    
    const usuarioId = document.getElementById('select-usuario').value;
    const rolId = document.getElementById('select-rol').value;
    
    if (!usuarioId || !rolId) {
        mostrarError('Selecciona usuario y rol');
        return;
    }
    
    try {
        const response = await fetch('/api/roles/asignar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario_id: usuarioId, 
                rol_id: rolId 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Rol asignado correctamente');
            document.getElementById('select-rol').value = '';
            cargarRolesUsuario();
            cargarUsuariosTabla();
        } else {
            mostrarError(result.error || 'Error al asignar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Preparar revocación
function prepararRevocarRol(usuarioId, rolId, rolNombre, usuarioNombre) {
    rolParaRevocar = { usuarioId, rolId };
    document.getElementById('revocar-rol-nombre').textContent = rolNombre;
    document.getElementById('revocar-usuario-nombre').textContent = usuarioNombre;
    document.getElementById('modal-confirmar-revocar').classList.add('active');
}

// Confirmar revocación
async function confirmarRevocacion() {
    if (!rolParaRevocar) return;
    
    try {
        const response = await fetch('/api/roles/revocar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rolParaRevocar)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Rol revocado correctamente');
            cerrarModal('modal-confirmar-revocar');
            cargarRolesUsuario();
            cargarUsuariosTabla();
            rolParaRevocar = null;
        } else {
            mostrarError(result.error || 'Error al revocar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Cargar tabla de usuarios
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
            <td>${formatearFecha(usuario.fecha_creacion)}</td>
            <td>
                <span class="badge ${usuario.activo ? 'activo' : 'inactivo'}">
                    ${usuario.activo ? 'Activo' : 'Inactivo'}
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

// Ver detalles de usuario
async function verDetallesUsuario(usuarioId) {
    try {
        const response = await fetch(`/api/usuarios/${usuarioId}/detalles`);
        const data = await response.json();
        
        if (data.success) {
            const usuario = data.usuario;
            
            document.getElementById('usuario-detalle-nombre').textContent = usuario.nombre;
            document.getElementById('detalle-nombre').textContent = usuario.nombre;
            document.getElementById('detalle-email').textContent = usuario.email;
            document.getElementById('detalle-estado').textContent = 
                usuario.activo ? 'Activo' : 'Inactivo';
            document.getElementById('detalle-estado').className = 
                `badge ${usuario.activo ? 'activo' : 'inactivo'}`;
            
            // Renderizar roles
            const rolesLista = document.getElementById('detalle-roles-lista');
            if (usuario.roles && usuario.roles.length > 0) {
                rolesLista.innerHTML = usuario.roles.map(rol => `
                    <div class="role-detail-item">
                        <div class="role-detail-info">
                            <div class="role-icon">
                                <i class="bi bi-shield-check"></i>
                            </div>
                            <div>
                                <h4>${rol.nombre}</h4>
                                <span>Asignado ${formatearFecha(rol.fecha_asignacion)}</span>
                            </div>
                        </div>
                        <button class="btn-icon delete" 
                                onclick="prepararRevocarRol(${usuarioId}, ${rol.id}, '${rol.nombre}', '${usuario.nombre}')">
                            <i class="bi bi-x"></i>
                        </button>
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
    }
}

// Modal crear/editar rol
function mostrarModalCrearRol() {
    document.getElementById('modal-rol-title').textContent = 'Crear Rol';
    document.getElementById('rol-id').value = '';
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
    
    // Cargar permisos si existen
    if (rol.permisos) {
        rol.permisos.forEach(permiso => {
            const checkbox = document.getElementById(`perm-${permiso}`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    document.getElementById('modal-rol').classList.add('active');
}

async function guardarRol(event) {
    event.preventDefault();
    
    const rolId = document.getElementById('rol-id').value;
    const isEdit = !!rolId;
    
    // Recoger permisos seleccionados
    const permisos = [];
    document.querySelectorAll('.permission-item input:checked').forEach(checkbox => {
        permisos.push(checkbox.value);
    });
    
    const data = {
        nombre: document.getElementById('rol-nombre').value,
        descripcion: document.getElementById('rol-descripcion').value,
        permisos: permisos
    };
    
    if (isEdit) {
        data.id = rolId;
    }
    
    try {
        const url = isEdit ? '/api/roles/actualizar' : '/api/roles/crear';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito(isEdit ? 'Rol actualizado' : 'Rol creado correctamente');
            cerrarModal('modal-rol');
            cargarRoles();
        } else {
            mostrarError(result.error || 'Error al guardar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

async function eliminarRol(rolId) {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;
    
    try {
        const response = await fetch(`/api/roles/${rolId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarExito('Rol eliminado correctamente');
            cargarRoles();
        } else {
            mostrarError(result.error || 'Error al eliminar rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Actualizar estadísticas
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
        console.error('Error:', error);
    }
}

// Búsqueda en tabla
document.getElementById('search-usuarios')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usuarios-tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// Utilidades
function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function getNombreUsuario(usuarioId) {
    const usuario = usuariosData.find(u => u.id == usuarioId);
    return usuario ? usuario.nombre : 'Usuario';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function mostrarExito(mensaje) {
    // Implementar notificación de éxito (puede usar toast/alert)
    alert(mensaje);
}

function mostrarError(mensaje) {
    // Implementar notificación de error
    alert(mensaje);
}