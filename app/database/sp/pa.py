from ..conexionDB import get_db_connection
import oracledb
import traceback


def obtenerProductos():
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = cursor.var(oracledb.CURSOR)
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_PRODUCTO.LEER_TODOS", [ref_cursor])
        productos = []
        for r in ref_cursor:
            producto = {
                'id' : r[0],
                'sku' : r[1],
                'nombre' : r[2],
                'descripcion' : r[3],
                'categoria_id': r[4],
                'activo' : r[5]
            }
            productos.append(producto)
        return True, productos
    except Exception as e:
        print(f"Error en obtenerProductos: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass
 

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
        print(f"Error en crearProducto: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass

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
        print(f"Error en crarCategoria: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass
  
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
        print(f"Error en registrarIngreso: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass
 
 
#JOSE QUE CARRITO MAS FEO 
def obtenerPorFecha():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.INGRESOS_PKG.SP_INGRESO_LEER_POR_FECHA", [ref_cursor])
        finanzaFecha = []
        for r in ref_cursor:
            finanza = {
                'FECHA_INICIO' : r[0],
                'FECHA_FIN' : r[1],
                'INGRESOS' : r[2]
            }
            finanzaFecha.append(finanza)
        return True, finanzaFecha
    except Exception as e:
        print(f"Error en obtenerPorFecha: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass

def crearFactura(USUARIO_ID, ORDEN_ID, MONTO_TOTAL, DESCUENTOS, CUPON_ID, CANAL_ID, SUCURSAL_ID, ESTADO, ID_FACTURA):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_CREAR", [USUARIO_ID, ORDEN_ID, MONTO_TOTAL, DESCUENTOS, CUPON_ID, CANAL_ID, SUCURSAL_ID, ESTADO, ID_FACTURA])
        connection.commit()
        return True
    except Exception as e:
        print(f"Error en crearFactura: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass
    

def obtenerFechaFactura():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_LEER_POR_FECHA", [ref_cursor])
        facturas = []
        for r in ref_cursor:
            factura = {
                'FECHA_INICIO' : r[0],
                'FECHA_FIN' : r[1],
                'FACTURAS' : r[2]
            }
            facturas.append(factura)
        return True, facturas
    except Exception as e:
        print(f"Error en obtenerTopProductosCateogria: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass

 

def actualizarEstadoFactura(FACTURA_ID, NUEVO_ESTADO):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.FACTURAS_PKG.SP_FACTURA_ACTUALIZAR_ESTADO", [FACTURA_ID, NUEVO_ESTADO])
        connection.close()
        return True
    except Exception as e:
        print(f"Error en actualizarEstadoFactura: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass



def crearUsuario(email, password_hash, nombre):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_CREAR", [email, password_hash, nombre])
        connection.commit()
        print(f"Usuario: '{nombre}' creado exitosamente")
        return True
    except Exception as e:
        print(f"Error en crearUsuario: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def actualizarPerfilUsuario(nombre, email, password_hash):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_ACTUALIZAR_PERFIL", [nombre, email, password_hash])
        connection.commit()
        print(f"Perfil de usuario: '{email}' actualizado exitosamente")
        return True
    except Exception as e:
        print(f"Error en actualizarPerfilUsuario: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def cambiarActividadUsuario(usuario_id, activo):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_ACTIVIDAD_USUARIO", [usuario_id, activo])
        connection.commit()
        estado = "activado" if activo == 1 else "desactivado"
        print(f"Usuario Id: {usuario_id} {estado} exitosamente")
        return True
    except Exception as e:
        print(f"Error en cambiarActividadUsuario: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def obtenerUsuarios():
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_OBTENER_USUARIOS", [ref_cursor])
        usuarios = []
        for r in ref_cursor:
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
        print(f"Error en obtenerTopProductosCateogria: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def obtenerDetallesProducto():
    try:
        connection = get_db_connection()

        cursor = connection.cursor()

        cursor_var = connection.cursor().var(oracledb.CURSOR)

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_OBTENER_PRODUCTOS_DETALLE",
            [cursor_var]
        )

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
            connection.close()   # 🔥 MUY IMPORTANTE con pools
        except:
            pass


def obtenerTopProductosCateogria(idCategoria):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_TOP5_PRODUCTOS_MAS_VENDIDOS",
            [idCategoria, ref_cursor]
        )
        topProductos = []

        for r in ref_cursor:
            producto = {
                'id': r[0],        # ID_PRODUCTO
                'nombre': r[1],    # NOMBRE
                'precio': float(r[2]) if r[2] is not None else 0.0,    # PRECIO
                'url': r[3],       # URL_IMAGEN
                'total': int(r[4]) if r[4] is not None else 0     # TOTAL_VENDIDO
            }
            topProductos.append(producto)
        return True, topProductos

    except Exception as e:
        print(f"Error en obtenerTopProductosCateogria: {e}")
        traceback.print_exc()
        return False, []

    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def obtenerProductoCategoria(idCategoria):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_REPORTES_STOCK.SP_OBTENER_PRODUCTO_CATEGORIA", 
            [idCategoria, ref_cursor]
        )
        
        productos = []

        for r in ref_cursor:
            producto = {
                'id': r[0],
                'nombre': r[1],       
                'precio': float(r[2]) if r[2] is not None else 0.0,
                'url': r[3],
                'total_vendido': int(r[4]) if r[4] is not None else 0  
            }
            productos.append(producto)
        print("Productos: ", productos)
        return productos
    except Exception as e:
        print(f"Error en obtenerProductosCategoria: {e}")
        traceback.print_exc()
        return None
    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None:
            connection.close()



def obtenerContraUsuario(email):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        password_hash_var = cursor.var(oracledb.STRING)
        usuario_id_var = cursor.var(oracledb.NUMBER)
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.SP_USUARIO_OBTENER_PASS",
            [email, password_hash_var, usuario_id_var]
        )

        print(f"Procedimiento almacenado ejecutado")


        password_hash = password_hash_var.getvalue()
        usuario_id = usuario_id_var.getvalue()

        print(f"🔍 password_hash: {password_hash}")
        print(f"🔍 usuario_id: {usuario_id}")

        infoUser = []
        if password_hash is not None and usuario_id is not None:
            user = {
                'passHash': password_hash,
                'idUser': usuario_id
            }
            infoUser.append(user)
            print(f"Usuario encontrado: {user}")
            return True, infoUser
        else:
            print(f"⚠️  Usuario no encontrado o parámetros NULL")
            return True, [] 

    except Exception as e:
        print(f"Error en obtenerContraUsuario: {e}")
        traceback.print_exc()
        return False, []
    finally:
        try:
            if cursor is not None:
                cursor.close()
                print(f"Cursor cerrado")
        except Exception as e:
            print(f"Error cerrando cursor: {e}")

        try:
            if connection is not None:
                connection.close()
                print(f"connection cerrada")
        except Exception as e:
            print(f"Error cerrando connection: {e}")


def obtenerNombreUsuario(usuario_id):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        nombre_var = cursor.var(oracledb.STRING)

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_USUARIOS.FN_OBTENER_NOMBRE_USUARIO",
            [usuario_id, nombre_var]
        )

        nombre = nombre_var.getvalue()
        print(f"🔍 Nombre obtenido: {nombre}")

        if nombre is not None:
            return True, nombre
        else:
            print(f"⚠️  No se encontró nombre para usuario ID: {usuario_id}")
            return True, "Usuario"  # Valor por defecto

    except Exception as e:
        print(f"❌ Error en obtenerNombreUsuario: {e}")
        traceback.print_exc()
        return False, None
    finally:
        try:
            if cursor is not None:
                cursor.close()
                print(f"Cursor cerrado")
        except Exception as e:
            print(f"⚠️  Error cerrando cursor: {e}")

        try:
            if connection is not None:
                connection.close()
                print(f"Connection cerrada")
        except Exception as e:
            print(f"Error cerrando connection: {e}")


def obtenerRolesUsuarios(usuario_id):
    connection = None
    cursor = None
    ref_cursor = None
    try:
        print(f"\n{'='*80}")
        print(f"📞 obtenerRolesUsuarios - Usuario ID: {usuario_id}")
        print(f"{'='*80}")
        connection = get_db_connection()
        cursor = connection.cursor()
        ref_cursor = connection.cursor()

        print(f"🔍 Llamando procedimiento SP_ROLES_LEER_POR_USUARIO...")
        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_ROLES.SP_ROLES_LEER_POR_USUARIO",
            [usuario_id, ref_cursor]
        )
        print(f"✅ Procedimiento ejecutado sin errores")

        roles = []
        row_count = 0
        print(f"🔍 Iterando resultados...")
        for r in ref_cursor:
            row_count += 1
            # r[0] = ID_ROL
            # r[1] = NOMBRE_ROL  
            # r[2] = FECHA_ASIGNACION
            # r[3] = ACTIVO (ya filtrado en BD)
            role_id = r[0]
            role_nombre = r[1]  # NOMBRE_ROL
            role_activo = r[3]
            roles.append(role_nombre)
            print(f"  [{row_count}] ID: {role_id}, Nombre: {role_nombre}, Activo: {role_activo}")
        
        print(f"✅ Total de filas procesadas: {row_count}")
        print(f"✅ Total de roles retornados: {len(roles)}")
        print(f"{'='*80}\n")
        return True, roles
    except Exception as e:
        print(f"❌ Error en obtenerRolesUsuarios: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*80}\n")
        return False, []
    finally:
        try:
            if ref_cursor is not None:
                ref_cursor.close()
        except Exception as e:
            print(f"Error cerrando ref_cursor: {e}")

        try:
            if cursor is not None:
                cursor.close()
        except Exception as e:
            print(f"Error cerrando cursor: {e}")

        try:
            if connection is not None:
                connection.close()
        except Exception as e:
            print(f"Error cerrando connection: {e}")
        

def asignarRolUsuario(usuario_id, rol_id, asignado_por):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_ROLES.SP_ROL_ASIGNAR",
            [usuario_id, rol_id, asignado_por]
        )

        connection.commit()
        print(f"✅ Rol {rol_id} asignado al usuario {usuario_id}")
        return True

    except Exception as e:
        print(f"❌ Error en asignarRolUsuario: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass


def revocarRolUsuario(usuario_id, rol_id, revocado_por):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_ROLES.SP_ROL_REVOCAR",
            [usuario_id, rol_id, revocado_por]
        )

        connection.commit()
        print(f"✅ Rol {rol_id} revocado al usuario {usuario_id}")
        return True

    except Exception as e:
        print(f"❌ Error en revocarRolUsuario: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        try:
            if cursor is not None:
                cursor.close()
        except:
            pass

        try:
            if connection is not None:
                connection.close()
        except:
            pass
