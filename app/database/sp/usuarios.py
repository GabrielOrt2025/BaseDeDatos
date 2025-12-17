from ..conexionDB import get_db_connection
import oracledb
import traceback

def crearDireccion(
        usuarioId, etiqueta, nombreDestinatario, linea1, 
        ciudad, provincia, codigoPostal, pais, telefono
        ):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        idDireccionVar = cursor.var(oracledb.NUMBER)
        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_DIRECCIONES.SP_DIRECCION_CREAR", 
                        [usuarioId, etiqueta, nombreDestinatario, linea1, ciudad, provincia, codigoPostal, pais, telefono, idDireccionVar]
                        )
        
        connection.commit()
        idDireccion = int(idDireccionVar.getvalue())
        return True, idDireccion
    except Exception as e:
        print(f"Error en crearDireccion: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def actualizarDireccion(
        usuarioId, etiqueta, nombreDestinatario, linea1, 
        ciudad, provincia, codigoPostal, pais, telefono
        ):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_DIRECCIONES.SP_DIRECCION_ACTUALIZAR", 
                        [usuarioId, etiqueta, nombreDestinatario, linea1, ciudad, provincia, codigoPostal, pais, telefono]
                        )
        
        connection.commit()
        return True, "Direccion agregada con exito"
    except Exception as e:
        print(f"Error en actualizarDireccion: {e}")
        traceback.print_exc()
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def direccionXusuario(userId):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        ref_cursor = connection.cursor()

        cursor.callproc(
            "ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_DIRECCIONES.SP_DIRECCION_LEER_POR_USUARIO",
            [userId, ref_cursor]
        )

        direcciones = []
        for r in ref_cursor:
            direccion = {
                "id_direccion": r[0],
                "etiqueta": r[1],
                "nombre_destinatario": r[2],
                "linea_1": r[3],
                "ciudad": r[4],
                "provincia": r[5],
                "pais": r[6],
                "codigo_postal": r[7]
            }
            direcciones.append(direccion)

        return True, direcciones

    except Exception as e:
        print(f"Error al obtener direcciones: {e}")
        return []

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


def direccionEliminar(userId):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.callproc("ANDREY_GABO_CHAMO_JOSE.PKG_GESTION_DIRECCIONES.SP_DIRECCION_ELIMINAR", [userId])
        connection.commit()
        return True, "Direccion eliminada con exito"
    except Exception as e:
        print(f"Error al obtener direcciones: {e}")
        return False, str(e)
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

        