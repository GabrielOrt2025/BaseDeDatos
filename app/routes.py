from flask import Blueprint, render_template, request

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return render_template('home.html')

@bp.route('/carrito')
def carrito():
    return render_template('carrito.html')

@bp.route('/cuenta')
def cuenta():
    return render_template('cuenta.html')