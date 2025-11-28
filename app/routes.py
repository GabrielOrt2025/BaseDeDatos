from flask import Blueprint,jsonify,render_template,request,session,flash,redirect,url_for,current_app
from .database.sp.pa import *
import smtplib
from email.message import EmailMessage

bp = Blueprint("main", __name__)

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
    productos = obtenerDetallesProducto()
    return render_template("tienda/tienda.html", productos=productos)

@bp.route("/tienda/mujer")
def mujer():
    return render_template("tienda/mujer.html")

@bp.route("/tienda/hombres")
def hombre():
    hombres = []
    return render_template("tienda/hombres.html")

@bp.route("/tienda/gorros")
def gorros():
    return render_template("tienda/gorro.html")

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


@bp.route('/api/obtenerDatos', methods=['GET'])
def enviarTopCategoria5():
    success_h, hombre = obtenerTopProductosCateogria(idCategoria=2)
    success_m, mujeres = obtenerTopProductosCateogria(idCategoria=1)
    success_g, gorros = obtenerTopProductosCateogria(idCategoria=3)

    # Función para convertir URLs de BD a URLs correctas usando url_for
    def procesar_productos(productos):
        if not productos:
            return []
        for prod in productos:
            if 'url' in prod and prod['url']:
                # La URL de BD está en formato: /img/PJM-M/IMG-...jpg
                # Necesitamos convertirla a formato que url_for genere
                img_path = prod['url'].lstrip('/')
                prod['url'] = url_for('static', filename=img_path)
        return productos

    return jsonify({
        'hombre': procesar_productos(hombre if success_h else []),
        'mujer': procesar_productos(mujeres if success_m else []),
        'gorro': procesar_productos(gorros if success_g else [])
    })