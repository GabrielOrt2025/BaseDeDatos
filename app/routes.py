from flask import Blueprint, render_template, request

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return render_template('home.html')


@bp.route('/nosotros')
def nosotros():
    return render_template('nosotros.html')
@bp.route('/carrito')
def carrito():
    return render_template('carrito.html')

@bp.route('/cuenta')
def cuenta():
    return render_template('cuenta.html')
@bp.route('/tienda')
def tienda():
    return render_template('tienda.html')

@bp.route('/mujer')
def mujer():
    return render_template('mujer.html')

@bp.route('/hombre')
def hombre():
    return render_template('hombres.html')
