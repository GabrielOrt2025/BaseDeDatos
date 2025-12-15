from flask import Blueprint, jsonify, render_template, request, session, flash, redirect, url_for, current_app
from .database.sp.pa import *
from .database.sp.carrito import *
from .database.sp.ventas import *
from .auth import (
    login_required, guest_only, login_user, logout_user, 
    get_current_user, is_authenticated, register_user,
    role_required, admin_required, has_role, has_any_role, is_admin
)
from email.message import EmailMessage

bp = Blueprint("main", __name__)

# Autenticacion
@bp.route("/login", methods=["GET", "POST"])
@guest_only
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash("Por favor completa todos los campos.", "error")
            return render_template("auth/login.html")
        
        success, message, user_data = login_user(email, password)

        if success:
            flash(message, "success")
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('main.home'))
        else:
            flash(message, "error")
    return render_template("auth/login.html")

@bp.route("/sign-up", methods=["GET", "POST"])
@guest_only
def sign_up():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        email = request.form.get("email")
        password = request.form.get("password")
        confirmarPassword = request.form.get("confirmarPassword")
        
        if not all([nombre, email, password, confirmarPassword]):
            flash("Quedan campos restantes.", "error")
            return render_template("auth/signUp.html")
        
        if password != confirmarPassword:
            flash("Las contraseñas no coinciden.", "error")
            return render_template("auth/signUp.html")

        if len(password) < 5:
            flash("La contraseña debe tener como minimo 6 caracteres", "error")
            return render_template("auth/signUp.html")
        
        success, message = register_user(email, password, nombre)

        if success:
            flash(message, "success")
            return redirect(url_for('main.login'))
        else:
            flash(message, 'error')
    return render_template("auth/signUp.html")


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.home'))

# Publicas
@bp.route("/")  
def home():
    try:
        success_h, hombre = obtenerTopProductosCateogria(idCategoria=2)
        success_m, mujer = obtenerTopProductosCateogria(idCategoria=1)
        success_g, gorros = obtenerTopProductosCateogria(idCategoria=3)
        
        hombre = hombre if success_h else []
        mujer = mujer if success_m else []
        gorros = gorros if success_g else []
        
        return render_template("home/home.html", hombres=hombre, mujeres=mujer, gorros=gorros)
    except Exception as e:
        print(f"Error al obtner los productos: {e}") 
        import traceback
        traceback.print_exc()
        return render_template("home/home.html", hombres=[], mujeres=[], gorros=[])
        

@bp.route("/contacto", methods=["GET", "POST"])
def contacto():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        email = request.form.get("email")
        mensaje = request.form.get("mensaje")

        email_user = current_app.config.get("EMAIL_USER")
        email_pass = current_app.config.get("EMAIL_PASS")
        email_to   = current_app.config.get("EMAIL_TO", email_user)

        # por si las variables no estan configuradas
        if not email_user or not email_pass:
            flash("Config de correo no valida en el servidor.", "error")
            return redirect(url_for("main.contacto"))

        #cuerpo = f"""Nuevo mensaje desde Empijamadas:

        # Nombre: {nombre}
        # Email: {email}

        # Mensaje:
        # {mensaje}
            # """

#         msg = EmailMessage()
#         msg["Subject"] = "Nuevo mensaje de contacto - Empijamadas"
#         msg["From"] = email_user
#         msg["To"] = email_to
#         msg.set_content(cuerpo)

#         try:
#             with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
#                 smtp.login(email_user, email_pass)
#                 smtp.send_message(msg)

#             flash("Gracias por escribirnos, pronto te respondemos.", "success")
#         except Exception as e:
#             # para debug en consola
#             print("Error enviando correo:", e)
#             flash("Hubo un error enviando tu mensaje. Intenta de nuevo mas tarde.", "error")

        return redirect(url_for("main.contacto"))

    # GET
    return render_template("home/contacto.html")

@bp.route("/nosotros")
def nosotros():
    return render_template("home/nosotros.html")

@bp.route("/tienda")
def tienda():
    productos = obtenerDetallesProducto()
    return render_template("tienda/tienda.html", productos=productos)

@bp.route("/tienda/mujer")
def mujer():
    mujer = obtenerProductoCategoria(1)
    return render_template("tienda/mujer.html", value=mujer)

