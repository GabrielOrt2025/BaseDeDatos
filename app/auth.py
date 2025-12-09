from functools import wraps
from flask import session, redirect, url_for, flash, request, abort
from werkzeug.security import check_password_hash, generate_password_hash
from .database.sp.pa import obtenerContraUsuario, crearUsuario, obtenerNombreUsuario, obtenerRolesUsuarios


# ============================================
# DECORADORES de autenticacion
# ============================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Por favor inicia sesión para acceder a esta página.', 'warning')
            return redirect(url_for('main.login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def guest_only(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' in session:
            flash('Ya tienes una sesión activa.', 'info')
            return redirect(url_for('main.home'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================
# DECORADORES de roles
# ============================================
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                flash('Por favor inicia sesion para acceder a esta pagina.', 'warning')
                return redirect(url_for('main.login', next=request.url))
            user_roles = get_user_roles()

            has_required_role = any(role.lower() in [r.lower() for r in user_roles] for role in roles)

            if not has_required_role:
                flash('No tiene permisos suficientes para acceder a esta pagina', 'error')
                return abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        
        if 'user_id' not in session:
            flash('Por favor inicia sesion para acceder a esta pagina.', 'warning')
            return redirect(url_for('main.login', next=request.url))
        
        if not is_admin():
            flash('Esta pagina es solo para administradores.', 'error')
            return abort(403)
        
        return f(*args, **kwargs)
    return decorated_function
        
# ============================================
# FUNCIONES DE AUTENTICACIÓN
# ============================================

def login_user(email, password):
    try:
        result = obtenerContraUsuario(email)
        if not isinstance(result, tuple) or len(result) != 2:
            return False, 'Error en la estructura de respuesta.', None
        
        success, info_user = result
        if not success:
            return False, 'Error al conectar con la base de datos.', None
        
        if not info_user or len(info_user) == 0:
            return False, 'Email o contraseña incorrectos.', None
        
        user_info = info_user[0]        
        password_hash = user_info.get('passHash')
        user_id = user_info.get('idUser')        

        if not password_hash or not user_id:
            return False, 'Error en los datos del usuario.', None
        
        is_valid = check_password_hash(password_hash, password)
        
        if not is_valid:
            return False, 'Email o contraseña incorrectos.', None
        
        success_name, user_name = obtenerNombreUsuario(user_id)
        if not success_name:
            user_name = "Usuario"  # Valor por defecto
        
        session['user_id'] = user_id
        session['user_email'] = email
        session['user_name'] = user_name
        session.permanent = True
        
        success_roles, user_roles = obtenerRolesUsuarios(user_id)
        
        if success_roles:
            session['user_roles'] = user_roles
        else:
            session['user_roles'] = []
        
        user_data = {
            'user_id': user_id,
            'email': email,
            'nombre': user_name
        }
        
        return True, 'Inicio de sesión exitoso.', user_data
        
    except Exception as e:
        print(f"Error CRÍTICO en login_user: {e}")
        import traceback
        traceback.print_exc()
        return False, 'Error al iniciar sesión. Intenta nuevamente.', None


def logout_user():
    session.clear()
    flash('Has cerrado sesión exitosamente.', 'success')


def register_user(email, password, nombre):
    try:
        password_hash = generate_password_hash(password)
        success = crearUsuario(email, password_hash, nombre)
        
        if success:
            return True, 'Usuario registrado exitosamente. Por favor inicia sesión.'
        else:
            return False, 'Error al registrar usuario. El email podría estar en uso.'
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return False, 'Error al registrar usuario. Intenta nuevamente.'


def get_current_user():
    if 'user_id' not in session:
        return None
    
    return {
        'user_id': session.get('user_id'),
        'email': session.get('user_email'),
        'nombre' : session.get('user_name')
    }


def is_authenticated():
    return 'user_id' in session

def get_user_id():
    return session.get('user_id')


def get_user_email():
    return session.get('user_email')


def update_session_email(new_email):
    if is_authenticated():
        session['user_email'] = new_email


# ========================================
# Funciones roles
# ========================================

def get_user_roles():

    return session.get('user_roles', [])


def has_role(role_name):
    if not is_authenticated():
        return False
    
    user_roles = get_user_roles()
    return role_name.lower() in [role.lower() for role in user_roles]


def has_any_role(*roles):
    if not is_authenticated():
        return False
    
    user_roles = [role.lower() for role in get_user_roles()]
    return any(role.lower() in user_roles for role in roles)


def is_admin():
    return has_role('administrador')


def refresh_user_roles():
    if not is_authenticated():
        return False
    
    try:
        user_id = get_user_id()
        
        success, user_roles = obtenerRolesUsuarios(user_id)

        if success:
            print(f"✅ Guardando roles en sesión: {user_roles}")
            session['user_roles'] = user_roles
            session.modified = True
            return True
        else:
            return False
    except Exception as e:
        import traceback
        traceback.print_exc()
        return False