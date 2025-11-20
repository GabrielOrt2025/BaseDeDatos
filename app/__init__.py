from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")

    # # *** OJO: SOLO PARA PRUEBAS LOCALES ***
    # app.config["EMAIL_USER"] = "conejiz1929@gmail.com"
    # app.config["EMAIL_PASS"] = "xxum pmkd bcxo rxol"
    # app.config["EMAIL_TO"] = app.config["EMAIL_USER"]

    # Inicializar el pool de Oracle solo si no está en modo de recarga
    from .database.conexionDB import init_oracle_pool
    try:
        init_oracle_pool()
    except Exception as e:
        print(f"Advertencia al inicializar pool: {e}")
        # En modo debug/recarga, el pool puede ya estar inicializado

    from .routes import bp as main_bp
    app.register_blueprint(main_bp)

    return app
