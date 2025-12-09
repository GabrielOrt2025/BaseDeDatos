CREATE OR REPLACE PACKAGE PKG_GESTION_USUARIOS
AS
    PROCEDURE SP_USUARIO_CREAR (
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH IN VARCHAR2,
        P_NOMBRE IN VARCHAR2
    );
    PROCEDURE SP_USUARIO_OBTENER_PASS (
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH OUT VARCHAR2,
        P_ID_USUARIO OUT NUMBER
    );
    PROCEDURE SP_USUARIO_ACTUALIZAR_PERFIL (
        P_NOMBRE IN VARCHAR2,
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH IN VARCHAR2
    );
    PROCEDURE SP_ACTIVIDAD_USUARIO (
        P_USUARIO_ID IN NUMBER,
        P_ACTIVO IN NUMBER
    );
    PROCEDURE SP_OBTENER_USUARIOS (
        P_USUARIOS OUT SYS_REFCURSOR
    );
    FUNCTION FN_EMAIL_DISPONIBLE (
        P_EMAIL IN VARCHAR2,
        P_USUARIO_ID OUT NUMBER
    ) RETURN NUMBER;

    FUNCTION FN_OBTENER_NOMBRE_USUARIO (
        P_USUARIO_ID IN NUMBER
    ) RETURN VARCHAR2;
END PKG_GESTION_USUARIOS;
/
CREATE OR REPLACE PACKAGE BODY PKG_GESTION_USUARIOS
AS
    FUNCTION FN_EMAIL_DISPONIBLE (
        P_EMAIL IN VARCHAR2,
        P_USUARIO_ID OUT NUMBER
    ) RETURN NUMBER
    AS
            V_EXISTE NUMBER := 0;
        BEGIN
            SELECT USUARIO_ID
            INTO P_USUARIO_ID
            FROM USUARIOS
            WHERE EMAIL = P_EMAIL;
            V_EXISTE := 1;
        RETURN V_EXISTE;
        EXCEPTION 
        WHEN NO_DATA_FOUND THEN
            P_USUARIO_ID := NULL;
        RETURN 0;
    END FN_EMAIL_DISPONIBLE;

    FUNCTION FN_OBTENER_NOMBRE_USUARIO (
        P_USUARIO_ID IN NUMBER
    ) RETURN VARCHAR2
    AS
        V_NOMBRE USUARIOS.NOMBRE%TYPE;
        BEGIN
            SELECT NOMBRE
            INTO V_NOMBRE
            FROM USUARIOS
            WHERE USUARIO_ID = P_USUARIO_ID;
        RETURN V_NOMBRE;
        EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN NULL;
    END FN_OBTENER_NOMBRE_USUARIO;
        
    PROCEDURE SP_USUARIO_CREAR (
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH IN VARCHAR2,
        P_NOMBRE IN VARCHAR2
    )
    AS
        V_EXISTE NUMBER;
        V_ID_EXISTENTE  USUARIOS.USUARIO_ID%TYPE;
        BEGIN
            V_EXISTE := FN_EMAIL_DISPONIBLE(P_EMAIL, V_ID_EXISTENTE);
        IF V_EXISTE = 1 THEN
            DBMS_OUTPUT.PUT_LINE('DATOS INCORRECTO');
        END IF;

        INSERT INTO USUARIOS (
            EMAIL, PASSWORD_HASH, NOMBRE
        ) VALUES (
            P_EMAIL, P_PASSWORD_HASH, P_NOMBRE
        );

        DBMS_OUTPUT.PUT_LINE('SE INSERTO CON EXITO EL USUARIO: ' || P_NOMBRE);
    END SP_USUARIO_CREAR;

    PROCEDURE SP_USUARIO_OBTENER_PASS (
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH OUT VARCHAR2,
        P_ID_USUARIO OUT NUMBER
    )
    AS
        BEGIN
            SELECT PASSWORD_HASH, USUARIO_ID
            INTO P_PASSWORD_HASH, P_ID_USUARIO
            FROM USUARIOS
            WHERE EMAIL = P_EMAIL;

            EXCEPTION
            WHEN NO_DATA_FOUND THEN
                P_PASSWORD_HASH := NULL;
                P_ID_USUARIO := NULL;
                DBMS_OUTPUT.PUT_LINE('DATOS INCORRECTOS');
            WHEN TOO_MANY_ROWS THEN
                P_PASSWORD_HASH := NULL;
                P_ID_USUARIO := NULL;
                DBMS_OUTPUT.PUT_LINE('DATOS INCORRECTOS');
    END SP_USUARIO_OBTENER_PASS;

    PROCEDURE SP_USUARIO_ACTUALIZAR_PERFIL (
        P_NOMBRE IN VARCHAR2,
        P_EMAIL IN VARCHAR2,
        P_PASSWORD_HASH IN VARCHAR2
    )
    AS
        V_ID_USUARIO USUARIOS.USUARIO_ID%TYPE;
        V_EXISTE NUMBER;
        BEGIN
            V_EXISTE := PKG_GESTION_USUARIOS.FN_EMAIL_DISPONIBLE(P_EMAIL, V_ID_USUARIO);
            IF V_EXISTE = 0 THEN
                DBMS_OUTPUT.PUT_line('NO EXISTE EL ID');
            END IF;
            UPDATE USUARIOS
            SET PASSWORD_HASH = P_PASSWORD_HASH,
                NOMBRE = P_NOMBRE
            WHERE USUARIO_ID = V_ID_USUARIO;
            DBMS_OUTPUT.PUT_LINE('SE ACTUALIZO CON EXITO');
    END SP_USUARIO_ACTUALIZAR_PERFIL;

    PROCEDURE SP_ACTIVIDAD_USUARIO (
        P_USUARIO_ID IN NUMBER,
        P_ACTIVO IN NUMBER
    ) 
    AS
        BEGIN
            UPDATE USUARIOS
            SET ACTIVO = P_ACTIVO
            WHERE USUARIO_ID = P_USUARIO_ID;
            DBMS_OUTPUT.PUT_LINE('SE ACTUALIZO CON EXITO');

        EXCEPTION
        WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('ERROR AL CAMBIAR LA ACTIVIDAD DEL USUARIO: ' || P_USUARIO_ID);
    END SP_ACTIVIDAD_USUARIO;

    PROCEDURE SP_OBTENER_USUARIOS (
        P_USUARIOS OUT SYS_REFCURSOR
    ) 
    AS 
    BEGIN
        OPEN P_USUARIOS FOR
        SELECT 
            USUARIO_ID, 
            NOMBRE, 
            EMAIL, 
            ACTIVO
        FROM
            USUARIOS;
    EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('NO EXISTEN USUARIOS');
    END SP_OBTENER_USUARIOS;
