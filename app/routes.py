from flask import Blueprint,jsonify,render_template,request,session,flash,redirect,url_for,current_app
from .database.sp.pa import *
import smtplib
from email.message import EmailMessage

bp = Blueprint("main", __name__)

@bp.route("/")  
def home():
    return render_template("home/home.html")

@bp.route("/contacto", methods=["GET", "POST"])
def contacto():
    if request.method == "POST":
        nombre = request.form.get("nombre")
        email = request.form.get("email")
        mensaje = request.form.get("mensaje")

        # leer config de correo desde la app (definido en __init__.py)
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


@bp.route('/carrito')
def carrito():
    return render_template("pago/carrito.html")


@bp.route("/carrito/checkout")
def checkout():
    return render_template("pago/checkout.html")

@bp.route("/cuenta")
def cuenta():
    return render_template("personal/cuenta.html")

@bp.route("/tienda")
def tienda():
    return render_template("tienda/tienda.html")

@bp.route("/tienda/mujer")
def mujer():
    return render_template("tienda/mujer.html")

@bp.route("/tienda/hombres")
def hombre():
    return render_template("tienda/hombres.html")

@bp.route("/tienda/gorros")
def gorros():
    return render_template("tienda/gorros.html")

@bp.route("/prueba", methods=['GET', 'POST'])
def prueba():
    # Obtener todos los productos (tu código original)
    success, value = top5categoriaProducto(1)
    return render_template("prueba.html", value=value)
    # # Variable para almacenar los productos top 5
    # top5_productos = []
    
    # # Si es una petición POST para crear producto
    # if request.method == 'POST':
    #     # Verificar si se está creando un producto
    #     if 'sku' in request.form:
    #         sku = request.form.get('sku')
    #         id_c = request.form.get('id_c')
    #         nombre = request.form.get('nombre')
    #         activo = request.form.get('activo')
    #         check = crearProducto(sku=sku, categoria_id=id_c, nombre=nombre, descripcion='')
    #         if check:
    #             print(f"Agregado el producto {nombre}")
        
    #     # Verificar si se está consultando el top 5 por categoría
    #     elif 'categoria_id' in request.form:
    #         categoria_id = request.form.get('categoria_id')
    #         try:
    #             categoria_id = int(categoria_id)
    #             success_top5, top5_productos = top5categoriaProducto(categoria_id)
                
    #             if success_top5:
    #                 print(f"Se obtuvieron {len(top5_productos)} productos top 5")
    #             else:
    #                 print("Error al obtener el top 5 de productos")
    #                 flash("Error al consultar los productos top 5", "error")
    #         except ValueError:
    #             print("ID de categoría inválido")
    #             flash("ID de categoría inválido", "error")
    
    # return render_template("prueba.html", value=value, top5_productos=top5_productos)


# O si prefieres una ruta separada para el top 5 (RECOMENDADO):
@bp.route("/prueba/top5/<int:categoria_id>", methods=['GET'])
def prueba_top5(categoria_id):
    success, productos = top5categoriaProducto(categoria_id)
    
    if success:
        return jsonify({
            'success': True,
            'data': productos,
            'total': len(productos)
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Error al obtener los productos top 5'
        }), 500


# O con parámetro de query (otra opción):
@bp.route("/prueba/top5", methods=['GET'])
def prueba_top5_query():
    categoria_id = request.args.get('categoria_id', type=int)
    
    if not categoria_id:
        return jsonify({
            'success': False,
            'message': 'Se requiere el parámetro categoria_id'
        }), 400
    
    success, productos = top5categoriaProducto(categoria_id)
    
    if success:
        return jsonify({
            'success': True,
            'data': productos,
            'total': len(productos)
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': 'Error al obtener los productos top 5'
        }), 500


@bp.route("/base")
def base():
    return render_template("layout/base.html")