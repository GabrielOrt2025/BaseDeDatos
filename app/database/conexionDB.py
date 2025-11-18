import oracledb
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import Config

def get_db_connection():
    try:
        connection = oracledb.connect(
            user = Config.DATABASE_USER,
            password = Config.DATABASE_PASSWORD,
            dsn = Config.DATABASE_DNS
        )
        print("Conectado a Oracle correctamente ")
        return connection
    except Exception as e:
        print(f"Error al conectar con Oracle => \n {e}")


def obtenerProductos():
    connection = get_db_connection()
    cursor = connection.cursor()
    productos_cursor = cursor.var(oracledb.CURSOR)

    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_PRODUCTO.LEER_TODOS", [productos_cursor]) 
        resultado = productos_cursor.getvalue()
        productos = []
        for r in resultado:
            producto = {
                'id' : r[0],
                'sku' : r[1],
                'nombre' : r[2],
                'descripcion' : r[3],
                'categoria_id': r[4],
                'activo' : r[5]
            }
            productos.append(producto)
        print(productos)
    cursor.close()
    connection.close()

def crearProducto(sku, categoria_id, nombre, descripcion):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_PRODUCTO.CREAR", [sku, categoria_id, nombre, descripcion])
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error en el procedimiento 'crearProducto' => \n{e}")
        cursor.close()
        connection.close()
        return False

def crearCategoria(nombre, descripcion):
    connection = get_db_connection()
    cursor = connection.cursor()
    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_CATEGORIA.CREAR", [nombre, descripcion])
        connection.commit()
    cursor.close()
    connection.close()
    return True



# Procedimientos de gestion de usuarios
def crearUsuario(email, password_hash, nombre):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_CREAR", [email, password_hash, nombre])
        connection.commit()
        print(f"Usuario: '{nombre}' creado exitosamente")
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error en el procedimiento 'crearUsuario' => \n{e}")
        cursor.close()
        connection.close()
        return False


def obtenerContraUsuario(email):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        password_hash = cursor.var(oracledb.STRING)
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_OBTENER_PASS", [email, password_hash])
        resultado = password_hash.getvalue()
        cursor.close()
        connection.close()
        return resultado
    except Exception as e:
        print(f"Error en el procedimiento 'obtenerContraUsuario' => \n{e}")
        cursor.close()
        connection.close()
        return None


def actualizarPerfilUsuario(nombre, email, password_hash):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_ACTUALIZAR_PERFIL", [nombre, email, password_hash])
        connection.commit()
        print(f"Perfil de usuario: '{email}' actualizado exitosamente")
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error en el procedimiento 'actualizarPerfilUsuario' => \n{e}")
        cursor.close()
        connection.close()
        return False


def cambiarActividadUsuario(usuario_id, activo):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_ACTIVIDAD_USUARIO", [usuario_id, activo])
        connection.commit()
        estado = "activado" if activo == 1 else "desactivado"
        print(f"Usuario Id: {usuario_id} {estado} exitosamente")
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        print(f"Error en el procedimiento 'cambiarActividadUsuario' => \n{e}")
        cursor.close()
        connection.close()
        return False


def obtenerUsuarios():
    connection = get_db_connection()
    cursor = connection.cursor()
    usuarios_cursor = cursor.var(oracledb.CURSOR)
    
    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_OBTENER_USUARIOS", [usuarios_cursor])
        resultado = usuarios_cursor.getvalue()
        usuarios = []
        for r in resultado:
            usuario = {
                'id': r[0],
                'email': r[1],
                'nombre': r[2],
                'activo': r[3],
                'fecha_creacion': r[4]
            }
            usuarios.append(usuario)
        print(f"Se obtuvieron {len(usuarios)} usuarios")
    cursor.close()
    connection.close()
    return usuarios
