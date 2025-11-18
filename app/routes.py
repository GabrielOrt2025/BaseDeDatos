<<<<<<< Updated upstream
from flask import Blueprint,jsonify,render_template,request,session,flash,redirect,url_for,current_app,
=======
from flask import Blueprint,jsonify,render_template,request,session,flash,redirect,url_for,current_app
>>>>>>> Stashed changes

import smtplib
from email.message import EmailMessage

from .database.conexionDB import obtenerProductos

bp = Blueprint("main", __name__)

# =========================
# RUTAS NORMALES
# =========================

<<<<<<< Updated upstream
@bp.route("/")
=======
@bp.route("/")  
>>>>>>> Stashed changes
def home():
    return render_template("home.html")

@bp.route("/nosotros")
def nosotros():
    return render_template("nosotros.html")

@bp.route("/carrito")
def carrito():
    return render_template("carrito.html")

@bp.route("/cuenta")
def cuenta():
    return render_template("cuenta.html")

@bp.route("/tienda")
def tienda():
    return render_template("tienda.html")

@bp.route("/mujer")
def mujer():
    return render_template("mujer.html")

@bp.route("/hombres")
def hombre():
    return render_template("hombres.html")

@bp.route("/gorros")
def gorros():
    return render_template("gorros.html")

@bp.route("/prueba")
def prueba():
    value = obtenerProductos()
    return render_template("prueba.html", value=value)

@bp.route("/checkout")
def checkout():
    return render_template("checkout.html")


# =========================
# RUTA CONTACTO
# =========================

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

        cuerpo = f"""Nuevo mensaje desde Empijamadas:

Nombre: {nombre}
Email: {email}

Mensaje:
{mensaje}
"""

        msg = EmailMessage()
        msg["Subject"] = "Nuevo mensaje de contacto - Empijamadas"
        msg["From"] = email_user
        msg["To"] = email_to
        msg.set_content(cuerpo)

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
                smtp.login(email_user, email_pass)
                smtp.send_message(msg)

            flash("Gracias por escribirnos, pronto te respondemos.", "success")
        except Exception as e:
            # para debug en consola
            print("Error enviando correo:", e)
            flash("Hubo un error enviando tu mensaje. Intenta de nuevo mas tarde.", "error")

        return redirect(url_for("main.contacto"))

    # GET
    return render_template("contacto.html")
