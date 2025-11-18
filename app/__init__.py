from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    # *** OJO: SOLO PARA PRUEBAS LOCALES ***
    # correo desde el que se enviaran los mensajes
    app.config["EMAIL_USER"] = "conejiz1929@gmail.com"  # pon aqui tu correo completo
    # contraseña o app password de ese correo
    app.config["EMAIL_PASS"] = "xxum pmkd bcxo rxol"
    # a donde quieres recibir los mensajes (puede ser el mismo)
    app.config["EMAIL_TO"] = app.config["EMAIL_USER"]

    from .routes import bp as main_bp
    app.register_blueprint(main_bp)

    return app
