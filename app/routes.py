from flask import Blueprint,jsonify,render_template,request,session,flash,redirect,url_for,current_app
from .database.sp.pa import *
import smtplib
from email.message import EmailMessage

bp = Blueprint("main", __name__)

@bp.route("/")  
def home():
    try:
        return render_template("home/home.html")
    except Exception as e:
        print(f"Error al obtner los productos: {e}") 
        return render_template("home/home.html", hombres=[], mujeres=[])
        

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
    return render_template("tienda/hombres.html")

@bp.route("/tienda/gorros")
def gorros():
    return render_template("tienda/gorros.html")

@bp.route("/prueba", methods=['GET'])
def prueba():
    try:
        # obtenerDetallesProducto devuelve (True/False, data)
        value = obtenerDetallesProducto()

        # obtenerTopProductosCateogria también devuelve (True/False, data)
        # success2, hombre = obtenerTopProductosCateogria(2)
        print(value)
    except Exception as e:
        print(f"Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        # value = []
        hombre = []

    return render_template("prueba.html", hombre=value)

@bp.route("/top5/<int:categoria_id>")
def top5(categoria_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ref_cursor = cursor.var(oracledb.CURSOR)
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_TOP5_PRODUCTOS_MAS_VENDIDOS",
                        [categoria_id, ref_cursor])
        rows = ref_cursor.getvalue()
        result = []
        for r in rows:
            result.append({
                "id_producto": r[0],
                "nombre": r[1],
                "precio_promedio": r[2],
                "url_imagen": r[3],
                "total_vendido": r[4]
            })
        return jsonify(result)
    finally:
        cursor.close()
        conn.close()