from functools import wraps
from flask import session, redirect, url_for, flash, request
from werkzeug.security import check_password_hash, generate_password_hash
from .database.sp.pa import obtenerContraUsuario, crearUsuario, obtenerNombreUsuario


# ============================================
# DECORADORES
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
# FUNCIONES DE AUTENTICACIÓN
# ============================================

def login_user(email, password):
    try:
        print(f"🔍 Intentando login para: {email}")
        
        result = obtenerContraUsuario(email)
        print(f"🔍 Resultado de obtenerContraUsuario: {type(result)}, Contenido: {result}")

        if not isinstance(result, tuple) or len(result) != 2:
            return False, 'Error en la estructura de respuesta.', None
        
        success, info_user = result
        print(f"🔍 success={success}, info_user={info_user}")

        if not success:
            print(f"❌ La consulta no fue exitosa")
            return False, 'Error al conectar con la base de datos.', None
        
        if not info_user or len(info_user) == 0:
            print(f"❌ Usuario no encontrado: {email}")
            return False, 'Email o contraseña incorrectos.', None
        
        user_info = info_user[0]
        print(f"🔍 user_info: {user_info}")
        
        password_hash = user_info.get('passHash')
        user_id = user_info.get('idUser')
        print(f"🔍 password_hash: {password_hash[:50] if password_hash else None}...")
        print(f"🔍 user_id: {user_id}")
        

        if not password_hash or not user_id:
            print(f"Faltan datos: password_hash={bool(password_hash)}, user_id={bool(user_id)}")
            return False, 'Error en los datos del usuario.', None
        
        print(f"🔍 Verificando contraseña...")
        is_valid = check_password_hash(password_hash, password)
        print(f"🔍 Contraseña válida: {is_valid}")
        
        if not is_valid:
            print(f"❌ Contraseña incorrecta para {email}")
            return False, 'Email o contraseña incorrectos.', None
        
        # ✅ Contraseña correcta - Obtener nombre del usuario
        print(f"✅ Contraseña válida, obteniendo nombre...")
        success_name, user_name = obtenerNombreUsuario(user_id)
        if not success_name:
            user_name = "Usuario"  # Valor por defecto
        
        print(f"✅ Login exitoso para user_id={user_id}, nombre={user_name}")
        session['user_id'] = user_id
        session['user_email'] = email
        session['user_name'] = user_name
        session.permanent = True
        
        user_data = {
            'user_id': user_id,
            'email': email,
            'nombre': user_name
        }
        
        return True, 'Inicio de sesión exitoso.', user_data
        
    except Exception as e:
        print(f"❌ Error CRÍTICO en login_user: {e}")
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
        print(f"❌ Error en register_user: {e}")
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


# ============================================
# FUNCIONES AUXILIARES (Opcionales)
# ============================================

def get_user_id():
    return session.get('user_id')


def get_user_email():
    return session.get('user_email')


def update_session_email(new_email):
    if is_authenticated():
        session['user_email'] = new_email