END PKG_GESTION_USUARIOS;
/

CREATE OR REPLACE PACKAGE PKG_GESTION_DIRECCIONES AS
    PROCEDURE SP_DIRECCION_CREAR(
        p_usuario_id IN NUMBER,
        p_etiqueta IN VARCHAR2,
        p_nombre_destinatario IN VARCHAR2,
        p_linea1 IN VARCHAR2,
        p_ciudad IN VARCHAR2,
        p_provincia IN VARCHAR2,
        p_codigo_postal IN VARCHAR2,
        p_pais IN VARCHAR2,
        p_telefono IN VARCHAR2
    );
    
    PROCEDURE SP_DIRECCION_ACTUALIZAR(
        p_direccion_id IN NUMBER,
        p_etiqueta IN VARCHAR2,
        p_nombre_destinatario IN VARCHAR2,
        p_linea1 IN VARCHAR2,
        p_ciudad IN VARCHAR2,
        p_provincia IN VARCHAR2,
        p_codigo_postal IN VARCHAR2,
        p_pais IN VARCHAR2,
        p_telefono IN VARCHAR2
    );

    PROCEDURE SP_DIRECCION_LEER_POR_USUARIO(
        p_usuario_id IN NUMBER,
        P_DIRECCIONES OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_DIRECCION_ELIMINAR( -- NUEVO: Necesario para completar el CRUD
        p_direccion_id IN NUMBER
    );

    -- Funciones
    FUNCTION FN_CONTAR_DIRECCIONES_USUARIO(
        p_usuario_id NUMBER
    ) RETURN NUMBER;

    FUNCTION FN_FORMATEAR_DIRECCION_COMPLETA(
        p_direccion_id NUMBER
    ) RETURN VARCHAR2;

END PKG_GESTION_DIRECCIONES;
/
CREATE OR REPLACE PACKAGE BODY PKG_GESTION_DIRECCIONES AS

    FUNCTION FN_CONTAR_DIRECCIONES_USUARIO(
        p_usuario_id NUMBER
    ) RETURN NUMBER
    AS
        v_total NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_total
        FROM DIRECCIONES_USUARIO WHERE USUARIO_ID = p_usuario_id;
        RETURN v_total;
    END FN_CONTAR_DIRECCIONES_USUARIO;

    FUNCTION FN_FORMATEAR_DIRECCION_COMPLETA(
        p_direccion_id NUMBER
    ) RETURN VARCHAR2
    AS
        v_direccion VARCHAR2(500);
    BEGIN
        SELECT LINEA_1 || ', ' || CIUDAD || ', ' ||
               PROVINCIA || ', ' || PAIS
        INTO v_direccion
        FROM DIRECCIONES_USUARIO WHERE ID_DIRECCION = p_direccion_id;
        RETURN v_direccion;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN RETURN 'Dirección no encontrada';
    END FN_FORMATEAR_DIRECCION_COMPLETA;

    PROCEDURE SP_DIRECCION_CREAR(
        p_usuario_id IN NUMBER,
        p_etiqueta IN VARCHAR2,
        p_nombre_destinatario IN VARCHAR2,
        p_linea1 IN VARCHAR2,
        p_ciudad IN VARCHAR2,
        p_provincia IN VARCHAR2,
        p_codigo_postal IN VARCHAR2,
        p_pais IN VARCHAR2,
        p_telefono IN VARCHAR2
    )
    AS
    BEGIN
        INSERT INTO DIRECCIONES_USUARIO(
            USUARIO_ID, ETIQUETA, NOMBRE_DESTINATARIO, LINEA_1, CIUDAD, PROVINCIA,
            CODIGO_POSTAL, PAIS, TELEFONO
        ) VALUES (
            p_usuario_id, p_etiqueta, p_nombre_destinatario, p_linea1, p_ciudad, 
            p_provincia, p_codigo_postal, p_pais, p_telefono
        );
        -- Se omite DBMS_OUTPUT para inserciones exitosas
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20001, 'Error al crear la dirección: ' || SQLERRM);
    END SP_DIRECCION_CREAR;

    PROCEDURE SP_DIRECCION_LEER_POR_USUARIO(
        p_usuario_id IN NUMBER,
        P_DIRECCIONES OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN P_DIRECCIONES FOR
            SELECT ID_DIRECCION, ETIQUETA, NOMBRE_DESTINATARIO, LINEA_1, CIUDAD, PROVINCIA, PAIS, CODIGO_POSTAL
            FROM DIRECCIONES_USUARIO
            WHERE USUARIO_ID = p_usuario_id;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'Error al leer direcciones: ' || SQLERRM);
    END SP_DIRECCION_LEER_POR_USUARIO;
    
    -- PROCEDIMIENTO: Actualiza una dirección (NUEVO)
    PROCEDURE SP_DIRECCION_ACTUALIZAR(
        p_direccion_id IN NUMBER,
        p_etiqueta IN VARCHAR2,
        p_nombre_destinatario IN VARCHAR2,
        p_linea1 IN VARCHAR2,
        p_ciudad IN VARCHAR2,
        p_provincia IN VARCHAR2,
        p_codigo_postal IN VARCHAR2,
        p_pais IN VARCHAR2,
        p_telefono IN VARCHAR2
    )
    AS
    BEGIN
        UPDATE DIRECCIONES_USUARIO
        SET 
            ETIQUETA = p_etiqueta, 
            NOMBRE_DESTINATARIO = p_nombre_destinatario, 
            LINEA_1 = p_linea1, 
            CIUDAD = p_ciudad, 
            PROVINCIA = p_provincia,
            CODIGO_POSTAL = p_codigo_postal, 
            PAIS = p_pais, 
            TELEFONO = p_telefono
        WHERE ID_DIRECCION = p_direccion_id;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'No se encontró la dirección con ID: ' || p_direccion_id || ' para actualizar.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20004, 'Error al actualizar la dirección: ' || SQLERRM);
    END SP_DIRECCION_ACTUALIZAR;
    
    PROCEDURE SP_DIRECCION_ELIMINAR(
        p_direccion_id IN NUMBER
    )
    AS
    BEGIN
        DELETE FROM DIRECCIONES_USUARIO
        WHERE ID_DIRECCION = p_direccion_id;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'No se encontró la dirección con ID: ' || p_direccion_id || ' para eliminar.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20006, 'Error al eliminar la dirección: ' || SQLERRM);
    END SP_DIRECCION_ELIMINAR;
    
