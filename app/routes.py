from flask import Blueprint, jsonify, render_template, request, session, flash, redirect, url_for, current_app
from .database.sp.pa import *
from .database.sp.carrito import *
from .database.sp.ventas import *
from .database.sp.usuarios import *
from .database.sp.dashboard import *
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

@bp.route("/admin/usuarios")
@admin_required
def gestionUsuarios():
    return render_template("admin/usuarios.html")

@bp.route("/admin/productos")
@admin_required
def gestionProductos():
    return render_template("admin/productos.html")


@bp.route("/admin/roles")
@admin_required
def gestionRoles():
    return render_template("admin/roles.html")

@bp.route("/admin/inventario")
@admin_required
def verInventario():
    return render_template("admin/inventario.html")

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
            successReserva = reservar_producto(productoId=producto_id, cantidad=cantidad)
            if successReserva: 
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
        success, mensaje, cantidadEliminada = eliminarItemCarrito(user_id, producto_id)
        
        if success:
            successLiberar, msgLiberar = liberar_cantidad_reservada(
                productoId=producto_id, 
                cantidad=cantidadEliminada
            )
            
            if successLiberar:
                success_total, total = calcularTotalCarrito(user_id)
                success_count, count = contarItemsCarrito(user_id)
                
                return jsonify({
                    'success': True,
                    'mensaje': mensaje,
                    'total': total if success_total else 0,
                    'count': count if success_count else 0,
                    'cantidad_liberada': cantidadEliminada
                })
            else:
                print(f"ALERTA: Item eliminado pero fallo liberación de stock: {msgLiberar}")
                return jsonify({
                    'success': True, 
                    'mensaje': "Item eliminado (Advertencia: Stock no liberado correctamente)"
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
        
        sucursal_id = data.get('sucursal_id', 1)
        direccion_envio_id = data.get('direccion_envio_id')
        metodo_pago = data.get('metodo_pago', 'EFECTIVO')
        notas = data.get('notas', '')
        total = data.get('total', '')
        
        if not direccion_envio_id:
            return jsonify({
                'success': False,
                'error': 'Debe proporcionar una dirección de envío'
            }), 400
        
        success, resultado, facturaId = crearOrdenDesdeCarrito(
            user_id, sucursal_id, direccion_envio_id, metodo_pago, notas
        )
        
        if success:
            procesarPago(factura_id=facturaId, monto=total, metodo_pago=metodo_pago)
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

@bp.route('/api/producto/<int:producto_id>/stock', methods=['GET'])
def api_verificar_stock(producto_id):
    try:
        success, stock = obtenerStockProducto(producto_id)
        
        return jsonify({
            'success': True,
            'stock_disponible': stock if success else 0
        })
    except Exception as e:
        print(f"Error en api_verificar_stock: {e}")
        return jsonify({
            'success': False,
            'stock_disponible': 0
        })

# API: Direcciones de usuario
@bp.route('/api/direcciones', methods=['GET'])
@login_required
def api_obtener_direcciones():
    try:
        user_id = session.get('user_id')
        
        success, direcciones = direccionXusuario(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'direcciones': direcciones
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener direcciones'
            }), 500
            
    except Exception as e:
        print(f"Error en api_obtener_direcciones: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/direcciones/crear', methods=['POST'])
@login_required
def api_crear_direccion():
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        campos_requeridos = ['etiqueta', 'nombre_destinatario', 'linea_1', 
                           'ciudad', 'provincia', 'pais', 'telefono']
        
        for campo in campos_requeridos:
            if not data.get(campo):
                return jsonify({
                    'success': False,
                    'error': f'El campo {campo} es requerido'
                }), 400
        
        success, direccion_id = crearDireccion(
            usuarioId=user_id,
            etiqueta=data.get('etiqueta'),
            nombreDestinatario=data.get('nombre_destinatario'),
            linea1=data.get('linea_1'),
            ciudad=data.get('ciudad'),
            provincia=data.get('provincia'),
            codigoPostal=data.get('codigo_postal', ''),
            pais=data.get('pais'),
            telefono=data.get('telefono')
        )
        print(direccion_id)
        if success:
            return jsonify({
                'success': True,
                'direccion_id': direccion_id,
                'mensaje': 'Dirección creada exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al crear dirección'
            }), 500
            
    except Exception as e:
        print(f"Error en api_crear_direccion: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

#API pedidos
@bp.route('/mis-pedidos')
@login_required
def mis_pedidos():
    """Redirige a la sección de pedidos en cuenta"""
    return redirect(url_for('main.cuenta') + '#pedidos')


 
@bp.route('/api/mis-pedidos', methods=['GET'])
@login_required
def api_obtener_mis_pedidos():
    """API para obtener todos los pedidos del usuario"""
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
                'error': 'Error al obtener pedidos'
            }), 500
            
    except Exception as e:
        print(f"Error en api_obtener_mis_pedidos: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/pedidos', methods=['GET'])
@login_required
def api_pedidos_alias():
    """Alias para /api/mis-pedidos (compatibilidad)"""
    return api_obtener_mis_pedidos()



@bp.route('/api/orden/<int:orden_id>', methods=['GET'])
@login_required
def api_detalle_orden(orden_id):
    """
    Obtener detalle completo de una orden
    Verifica que la orden pertenezca al usuario actual
    """
    try:
        user_id = session.get('user_id')
        
        success_ordenes, ordenes = obtenerOrdenesPorUsuario(user_id)
        
        if not success_ordenes:
            return jsonify({
                'success': False,
                'error': 'Error al verificar orden'
            }), 500
        
        orden_valida = any(orden['id_orden'] == orden_id for orden in ordenes)
        
        if not orden_valida:
            return jsonify({
                'success': False,
                'error': 'Orden no encontrada o no autorizada'
            }), 403
        
        success_detalle, items = obtenerDetalleOrden(orden_id)
        success_factura, factura = obtenerFacturaPorOrden(orden_id)
        
        if success_detalle:
            return jsonify({
                'success': True,
                'items': items,
                'factura': factura if success_factura else None
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener detalle'
            }), 500
            
    except Exception as e:
        print(f"Error en api_detalle_orden: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

@bp.route("/prueba", methods=['GET', 'POST'])
def prueba():
    try:
        if request.method == "POST":
            proId = request.form.get("pi")
            can = request.form.get("can")
            value1, value = verificarStockDisponible(productoId=proId, cantidadSolicitada=can)
            return render_template("prueba.html", value=value, value1=value1)
    except Exception as e:
        print(f"Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        productos = []
    
    return render_template("prueba.html")


#API's ADMIN
@bp.route('/api/dashboard/resumen', methods=['GET'])
@admin_required
def api_dashboard_resumen():

    try:
        success, resumen = obtenerResumenDashboard()
        
        if success:
            return jsonify({
                'success': True,
                'resumen': resumen
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener resumen del dashboard'
            }), 500
            
    except Exception as e:
        print(f"Error en api_dashboard_resumen: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/ordenes-recientes', methods=['GET'])
@admin_required
def api_ordenes_recientes():
    try:
        limite = request.args.get('limite', 5, type=int)
        success, ordenes = obtenerOrdenesRecientes(limite)
        
        if success:
            return jsonify({
                'success': True,
                'ordenes': ordenes
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener órdenes recientes'
            }), 500
            
    except Exception as e:
        print(f"Error en api_ordenes_recientes: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/alertas-stock', methods=['GET'])
@admin_required
def api_alertas_stock():
    """
    Obtiene productos con stock bajo
    Query params: limite (default: 3)
    """
    try:
        limite = request.args.get('limite', 3, type=int)
        success, alertas = obtenerAlertasStockBajo(limite)
        
        if success:
            return jsonify({
                'success': True,
                'alertas': alertas
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener alertas de stock'
            }), 500
            
    except Exception as e:
        print(f"Error en api_alertas_stock: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/actividades-recientes', methods=['GET'])
@admin_required
def api_actividades_recientes():
    """
    Obtiene las actividades recientes del sistema
    Query params: limite (default: 10)
    """
    try:
        limite = request.args.get('limite', 10, type=int)
        success, actividades = obtenerActividadesRecientes(limite)
        
        if success:
            return jsonify({
                'success': True,
                'actividades': actividades
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener actividades recientes'
            }), 500
            
    except Exception as e:
        print(f"Error en api_actividades_recientes: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/ordenes-dia', methods=['GET'])
@admin_required
def api_ordenes_dia():
    """
    Obtiene el total de órdenes del día
    Query params: fecha (formato: YYYY-MM-DD, opcional)
    """
    try:
        fecha_str = request.args.get('fecha')
        fecha = None
        
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
        
        success, resultado = obtenerOrdenesDia(fecha)
        
        if success:
            return jsonify({
                'success': True,
                'resultado': resultado
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener órdenes del día'
            }), 500
            
    except Exception as e:
        print(f"Error en api_ordenes_dia: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/ventas-dia', methods=['GET'])
@admin_required
def api_ventas_dia():
    """
    Obtiene el total de ventas del día
    Query params: fecha (formato: YYYY-MM-DD, opcional)
    """
    try:
        fecha_str = request.args.get('fecha')
        fecha = None
        
        if fecha_str:
            from datetime import datetime
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d')
        
        success, resultado = obtenerVentasDia(fecha)
        
        if success:
            return jsonify({
                'success': True,
                'resultado': resultado
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener ventas del día'
            }), 500
            
    except Exception as e:
        print(f"Error en api_ventas_dia: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/dashboard/completo', methods=['GET'])
@admin_required
def api_dashboard_completo():
    """
    Obtiene todos los datos del dashboard en una sola llamada
    Para reducir requests desde el frontend
    """
    try:
        # Resumen principal
        success_resumen, resumen = obtenerResumenDashboard()
        
        # Órdenes recientes
        success_ordenes, ordenes = obtenerOrdenesRecientes(5)
        
        # Alertas de stock
        success_alertas, alertas = obtenerAlertasStockBajo(3)
        
        # Actividades recientes
        success_actividades, actividades = obtenerActividadesRecientes(10)
        
        return jsonify({
            'success': True,
            'resumen': resumen if success_resumen else {},
            'ordenes_recientes': ordenes if success_ordenes else [],
            'alertas_stock': alertas if success_alertas else [],
            'actividades_recientes': actividades if success_actividades else []
        })
        
    except Exception as e:
        print(f"Error en api_dashboard_completo: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

@bp.route('/api/inventario/productos', methods=['GET'])
@admin_required
def api_inventario_productos():
    success, productos = obtenerDetallesInventario()
    return jsonify({
        'success': success,
        'productos': productos
    })


@bp.route('/api/inventario/agregar-stock', methods=['POST'])
@admin_required
def api_agregar_stock():
    try:
        data = request.get_json()
        producto_id = data.get('producto_id')
        bodega_id = data.get('bodega_id')
        cantidad = data.get('cantidad')

        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_ENTRADAS.CREAR", 
                        [producto_id, bodega_id, cantidad, session.get('user_id')])
        connection.commit()
        
        return jsonify({'success': True, 'mensaje': 'Stock registrado mediante entrada'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/api/inventario/actualizar-stock', methods=['PUT'])
@admin_required
def api_actualizar_stock():
    """
    Actualiza información de stock de un producto
    """
    try:
        from .database.sp.pa import PKG_STOCK  # Necesitarás importar esto
        
        data = request.get_json()
        
        producto_id = data.get('producto_id')
        bodega_id = data.get('bodega_id')
        cantidad_disponible = data.get('cantidad_disponible')
        cantidad_reservada = data.get('cantidad_reservada')
        cantidad_alerta = data.get('cantidad_alerta')
        
        # Aquí llamarías a tus procedimientos almacenados
        # Por ejemplo: PKG_STOCK.ACTUALIZAR_CANT(...)
        
        return jsonify({
            'success': True,
            'mensaje': 'Stock actualizado correctamente'
        })
        
    except Exception as e:
        print(f"Error en api_actualizar_stock: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/productos', methods=['GET'])
@admin_required
def api_productos_lista():
    """
    Obtiene lista simplificada de productos para selects
    """
    try:
        from .database.sp.pa import obtenerProductos
        
        success, productos = obtenerProductos()
        
        if success:
            return jsonify({
                'success': True,
                'productos': productos
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener productos'
            }), 500
            
    except Exception as e:
        print(f"Error en api_productos_lista: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/bodegas', methods=['GET'])
@admin_required
def api_bodegas_lista():
    success, bodegas = obtenerBodegas()
    return jsonify({
        'success': success,
        'bodegas': bodegas
    })


# ============================================
# API: ROLES Y PERMISOS
# ============================================

@bp.route('/api/roles', methods=['GET'])
@admin_required
def api_obtener_roles():
    """
    Obtiene todos los roles del sistema
    """
    try:
        # Aquí deberías tener un procedimiento para obtener roles
        # Por ejemplo desde tu paquete PKG_GESTION_ROLES
        
        # Datos de ejemplo (reemplazar con llamada a BD)
        roles = [
            {
                'id': 1,
                'nombre': 'Administrador',
                'descripcion': 'Acceso completo al sistema',
                'usuarios_asignados': 3,
                'fecha_creacion': '2024-01-15'
            },
            {
                'id': 2,
                'nombre': 'Gerente',
                'descripcion': 'Gestión de productos y ventas',
                'usuarios_asignados': 5,
                'fecha_creacion': '2024-02-20'
            }
        ]
        
        return jsonify({
            'success': True,
            'roles': roles
        })
        
    except Exception as e:
        print(f"Error en api_obtener_roles: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/roles/crear', methods=['POST'])
@admin_required
def api_crear_rol():
    """
    Crea un nuevo rol
    """
    try:
        data = request.get_json()
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        permisos = data.get('permisos', [])
        
        # Aquí llamarías a tu procedimiento almacenado para crear rol
        
        return jsonify({
            'success': True,
            'mensaje': 'Rol creado correctamente'
        })
        
    except Exception as e:
        print(f"Error en api_crear_rol: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/roles/actualizar', methods=['POST'])
@admin_required
def api_actualizar_rol():
    """
    Actualiza un rol existente
    """
    try:
        data = request.get_json()
        
        rol_id = data.get('id')
        nombre = data.get('nombre')
        descripcion = data.get('descripcion')
        permisos = data.get('permisos', [])
        
        # Aquí llamarías a tu procedimiento almacenado
        
        return jsonify({
            'success': True,
            'mensaje': 'Rol actualizado correctamente'
        })
        
    except Exception as e:
        print(f"Error en api_actualizar_rol: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/roles/<int:rol_id>', methods=['DELETE'])
@admin_required
def api_eliminar_rol(rol_id):
    """
    Elimina un rol
    """
    try:
        # Aquí llamarías a tu procedimiento almacenado
        
        return jsonify({
            'success': True,
            'mensaje': 'Rol eliminado correctamente'
        })
        
    except Exception as e:
        print(f"Error en api_eliminar_rol: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/usuarios', methods=['GET'])
@admin_required
def api_usuarios_lista():
    """
    Obtiene lista de usuarios
    """
    try:
        from .database.sp.pa import obtenerUsuarios
        
        success, usuarios = obtenerUsuarios()
        
        if success:
            return jsonify({
                'success': True,
                'usuarios': usuarios
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener usuarios'
            }), 500
            
    except Exception as e:
        print(f"Error en api_usuarios_lista: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/usuarios-con-roles', methods=['GET'])
@admin_required
def api_usuarios_con_roles():
    try:
        
        success, usuarios = obtenerUsuarios()
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Error al obtener usuarios'
            }), 500
        
        # Obtener roles para cada usuario
        for usuario in usuarios:
            success_roles, roles = obtenerRolesUsuarios(usuario['id'])
            usuario['roles'] = roles if success_roles else []
        
        return jsonify({
            'success': True,
            'usuarios': usuarios
        })
        
    except Exception as e:
        print(f"Error en api_usuarios_con_roles: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/usuarios/<int:usuario_id>/roles', methods=['GET'])
@admin_required
def api_roles_usuario(usuario_id):
    """
    Obtiene los roles asignados a un usuario
    """
    try:
        
        success, roles = obtenerRolesUsuarios(usuario_id)
        
        if success:
            # Convertir lista de nombres a objetos con más info
            roles_detalle = [{'id': i+1, 'nombre': rol} for i, rol in enumerate(roles)]
            
            return jsonify({
                'success': True,
                'roles': roles_detalle
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al obtener roles del usuario'
            }), 500
            
    except Exception as e:
        print(f"Error en api_roles_usuario: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/usuarios/<int:usuario_id>/detalles', methods=['GET'])
@admin_required
def api_detalles_usuario(usuario_id):
    try:
        print(type(usuario_id))
        success_user, resultado = obtenerUsuarioXId(idUsuario=usuario_id)
        print(resultado)
        usuario = resultado[0] if isinstance(resultado, list) and len(resultado) > 0 else resultado
        print(usuario)
        if not success_user or not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        success_roles, roles = obtenerRolesUsuarios(usuario_id)
        print(roles)
        usuario['roles'] = roles if success_roles else []
        
        return jsonify({
            'success': True,
            'usuario': usuario
        })
        
    except Exception as e:
        print(f"Error crítico en api_detalles_usuario: {e}")
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500


@bp.route('/api/usuarios/cambiar-estado', methods=['POST'])
@admin_required
def api_cambiar_estado_usuario():
    try:
        data = request.get_json()
        usuario_id = data.get('usuarioId')
        # Convertimos a int para asegurar que sea 0 o 1 según el CONSTRAINT chk_usuarios_activo
        nuevo_estado = 1 if data.get('activo') else 0 

        if usuario_id is None:
            return jsonify({
                'success': False,
                'error': 'ID de usuario no proporcionado'
            }), 400

        success, message = cambiarEstadoUsuario(usuario_id, nuevo_estado)

        if success:
            return jsonify({
                'success': True,
                'mensaje': message
            })
        else:
            return jsonify({
                'success': False,
                'error': message
            }), 500

    except Exception as e:
        print(f"Error en api_cambiar_estado_usuario: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/api/roles/asignar', methods=['POST'])
@admin_required
def api_asignar_rol():
    """
    Asigna un rol a un usuario
    """
    try:
        from .database.sp.pa import asignarRolUsuario
        
        data = request.get_json()
        user_id = session.get('user_id')  # Usuario que asigna
        
        usuario_id = data.get('usuario_id')
        rol_id = data.get('rol_id')
        
        if not usuario_id or not rol_id:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = asignarRolUsuario(usuario_id, rol_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'mensaje': 'Rol asignado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al asignar rol'
            }), 500
            
    except Exception as e:
        print(f"Error en api_asignar_rol: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/roles/revocar', methods=['POST'])
@admin_required
def api_revocar_rol():
    """
    Revoca un rol de un usuario
    """
    try:
        from .database.sp.pa import revocarRolUsuario
        
        data = request.get_json()
        user_id = session.get('user_id')  # Usuario que revoca
        
        usuario_id = data.get('usuarioId')
        rol_id = data.get('rolId')
        
        if not usuario_id or not rol_id:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400
        
        success = revocarRolUsuario(usuario_id, rol_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'mensaje': 'Rol revocado correctamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error al revocar rol'
            }), 500
            
    except Exception as e:
        print(f"Error en api_revocar_rol: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bp.route('/api/roles/estadisticas', methods=['GET'])
@admin_required
def api_roles_estadisticas():
    """
    Obtiene estadísticas de roles
    """
    try:
        # Aquí calcularías las estadísticas reales
        # Por ahora datos de ejemplo
        
        estadisticas = {
            'total_roles': 5,
            'usuarios_con_roles': 15,
            'administradores': 3,
            'cambios_hoy': 2
        }
        
        return jsonify({
            'success': True,
            **estadisticas
        })
        
    except Exception as e:
        print(f"Error en api_roles_estadisticas: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@bp.app_context_processor
def inject_user():
    return {
        'current_user' : get_current_user(),
        'is_authenticated' : is_authenticated(),
        'has_role' : has_role,
        'has_any_role' : has_any_role,
        'is_admin' : is_admin()
    }

