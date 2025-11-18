from app.database.conexionDB import get_db_connection
import oracledb

def obtenerProductos():
    connection = get_db_connection()
    if connection:
        cursor = connection.cursor()
        cursor.callproc('PKG_PRODUCTO.LEER')
        productos = cursor.fetchall()
        print(productos)

obtenerProductos()

