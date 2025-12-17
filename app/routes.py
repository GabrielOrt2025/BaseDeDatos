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



@bp.app_context_processor
def inject_user():
    return {
        'current_user' : get_current_user(),
        'is_authenticated' : is_authenticated(),
        'has_role' : has_role,
        'has_any_role' : has_any_role,
        'is_admin' : is_admin()
    }