END PKG_GESTION_DIRECCIONES;

/

CREATE OR REPLACE PACKAGE PKG_GESTION_ROLES AS
    -- Procedimientos
    PROCEDURE SP_ROL_ASIGNAR(
        p_usuario_id   IN NUMBER,
        p_rol_id       IN NUMBER,
        p_asignado_por IN NUMBER
    );
    
    PROCEDURE SP_ROL_REVOCAR( -- NUEVO: Procedimiento para desactivar la asignación de rol
        p_usuario_id IN NUMBER,
        p_rol_id     IN NUMBER,
        p_revocado_por IN NUMBER
    );
    
    PROCEDURE SP_ROLES_LEER_POR_USUARIO( -- NUEVO: Para obtener los roles asignados
        p_usuario_id IN NUMBER,
        P_ROLES_CURSOR OUT SYS_REFCURSOR
    );

    -- Funciones
    FUNCTION FN_USUARIO_TIENE_ROL(
        p_usuario_id IN NUMBER,
        p_nombre_rol VARCHAR2
    ) RETURN NUMBER;
END PKG_GESTION_ROLES;
/
CREATE OR REPLACE PACKAGE BODY PKG_GESTION_ROLES AS

    FUNCTION FN_USUARIO_TIENE_ROL(
        p_usuario_id NUMBER,
        p_nombre_rol VARCHAR2
    ) RETURN NUMBER
    AS
        v_tiene_rol NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_tiene_rol
        FROM USUARIO_ROLES UR
        JOIN ROLES R ON UR.ROL_ID = R.ID_ROL
        WHERE UR.USUARIO_ID = p_usuario_id
        AND R.NOMBRE = p_nombre_rol
        AND UR.ACTIVO = 1;
        
        RETURN CASE WHEN v_tiene_rol > 0 THEN 1 ELSE 0 END;
    END FN_USUARIO_TIENE_ROL;

    PROCEDURE SP_ROL_ASIGNAR(
        p_usuario_id NUMBER,
        p_rol_id NUMBER,
        p_asignado_por NUMBER
    )
    AS
        v_existente NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_existente
        FROM USUARIO_ROLES
        WHERE USUARIO_ID = p_usuario_id AND ROL_ID = p_rol_id;
        
        IF v_existente = 0 THEN
            INSERT INTO USUARIO_ROLES (USUARIO_ID, ROL_ID, ASIGNADO_POR, ACTIVO)
            VALUES (p_usuario_id, p_rol_id, p_asignado_por, 1); -- ACTIVO=1
        ELSE
            -- Si ya existe, se actualiza el asignador y se asegura de que esté ACTIVO
            UPDATE USUARIO_ROLES
            SET ASIGNADO_POR = p_asignado_por,
                ACTIVO = 1
            WHERE USUARIO_ID = p_usuario_id AND ROL_ID = p_rol_id;
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20010, 'Error al asignar el rol: ' || SQLERRM);
    END SP_ROL_ASIGNAR;

    -- PROCEDIMIENTO: Revoca o desactiva un rol (NUEVO)
    PROCEDURE SP_ROL_REVOCAR(
        p_usuario_id IN NUMBER,
        p_rol_id     IN NUMBER,
        p_revocado_por IN NUMBER
    )
    AS
    BEGIN
        -- Se asume una columna REVOCADO_POR/ACTIVO
        UPDATE USUARIO_ROLES
        SET ACTIVO = 0,
            ASIGNADO_POR = p_revocado_por -- Reutilizar para auditoría de revocación
        WHERE USUARIO_ID = p_usuario_id AND ROL_ID = p_rol_id;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20011, 'No se encontró la asignación de rol activa para revocar.');
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20012, 'Error al revocar el rol: ' || SQLERRM);
    END SP_ROL_REVOCAR;

    PROCEDURE SP_ROLES_LEER_POR_USUARIO(
        p_usuario_id IN NUMBER,
        P_ROLES_CURSOR OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN P_ROLES_CURSOR FOR
            SELECT 
                R.ID_ROL, 
                R.NOMBRE AS NOMBRE_ROL,
                UR.FECHA_ASIGNACION,
                UR.ACTIVO
            FROM USUARIO_ROLES UR
            JOIN ROLES R ON UR.ROL_ID = R.ID_ROL
            WHERE UR.USUARIO_ID = p_usuario_id
            ORDER BY R.NOMBRE;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20013, 'Error al leer los roles del usuario: ' || SQLERRM);
    END SP_ROLES_LEER_POR_USUARIO;

END PKG_GESTION_ROLES;
/