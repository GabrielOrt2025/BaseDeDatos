from flask import Blueprint, jsonify, render_template, request, session, flash, redirect, url_for, current_app
from .database.sp.pa import *
from .auth import (
    login_required, guest_only, login_user, logout_user, 
    get_current_user, is_authenticated, register_user
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
    return render_template("tienda/mujer.html")

@bp.route("/tienda/hombres")
def hombre():
    hombres = []
    return render_template("tienda/hombres.html")

@bp.route("/tienda/gorros")
def gorros():
    return render_template("tienda/gorro.html")

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
        'is_authenticated' : is_authenticated()
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