from ..conexionDB import get_db_connection
import oracledb

def obtenerProductos():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        productos_cursor = cursor.var(oracledb.CURSOR)
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
        cursor.close()
        connection.close()
        return True, productos
    except Exception as e:
        print(f"Error en el proceso almacenado => \n{e}" )
        cursor.close()
        connection.close()
        return False, None
 

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
  
def registrarIngresos(SUCURSAL_ID, DESCRIPCION, MONTO, FECHA_RECIBIDO, REGISTRADO_POR, TIPO ):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
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
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        finanzas_cursor = cursor.var(oracledb.CURSOR)
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
        return True, finanzaFecha
    except Exception as e:
        print(f"Error en el proceso almacenado => \n{e}" )
        cursor.close()
        connection.close()
        return False, None

def crearFactura(USUARIO_ID, ORDEN_ID, MONTO_TOTAL, DESCUENTOS, CUPON_ID, CANAL_ID, SUCURSAL_ID, ESTADO, ID_FACTURA):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
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
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        factura_cursor = cursor.var(oracledb.CURSOR)
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
        return True, facturas
    except Exception as e:
        print(f"Error en el proceso almacenado => \n{e}" )
        cursor.close()
        connection.close()
        return False, None
 

def actualizarEstadoFactura(FACTURA_ID, NUEVO_ESTADO):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
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
        return True, resultado
    except Exception as e:
        print(f"Error en el procedimiento 'obtenerContraUsuario' => \n{e}")
        cursor.close()
        connection.close()
        return False, None


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
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        usuarios_cursor = cursor.var(oracledb.CURSOR)
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
        return True, usuarios
    except Exception as e:
        cursor.close()
        connection.close()
        print(f"Error al conectar con Oracle => \n {e}")       


def obtenerDetallesProducto():
    try:
        print(">>> creando conexion")
        connection = get_db_connection()

        print(">>> creando cursor")
        cursor = connection.cursor()

        print(">>> creando cursor_var")
        cursor_var = connection.cursor().var(oracledb.CURSOR)

        print(">>> antes del callproc")
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_OBTENER_PRODUCTOS_DETALLE",
            [cursor_var]
        )

        print(">>> despues del callproc")

        result_cursor = cursor_var.getvalue()
        rows = result_cursor.fetchall()

        productos = []
        for r in rows:
            productos.append({
                'id': r[0],
                'nombre_producto': r[1],
                'nombre_categoria': r[2],
                'urls_imagenes': r[3],
                'precio_base': r[4]
            })

        return productos

    except Exception as e:
        print(f"Error en obtenerDetallesProducto: {e}")
        import traceback
        traceback.print_exc()
        return []

    finally:
        try:
            cursor.close()
        except:
            pass
        
        try:
            connection.close()
        except:
            pass


def obtenerTopProductosCateogria(idCategoria):
    connection = None
    cursor = None
    ref_cursor = None
    
    try:
        print(f">>> Obteniendo top productos de categoría: {idCategoria}")
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # ✅ CAMBIO CRÍTICO: Cursor directo en lugar de var(oracledb.CURSOR)
        ref_cursor = connection.cursor()
        
        print(">>> Llamando al procedimiento almacenado...")
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_TOP5_PRODUCTOS_MAS_VENDIDOS",
            [idCategoria, ref_cursor]
        )
        
        print(">>> Procesando resultados...")
        topProductos = []
        
        for r in ref_cursor:
            producto = {
                'id': r[0],        # ID_PRODUCTO
                'nombre': r[1],    # NOMBRE
                'precio': r[2],    # PRECIO
                'url': r[3],       # URL_IMAGEN
                'total': r[4]      # TOTAL_VENDIDO
            }
            topProductos.append(producto)
        
        print(f"✅ Se obtuvieron {len(topProductos)} productos")
        return True, topProductos
        
    except Exception as e:
        print(f"❌ Error en obtenerTopProductosCateogria: {e}")
        import traceback
        traceback.print_exc()
        return False, []
        
    finally:
        if ref_cursor:
            try:
                ref_cursor.close()
            except:
                pass
        if cursor:
            try:
                cursor.close()
            except:
                pass
        if connection:
            try:
                connection.close()
            except:
                pass