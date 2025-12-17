// ==============================
// Utilidades
// ==============================
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio || 0);
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ==============================
// Cargar todo el dashboard
// ==============================
async function cargarDatos() {
    try {
        const response = await fetch('/api/dashboard/completo');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error cargando dashboard');
        }

        cargarEstadisticas(data.resumen);
        cargarOrdenesRecientes(data.ordenes_recientes);
        cargarActividad(data.actividades_recientes);
        cargarAlertasStock(data.alertas_stock);

    } catch (error) {
        console.error('Error general del dashboard:', error);
    }
}

// ==============================
// Estadísticas superiores
// ==============================
function cargarEstadisticas(resumen) {
    document.getElementById('stat-ordenes').textContent =
        resumen.ordenes_hoy ?? 0;

    document.getElementById('stat-ventas').textContent =
        '₡' + formatearPrecio(resumen.monto_ventas_hoy);

    document.getElementById('stat-usuarios').textContent =
        resumen.usuarios_activos ?? 0;

    document.getElementById('stat-productos').textContent =
        resumen.productos_activos ?? 0;
}

// ==============================
// Órdenes recientes
// ==============================
function cargarOrdenesRecientes(ordenes) {
    const container = document.getElementById('ordenes-container');

    if (!ordenes || ordenes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>No hay órdenes recientes</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${ordenes.map(o => `
                    <tr>
                        <td><strong>${o.numero_orden}</strong></td>
                        <td>${o.nombre_usuario}</td>
                        <td>₡${formatearPrecio(o.total)}</td>
                        <td>
                            <span class="badge ${o.estado.toLowerCase()}">
                                ${o.estado}
                            </span>
                        </td>
                        <td>${formatearFecha(o.fecha_orden)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ==============================
// Actividad reciente
// ==============================
function cargarActividad(actividades) {
    const container = document.getElementById('activity-feed');

    if (!actividades || actividades.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-activity"></i>
                <p>No hay actividad reciente</p>
            </div>`;
        return;
    }

    container.innerHTML = actividades.map(act => {
        let icono = 'info-circle';

        if (act.tipo === 'ORDEN') icono = 'cart-check';
        if (act.tipo === 'USUARIO') icono = 'person';
        if (act.tipo === 'PRODUCTO') icono = 'box';

        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="bi bi-${icono}"></i>
                </div>
                <div class="activity-content">
                    <h4>${act.tipo_actividad}</h4>
                    <p>${act.descripcion}</p>
                    <div class="activity-time">
                        ${formatearFecha(act.fecha_actividad)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==============================
// Alertas de stock bajo
// ==============================
function cargarAlertasStock(alertas) {
    const container = document.getElementById('stock-alerts-container');

    if (!alertas || alertas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-check-circle"></i>
                <p>No hay alertas de stock</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Mínimo</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                ${alertas.map(a => `
                    <tr>
                        <td><strong>${a.producto}</strong></td>
                        <td>${a.categoria}</td>
                        <td style="color: var(--danger); font-weight:600;">
                            ${a.cantidad_disponible}
                        </td>
                        <td>${a.cantidad_alerta}</td>
                        <td>
                            <a href="/admin/inventario" class="btn btn-primary"
                               style="padding:6px 12px;font-size:.85rem;">
                                <i class="bi bi-plus-circle"></i> Reponer
                            </a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ==============================
// Inicialización
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    setInterval(cargarDatos, 300000); // 5 minutos
});
