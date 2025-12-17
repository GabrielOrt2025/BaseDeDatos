"""
app/database/sp/dashboard.py
Módulo para operaciones del dashboard administrativo
"""

from ..conexionDB import get_db_connection
import oracledb
import traceback


def obtenerResumenDashboard():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        ordenes_hoy = cursor.var(oracledb.NUMBER)
        monto_ordenes_hoy = cursor.var(oracledb.NUMBER)
        ventas_hoy = cursor.var(oracledb.NUMBER)
        monto_ventas_hoy = cursor.var(oracledb.NUMBER)
        usuarios_activos = cursor.var(oracledb.NUMBER)
        productos_activos = cursor.var(oracledb.NUMBER)
        
        cursor.callproc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_RESUMEN_DASHBOARD',
            [
                ordenes_hoy,
                monto_ordenes_hoy,
                ventas_hoy,
                monto_ventas_hoy,
                usuarios_activos,
                productos_activos
            ]
        )
        
        resumen = {
            'ordenes_hoy': int(ordenes_hoy.getvalue() or 0),
            'monto_ordenes_hoy': float(monto_ordenes_hoy.getvalue() or 0),
            'ventas_hoy': int(ventas_hoy.getvalue() or 0),
            'monto_ventas_hoy': float(monto_ventas_hoy.getvalue() or 0),
            'usuarios_activos': int(usuarios_activos.getvalue() or 0),
            'productos_activos': int(productos_activos.getvalue() or 0)
        }
        
        return True, resumen
        
    except Exception as e:
        print(f"Error en obtenerResumenDashboard: {e}")
        traceback.print_exc()
        return False, {}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerOrdenesRecientes(limite=5):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        
        cursor.callproc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_ORDENES_RECIENTES',
            [limite, ref_cursor]
        )
        
        ordenes = []
        for row in ref_cursor:
            orden = {
                'id_orden': row[0],
                'numero_orden': row[1],
                'usuario_id': row[2],
                'nombre_usuario': row[3],
                'email': row[4],
                'estado': row[5],
                'total': float(row[6]) if row[6] else 0.0,
                'fecha_orden': row[7],
                'sucursal': row[8]
            }
            ordenes.append(orden)
        return True, ordenes
        
    except Exception as e:
        print(f"Error en obtenerOrdenesRecientes: {e}")
        traceback.print_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerAlertasStockBajo(limite=3):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        
        cursor.callproc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_ALERTAS_STOCK_BAJO',
            [limite, ref_cursor]
        )
        
        alertas = []
        for row in ref_cursor:
            alerta = {
                'id_producto': row[0],
                'producto': row[1],
                'sku': row[2],
                'categoria': row[3],
                'cantidad_disponible': int(row[4]) if row[4] else 0,
                'cantidad_reservada': int(row[5]) if row[5] else 0,
                'cantidad_alerta': int(row[6]) if row[6] else 0,
                'bodega': row[7],
                'stock_neto': int(row[8]) if row[8] else 0
            }
            alertas.append(alerta)
        
        return True, alertas
        
    except Exception as e:
        print(f"Error en obtenerAlertasStockBajo: {e}")
        traceback.print_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerActividadesRecientes(limite=10):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        
        cursor.callproc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_ACTIVIDADES_RECIENTES',
            [limite, ref_cursor]
        )
        
        actividades = []
        for row in ref_cursor:
            actividad = {
                'tipo_actividad': row[0],
                'entidad_id': row[1],
                'referencia': row[2],
                'descripcion': row[3],
                'usuario': row[4],
                'fecha_actividad': row[5],
                'monto': float(row[6]) if row[6] else None
            }
            actividades.append(actividad)
        
        return True, actividades
        
    except Exception as e:
        print(f"Error en obtenerActividadesRecientes: {e}")
        traceback.print_exc()
        return False, []
    finally:
        if ref_cursor:
            ref_cursor.close()
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerOrdenesDia(fecha=None):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        total_ordenes = cursor.var(oracledb.NUMBER)
        monto_total = cursor.var(oracledb.NUMBER)
        
        if fecha:
            cursor.callproc(
                'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_OBTENER_ORDENES_DIA',
                [fecha, total_ordenes, monto_total]
            )
        else:
            cursor.callproc(
                'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_OBTENER_ORDENES_DIA',
                [total_ordenes, monto_total]
            )
        
        resultado = {
            'total_ordenes': int(total_ordenes.getvalue() or 0),
            'monto_total': float(monto_total.getvalue() or 0)
        }
        
        return True, resultado
        
    except Exception as e:
        print(f"Error en obtenerOrdenesDia: {e}")
        traceback.print_exc()
        return False, {}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def obtenerVentasDia(fecha=None):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        total_ventas = cursor.var(oracledb.NUMBER)
        monto_ventas = cursor.var(oracledb.NUMBER)
        
        if fecha:
            cursor.callproc(
                'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_OBTENER_VENTAS_DIA',
                [fecha, total_ventas, monto_ventas]
            )
        else:
            cursor.callproc(
                'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.SP_OBTENER_VENTAS_DIA',
                [total_ventas, monto_ventas]
            )
        
        resultado = {
            'total_ventas': int(total_ventas.getvalue() or 0),
            'monto_ventas': float(monto_ventas.getvalue() or 0)
        }
        
        return True, resultado
        
    except Exception as e:
        print(f"Error en obtenerVentasDia: {e}")
        traceback.print_exc()
        return False, {}
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def contarUsuariosActivos():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        count = cursor.callfunc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.FN_CONTAR_USUARIOS_ACTIVOS',
            oracledb.NUMBER
        )
        
        return True, int(count) if count else 0
        
    except Exception as e:
        print(f"Error en contarUsuariosActivos: {e}")
        traceback.print_exc()
        return False, 0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def contarProductosActivos():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        count = cursor.callfunc(
            'ANDREY_GABO_CHAMO_JOSE.PKG_ANALYTICS_DASHBOARD.FN_CONTAR_PRODUCTOS_ACTIVOS',
            oracledb.NUMBER
        )
        
        return True, int(count) if count else 0
        
    except Exception as e:
        print(f"Error en contarProductosActivos: {e}")
        traceback.print_exc()
        return False, 0
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()