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