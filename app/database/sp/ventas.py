from ..conexionDB import get_db_connection
import oracledb
import traceback


def crearOrdenDesdeCarrito(usuario_id, sucursal_id, direccion_envio_id, metodo_pago, notas=""):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        orden_id_var = cursor.var(oracledb.NUMBER)
        numero_orden_var = cursor.var(oracledb.STRING)
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_VENTAS.SP_ORDEN_CREAR_DESDE_CARRITO",
            [
                usuario_id,
                sucursal_id,
                direccion_envio_id,
                metodo_pago,
                notas,
                orden_id_var,
                numero_orden_var
            ]
        )
        
        orden_id = orden_id_var.getvalue()
        numero_orden = numero_orden_var.getvalue()        
        return True, {
            'orden_id': orden_id,
            'numero_orden': numero_orden,
            'mensaje': 'Orden creada exitosamente'
        }
    except Exception as e:
        print(f"Error en crearOrdenDesdeCarrito: {e}")
        traceback.print_exc()
        return False, {'error': str(e)}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def actualizarEstadoOrden(orden_id, nuevo_estado):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_VENTAS.SP_ORDEN_ACTUALIZAR_ESTADO",
            [orden_id, nuevo_estado]
        )
        connection.commit()
        print(f"Estado de orden {orden_id} actualizado a: {nuevo_estado}")
        return True, "Estado actualizado exitosamente"
    except Exception as e:
        print(f"Error en actualizarEstadoOrden: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerOrdenesPorUsuario(usuario_id):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_VENTAS.SP_ORDEN_LEER_POR_USUARIO",
            [usuario_id, ref_cursor]
        )
        ordenes = []
        for row in ref_cursor:
            orden = {
                'id_orden': row[0],
                'numero_orden': row[1],
                'estado': row[2],
                'subtotal': float(row[3]) if row[3] else 0.0,
                'total': float(row[4]) if row[4] else 0.0,
                'metodo_pago': row[5],
                'fecha_orden': row[6],
                'fecha_completado': row[7],
                'sucursal': row[8],
                'numero_factura': row[9]
            }
            ordenes.append(orden)
        return True, ordenes
        
    except Exception as e:
        print(f"Error en obtenerOrdenesPorUsuario: {e}")
        traceback.print_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerDetalleOrden(orden_id):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_VENTAS.SP_ORDEN_DETALLE",
            [orden_id, ref_cursor]
        )
        items = []
        for row in ref_cursor:
            item = {
                'id_salida': row[0],
                'producto_id': row[1],
                'producto_nombre': row[2],
                'sku': row[3],
                'cantidad': row[4],
                'precio_unitario': float(row[5]) if row[5] else 0.0,
                'subtotal': float(row[6]) if row[6] else 0.0,
                'imagen_url': row[7]
            }
            items.append(item)
        return True, items
    except Exception as e:
        print(f"Error en obtenerDetalleOrden: {e}")
        traceback.print_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def procesarPago(factura_id, monto, metodo_pago):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        pago_id_var = cursor.var(oracledb.NUMBER)
        
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_VENTAS.SP_PROCESAR_PAGO",
            [factura_id, monto, metodo_pago, pago_id_var]
        )
        
        pago_id = pago_id_var.getvalue()
        connection.commit()
        print(f"Pago procesado exitosamente: ID {pago_id}")
        return True, {
            'pago_id': pago_id,
            'mensaje': 'Pago procesado exitosamente'
        }
    except Exception as e:
        print(f"Error en procesarPago: {e}")
        traceback.print_exc()
        return False, {'error': str(e)}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerFacturaPorOrden(orden_id):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                ID_FACTURA,
                NUMERO_FACTURA,
                TOTAL,
                DESCUENTOS,
                FECHA_EMISION,
                ESTADO
            FROM ANDREY_GABO_CHAMO_JOSE.FACTURAS
            WHERE ORDEN_ID = :orden_id
        """, {'orden_id': orden_id})
        
        row = cursor.fetchone()
        if row:
            factura = {
                'id_factura': row[0],
                'numero_factura': row[1],
                'total': float(row[2]) if row[2] else 0.0,
                'descuentos': float(row[3]) if row[3] else 0.0,
                'fecha_emision': row[4],
                'estado': row[5]
            }
            print(f"Factura obtenida: {factura['numero_factura']}")
            return True, factura
        else:
            print(f"No se encontró factura para orden {orden_id}")
            return False, None
    except Exception as e:
        print(f"Error en obtenerFacturaPorOrden: {e}")
        traceback.print_exc()
        return False, None
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()