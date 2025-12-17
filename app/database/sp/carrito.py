from ..conexionDB import get_db_connection
import oracledb
import traceback

def verificarStockDisponible(productoId, cantidadSolicitada):
    """
    Verifica si hay stock disponible para un producto
    Retorna: (bool, int) - (tiene_stock, stock_disponible)
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        tiene_stock_out = cursor.var(int)
        stock_total = cursor.callfunc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_VERIFICAR_STOCK_DISPONIBLE',
            int, [productoId, cantidadSolicitada, tiene_stock_out]
        )
        
        tiene_stock_bool = (tiene_stock_out.getvalue() == 1)
        
        return tiene_stock_bool, stock_total
        
    except Exception as e:
        print(f"Error en verificarStockDisponible: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def agregarItemCarrito(usuarioId, productoId, cantidad, precio):
    connection = None
    cursor = None
    try:
        # Verificar stock disponible
        tiene_stock, stock_disponible = verificarStockDisponible(productoId, cantidad)
        
        if not tiene_stock:
            return False, f"Stock insuficiente. Solo hay {stock_disponible} unidades disponibles."
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_AGREGAR_ITEM",
            [usuarioId, productoId, cantidad, precio]
        )
        connection.commit()
        return True, "Producto agregado con éxito"
    except Exception as e:
        print(f"Error en agregarItemCarrito => {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerCarrito(usuarioId):
    """
    Obtiene todos los items del carrito del usuario
    """
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
        traceback.print_exc()
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
        # Verificar stock disponible antes de actualizar
        tiene_stock, stock_disponible = verificarStockDisponible(productoId, cantidad)
        
        if not tiene_stock:
            return False, f"Stock insuficiente. Solo hay {stock_disponible} unidades disponibles."
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_ACTUALIZAR_CANTIDAD",
            [usuarioId, productoId, cantidad]
        )
        connection.commit()
        return True, "Cantidad actualizada exitosamente"
    except Exception as e:
        print(f"Error en actualizarCantidadItem: {e}")
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
        cantidadEliminada = cursor.var(oracledb.NUMBER)
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_CARRITO_ELIMINAR_ITEM",
            [usuarioId, productoId, cantidadEliminada]
        )

        connection.commit()
        return True, "Item eliminado exitosamente", cantidadEliminada.getvalue()
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
    """
    Calcula el total del carrito del usuario
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        

        total = cursor.callfunc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.FN_CARRITO_CALCULAR_TOTAL",
            oracledb.NUMBER,
            [usuarioId]
        )
        
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
    """
    Cuenta el número total de items en el carrito
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        count = cursor.callfunc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.FN_CARRITO_CONTAR_ITEMS",
            oracledb.NUMBER,
            [usuarioId]
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


def obtenerStockProducto(productoId):
    """
    Obtiene el stock disponible total de un producto
    """
    tiene_stock, stock_disponible = verificarStockDisponible(productoId, 0)
    return True, stock_disponible


def reservar_producto(productoId, cantidad):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        resultado = cursor.var(oracledb.STRING)
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_ACTUALIZAR_CANTIDAD_RESERVADA", 
                        [productoId, 2, cantidad, resultado])
        
        estado = resultado.getvalue()

        if estado == 'EXITOSO':
            return True, estado
        else:
            return False, estado
    except Exception as e:
        print(f"Error en contarItemsCarrito: {e}")
        traceback.print_exc()
        return False, 0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def liberar_cantidad_reservada(productoId, cantidad):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        resultado = cursor.var(oracledb.STRING)

        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_CARRITO.SP_LIBERAR_CANTIDAD_RESERVADA", 
                        [productoId, 2, cantidad, resultado])
        estado = resultado.getvalue()

        if estado == 'EXITOSO':
            return True, estado
        else:
            return False, estado
    except Exception as e:
        print(f"Error en contarItemsCarrito: {e}")
        traceback.print_exc()
        return False, 0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
    