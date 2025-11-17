from flask import Blueprint, render_template, request

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return render_template('home.html')

@bp.route('/tienda')
def tienda():
    return render_template('tienda.html')

@bp.route('/mujer')
def mujer():
    return render_template('mujer.html')

@bp.route('/hombre')
def hombre():
    return render_template('hombres.html')