@bp.route("/tienda/hombres")
def hombre():
    hombres = obtenerProductoCategoria(2)
    return render_template("tienda/hombres.html", value=hombres)

@bp.route("/tienda/gorros")
def gorros():
    gorros = obtenerProductoCategoria(3)
    return render_template("tienda/gorro.html", value=gorros)

#login requerido
@bp.route('/carrito')
@login_required
def carrito():
    return render_template("pago/carrito.html")


@bp.route("/carrito/checkout")
@login_required
def checkout():
    return render_template("pago/checkout.html")

@bp.route("/cuenta")
@login_required
def cuenta():
    return render_template("personal/cuenta.html")

# Rutas con roles especificos
@bp.route("/admin/dashboard")
@admin_required
def admin_dashboard():
    return render_template("admin/dashboard.html")


#API
@bp.route('/api/obtenerDatos', methods=['GET'])
def enviarTopCategoria5():
    success_h, hombre = obtenerTopProductosCateogria(idCategoria=2)
    success_m, mujeres = obtenerTopProductosCateogria(idCategoria=1)
    success_g, gorros = obtenerTopProductosCateogria(idCategoria=3)
    def procesar_productos(productos):
        if not productos:
            return []
        for prod in productos:
            if 'url' in prod and prod['url']:
                img_path = prod['url'].lstrip('/')
                prod['url'] = url_for('static', filename=img_path)
        return productos

    return jsonify({
        'hombre': procesar_productos(hombre if success_h else []),
        'mujer': procesar_productos(mujeres if success_m else []),
        'gorro': procesar_productos(gorros if success_g else [])
    })


