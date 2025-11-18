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
  try:
    connection = get_db_connection()
    cursor = connection.cursor()
    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_CATEGORIA.CREAR", [nombre, descripcion])
        connection.commit()
    cursor.close()
    connection.close()
    return True
  except Exception as e:
      print(f"Error en el proceso almacenado => \n{e}" )
      cursor.close()
      connection.close()
      return False 


#AQUI EMPIEZAN LOS MIOS 
def registrarIngresos(SUCURSAL_ID, DESCRIPCION, MONTO, FECHA_RECIBIDO, REGISTRADO_POR, TIPO ):
 try:
    connection = get_db_connection()
    cursor = connection.cursor()
    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.INGRESOS_PKG.SP_REGISTRAR_INGRESO", [SUCURSAL_ID, DESCRIPCION, MONTO, FECHA_RECIBIDO, REGISTRADO_POR, TIPO])
        connection.commit()
    cursor.close()
    connection.close()
    return True
 except Exception as e:
     print(f"Error en el proceso almacenado => \n{e}" )
     cursor.close()
     connection.close()
     return False
 
 
#JOSE QUE CARRITO MAS FEO 
def obtenerPorFecha():
    connection = get_db_connection()
    cursor = connection.cursor()
    finanzas_cursor = cursor.var(oracledb.CURSOR)
    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.INGRESOS_PKG.SP_INGRESO_LEER_POR_FECHA", [finanzas_cursor])
        resultado = finanzas_cursor.getvalue()
        finanzaFecha = []
        for r in resultado:
            finanza = {
                'FECHA_INICIO' : r[0],
                'FECHA_FIN' : r[1],
                'INGRESOS' : r[2]
            }
            finanzaFecha.append(finanza)
        print(finanzaFecha)
    cursor.close()
    connection.close()



def crearFactura(USUARIO_ID, ORDEN_ID, MONTO_TOTAL, DESCUENTOS, CUPON_ID, CANAL_ID, SUCURSAL_ID, ESTADO, ID_FACTURA):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        if connection:
            cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_CREAR", [USUARIO_ID, ORDEN_ID, MONTO_TOTAL, DESCUENTOS, CUPON_ID, CANAL_ID, SUCURSAL_ID, ESTADO, ID_FACTURA])
            connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as e:
         print(f"Error en el proceso almacenado => \n{e}" )
         cursor.close()
         connection.close()
         return False
    

def obtenerFechaFactura():
    connection = get_db_connection()
    cursor = connection.cursor()
    factura_cursor = cursor.var(oracledb.CURSOR)

    if connection:
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_LEER_POR_FECHA", [factura_cursor])
        resultado = factura_cursor.getvalue()
        facturas = []
        for r in resultado:
            factura = {
                'FECHA_INICIO' : r[0],
                'FECHA_FIN' : r[1],
                'FACTURAS' : r[2]
            }
            facturas.append(factura)
        print(facturas)
    cursor.close()
    connection.close()


def actualizarEstadoFactura(FACTURA_ID, NUEVO_ESTADO):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        if connection:
            cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_ACTUALIZAR_ESTADO", [FACTURA_ID, NUEVO_ESTADO])
            connection.commit()
        cursor.close()
        connection.close()
        return True
    except Exception as e:
         print(f"Error en el proceso almacenado => \n{e}" )
         cursor.close()
         connection.close()
         return False
   









