from ..conexionDB import get_db_connection
import oracledb
import traceback

def agregarItemCarrito(usuarioId, productoId, cantidad, precio):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_AGREGAR_ITEM",
            [usuarioId, productoId, cantidad, precio]
        )

        connection.commit()
        return True, "Producto agregado con exito"
    except Exception as e:
        print(f"Erro en agregarItemCarrito => {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerCarrito(usuarioId):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        ref_cursor = connection.cursor()
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_LEER",
            [usuarioId, ref_cursor]
        )

        items = []
        for r in ref_cursor:
            item = {
                'item_carrito_id': r[0],
                'producto_id': r[1],
                'producto_nombre': r[2],
                'sku': r[3],
                'cantidad': r[4],
                'precio_unitario': float(r[5]) if r[5] else 0.0,
                'subtotal': float(r[6]) if r[6] else 0.0,
                'categoria': r[7],
                'imagen_url': r[8]
            }
            items.append(item)
        return True, items
    except Exception as e:
        print(f"Error en obtenerCarrito: {e}")
        traceback.format_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def actualizarCantidadItem(usuarioId, productoId, cantidad):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor
        cursor.callproc(
                "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_ACTUALIZAR_CANTIDAD",
                [usuarioId, productoId, cantidad]
            )
        connection.commit()
        return True, "Cantidad actualizada exitosamente"
    except Exception as e:
        print(f"Error en actualizarCantidadItem {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def eliminarItemCarrito(usuarioId, productoId):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_ELIMINAR_ITEM",
            [usuarioId, productoId]
        )

        connection.commit()
        return True, "Item eliminado exitosamente"
    except Exception as e:
        print(f"Error en eliminarItemCarrito: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def vaciarCarrito(usuarioId):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_VACIAR",
            [usuarioId]
        )
        
        connection.commit()
        return True, "Carrito vaciado exitosamente"
        
    except Exception as e:
        print(f"Error en vaciarCarrito: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def calcularTotalCarrito(usuarioId):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        total = cursor.var(oracledb.NUMBER)

        cursor.callfunc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.FN_CARRITO_CALCULAR_TOTAL",
            oracledb.NUMBER, [usuarioId]
        )

        total = cursor.fetchone()[0]
        total = float(total) if total else 0.0

        return True, total
    except Exception as e:
        print(f"Error en calcularTotalCarrito: {e}")
        traceback.print_exc()
        return False, 0.0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def contarItemsCarrito(usuarioId):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        count = cursor.callfunc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.FN_CARRITO_CONTAR_ITEMS",
            oracledb.NUMBER, [usuarioId]
        )
        count = int(count) if count else 0
        return True, count
    except Exception as e:
        print(f"Error en contarItemsCarrito: {e}")
        traceback.print_exc()
        return False, 0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()