@bp.route('/api/carrito', methods=['GET'])
@login_required
def api_obtener_carrito():
    try:
        user_id = session.get('user_id')
        success, items = obtenerCarrito(user_id)
        
        if success:
            # Calcular totales
            success_total, total = calcularTotalCarrito(user_id)
            success_count, count = contarItemsCarrito(user_id)
            
            return jsonify({
                'success': True,
                'items': items,
                'total': total if success_total else 0,
                'count': count if success_count else 0
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener carrito'
            }), 500
            
    except Exception as e:
        print(f"Error en api_obtener_carrito: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/carrito/agregar', methods=['POST'])
@login_required
def api_agregar_al_carrito():
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        producto_id = data.get('producto_id')
        cantidad = data.get('cantidad', 1)
        precio_unitario = data.get('precio_unitario')
        
        if not producto_id or not precio_unitario:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success, mensaje = agregarItemCarrito(
            user_id, producto_id, cantidad, precio_unitario
        )
        
        if success:
            # Obtener contador actualizado
            success_count, count = contarItemsCarrito(user_id)
            
            return jsonify({
                'success': True,
                'mensaje': mensaje,
                'count': count if success_count else 0
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        print(f"Error en api_agregar_al_carrito: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/carrito/actualizar', methods=['POST'])
@login_required
def api_actualizar_carrito():
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        producto_id = data.get('producto_id')
        cantidad = data.get('cantidad')
        
        if not producto_id or cantidad is None:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success, mensaje = actualizarCantidadItem(user_id, producto_id, cantidad)
        
        if success:
            # Recalcular total
            success_total, total = calcularTotalCarrito(user_id)
            
            return jsonify({
                'success': True,
                'mensaje': mensaje,
                'total': total if success_total else 0
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        print(f"Error en api_actualizar_carrito: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/carrito/eliminar/<int:producto_id>', methods=['DELETE'])
@login_required
def api_eliminar_item_carrito(producto_id):
    try:
        user_id = session.get('user_id')
        
        success, mensaje = eliminarItemCarrito(user_id, producto_id)
        
        if success:
            # Recalcular totales
            success_total, total = calcularTotalCarrito(user_id)
            success_count, count = contarItemsCarrito(user_id)
            
            return jsonify({
                'success': True,
                'mensaje': mensaje,
                'total': total if success_total else 0,
                'count': count if success_count else 0
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        print(f"Error en api_eliminar_item_carrito: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/carrito/vaciar', methods=['POST'])
@login_required
def api_vaciar_carrito():
    try:
        user_id = session.get('user_id')
        
        success, mensaje = vaciarCarrito(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'mensaje': mensaje
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        print(f"Error en api_vaciar_carrito: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/carrito/count', methods=['GET'])
@login_required
def api_carrito_count():
    try:
        user_id = session.get('user_id')
        success, count = contarItemsCarrito(user_id)
        
        return jsonify({
            'success': True,
            'count': count if success else 0
        })
        
    except Exception as e:
        print(f"Error en api_carrito_count: {e}")
        return jsonify({
            'success': False,
            'count': 0
        })


@bp.route('/api/orden/crear', methods=['POST'])
@login_required
def api_crear_orden():
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        sucursal_id = data.get('sucursal_id', 1)  # Sucursal por defecto
        direccion_envio_id = data.get('direccion_envio_id')
        metodo_pago = data.get('metodo_pago', 'EFECTIVO')
        notas = data.get('notas', '')
        
        if not direccion_envio_id:
            return jsonify({
                'success': False,
                'error': 'Debe proporcionar una dirección de envío'
            }), 400
        
        success, resultado = crearOrdenDesdeCarrito(
            user_id, sucursal_id, direccion_envio_id, metodo_pago, notas
        )
        
        if success:
            return jsonify({
                'success': True,
                'orden_id': resultado['orden_id'],
                'numero_orden': resultado['numero_orden'],
                'mensaje': resultado['mensaje']
            })
        else:
            return jsonify({
                'success': False,
                'error': resultado.get('error', 'Error al crear orden')
            }), 500
            
    except Exception as e:
        print(f"Error en api_crear_orden: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/ordenes', methods=['GET'])
@login_required
def api_obtener_ordenes():
    try:
        user_id = session.get('user_id')
        success, ordenes = obtenerOrdenesPorUsuario(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'ordenes': ordenes
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener órdenes'
            }), 500
            
    except Exception as e:
        print(f"Error en api_obtener_ordenes: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/orden/<int:orden_id>', methods=['GET'])
@login_required
def api_detalle_orden(orden_id):
    try:
        success_items, items = obtenerDetalleOrden(orden_id)
        success_factura, factura = obtenerFacturaPorOrden(orden_id)
        
        if success_items:
            return jsonify({
                'success': True,
                'items': items,
                'factura': factura if success_factura else None
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener detalle de orden'
            }), 500
            
    except Exception as e:
        print(f"Error en api_detalle_orden: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/orden/<int:orden_id>/estado', methods=['PUT'])
@admin_required
def api_actualizar_estado_orden(orden_id):
    try:
        data = request.get_json()
        nuevo_estado = data.get('estado')
        
        if not nuevo_estado:
            return jsonify({
                'success': False,
                'error': 'Debe proporcionar un estado'
            }), 400
        
        success, mensaje = actualizarEstadoOrden(orden_id, nuevo_estado)
        
        if success:
            return jsonify({
                'success': True,
                'mensaje': mensaje
            })
        else:
            return jsonify({
                'success': False,
                'error': mensaje
            }), 500
            
    except Exception as e:
        print(f"Error en api_actualizar_estado_orden: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route("/prueba", methods=['GET', 'POST'])
def prueba():
    try:
        value = obtenerProductoCategoria(idCategoria=3)
    except Exception as e:
        print(f"Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        productos = []
    
    return render_template("prueba.html", value=value)


@bp.app_context_processor
def inject_user():
    return {
        'current_user' : get_current_user(),
        'is_authenticated' : is_authenticated(),
        'has_role' : has_role,
        'has_any_role' : has_any_role,
        'is_admin' : is_admin()
    }

@bp.route("/test-obtener-contra")
def test_obtener_contra():
    """
    Ruta de prueba para verificar que obtenerContraUsuario funciona.
    Acceder en: http://localhost:5000/test-obtener-contra
    """
    from .database.sp.pa import obtenerContraUsuario
    test_email = "test@test.com"
    
    try:
        result = obtenerContraUsuario(test_email)
        
        return f"""
        <h1>Prueba de obtenerContraUsuario</h1>
        <h2>Email probado: {test_email}</h2>
        <h3>Resultado:</h3>
        <pre>
        Tipo: {type(result)}
        Longitud: {len(result) if isinstance(result, (tuple, list)) else 'N/A'}
        Contenido: {result}
        </pre>
        
        <h3>Análisis:</h3>
        <ul>
        <li>¿Es tupla?: {isinstance(result, tuple)}</li>
        <li>¿Tiene 2 elementos?: {len(result) == 2 if isinstance(result, tuple) else False}</li>
        """
        
        if isinstance(result, tuple) and len(result) == 2:
            success, info_user = result
            html += f"""
            <li>success = {success}</li>
            <li>info_user = {info_user}</li>
            <li>Tipo de info_user: {type(info_user)}</li>
            <li>Longitud de info_user: {len(info_user) if isinstance(info_user, list) else 'N/A'}</li>
            """
            
            if isinstance(info_user, list) and len(info_user) > 0:
                html += f"""
                <li>Primer elemento: {info_user[0]}</li>
                <li>passHash existe: {'passHash' in info_user[0]}</li>
                <li>idUser existe: {'idUser' in info_user[0]}</li>
                """
                if 'passHash' in info_user[0]:
                    html += f"<li>passHash (primeros 50 chars): {info_user[0]['passHash'][:50]}...</li>"
                if 'idUser' in info_user[0]:
                    html += f"<li>idUser: {info_user[0]['idUser']}</li>"
        
        html += "</ul>"
        return html
        
    except Exception as e:
        import traceback
        return f"""
        <h1>❌ Error en la prueba</h1>
        <h2>Email probado: {test_email}</h2>
        <h3>Error:</h3>
        <pre>{str(e)}</pre>
        <h3>Traceback:</h3>
        <pre>{traceback.format_exc()}</pre>
        """

@bp.route("/test-debug-roles")
@login_required
def test_debug_roles():
    """
    Ruta de debug para ver los roles del usuario actual
    """
    from .auth import get_user_roles, is_admin, has_role
    from .database.sp.pa import obtenerRolesUsuarios as obtenerRolesDirecto
    
    user = get_current_user()
    user_id = user['user_id']
    roles = get_user_roles()
    is_admin_flag = is_admin()
    has_admin_role = has_role('administrador')
    
    # Prueba directa del procedimiento
    print(f"\n{'='*80}")
    print(f"🧪 PRUEBA DIRECTA DE ROLES PARA USUARIO {user_id}")
    print(f"{'='*80}")
    success_direct, roles_direct = obtenerRolesDirecto(user_id)
    print(f"Success: {success_direct}, Roles: {roles_direct}")
    print(f"{'='*80}\n")
    
    return f"""
    <h1>🔐 Debug de Roles del Usuario</h1>
    
    <h2>📋 Usuario Actual</h2>
    <ul>
        <li><strong>ID:</strong> {user['user_id']}</li>
        <li><strong>Email:</strong> {user['email']}</li>
        <li><strong>Nombre:</strong> {user['nombre']}</li>
    </ul>
    
    <h2>🎭 Roles Asignados (desde sesión)</h2>
    <ul>
        <li><strong>Roles cargados:</strong> {roles}</li>
        <li><strong>Cantidad:</strong> {len(roles)}</li>
        <li><strong>Tipo:</strong> {type(roles)}</li>
    </ul>
    
    <h2>🎭 Roles Obtenidos Directamente</h2>
    <ul>
        <li><strong>Success:</strong> {success_direct}</li>
        <li><strong>Roles:</strong> {roles_direct}</li>
        <li><strong>Cantidad:</strong> {len(roles_direct)}</li>
    </ul>
    
    <h2>✅ Verificaciones</h2>
    <ul>
        <li><strong>¿Es administrador? (is_admin()):</strong> <strong style="color: {'green' if is_admin_flag else 'red'}">{is_admin_flag}</strong></li>
        <li><strong>¿Tiene rol 'administrador'? (has_role()):</strong> <strong style="color: {'green' if has_admin_role else 'red'}">{has_admin_role}</strong></li>
    </ul>
    
    <h2>🔍 Sesión Raw</h2>
    <pre>user_roles en sesión: {session.get('user_roles', 'No hay roles')}</pre>
    
    <h2>🧪 Pruebas Adicionales</h2>
    <ul>
        <li>Roles en minúsculas: {[r.lower() for r in roles]}</li>
        <li>'administrador' en roles (case-insensitive): {'administrador' in [r.lower() for r in roles]}</li>
    </ul>
    
    <h2>🔗 Enlaces</h2>
    <a href="/admin/dashboard">Ir al Dashboard de Admin</a> | 
    <a href="/">Volver al Home</a>
    """