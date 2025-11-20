CREATE OR REPLACE PACKAGE PKG_PRODUCTO AS

    PROCEDURE CREAR (
        P_SKU IN VARCHAR2,
        P_CATEGORIA_ID IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_PRECIO_BASE IN NUMBER, -- Nombre actualizado
        P_ACTIVO IN NUMBER DEFAULT 1
    );

    PROCEDURE LEER (
        P_ID_PRODUCTO IN NUMBER,
        P_NOMBRE OUT VARCHAR2,
        P_DESCRIPCION OUT VARCHAR2,
        P_SKU OUT VARCHAR2,
        P_CATEGORIA_ID OUT NUMBER,
        P_PRECIO_BASE OUT NUMBER, -- Nombre actualizado
        P_ACTIVO OUT NUMBER
    );

    PROCEDURE ACTUALIZAR (
        P_ID_PRODUCTO IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_CATEGORIA_ID IN NUMBER,
        P_PRECIO_BASE IN NUMBER, -- Nombre actualizado
        P_ACTIVO IN NUMBER
    );
    
    PROCEDURE ELIMINAR (
        P_ID_PRODUCTO IN NUMBER
    );
    
    PROCEDURE LEER_TODOS (
        P_PRODUCTOS OUT SYS_REFCURSOR
    );

END PKG_PRODUCTO;
/
CREATE OR REPLACE PACKAGE BODY PKG_PRODUCTO AS

    PROCEDURE CREAR (
        P_SKU IN VARCHAR2,
        P_CATEGORIA_ID IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_PRECIO_BASE IN NUMBER,
        P_ACTIVO IN NUMBER
    ) AS
    BEGIN
        -- Validación: Precio base no negativo
        IF P_PRECIO_BASE < 0 THEN
             RAISE_APPLICATION_ERROR(-20199, 'El precio base del producto no puede ser negativo.');
        END IF;

        -- Ajustado para usar PRECIO_BASE
        INSERT INTO PRODUCTOS (SKU, CATEGORIA_ID, NOMBRE, DESCRIPCION, PRECIO_BASE, ACTIVO, CREADO_EN, ACTUALIZADO_EN)
        VALUES (P_SKU, P_CATEGORIA_ID, P_NOMBRE, 
                P_DESCRIPCION, P_PRECIO_BASE, P_ACTIVO, SYSDATE, SYSDATE);

    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20100, 'Error: El SKU ' || P_SKU || ' ya está registrado.');
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20101, 'Error al crear el producto: ' || SQLERRM);
    END CREAR;


    PROCEDURE LEER (
        P_ID_PRODUCTO IN NUMBER,
        P_NOMBRE OUT VARCHAR2,
        P_DESCRIPCION OUT VARCHAR2,
        P_SKU OUT VARCHAR2,
        P_CATEGORIA_ID OUT NUMBER,
        P_PRECIO_BASE OUT NUMBER,
        P_ACTIVO OUT NUMBER
    ) AS
    BEGIN
        -- Ajustado para leer PRECIO_BASE
        SELECT SKU, NOMBRE, DESCRIPCION, CATEGORIA_ID, PRECIO_BASE, ACTIVO
        INTO P_SKU, P_NOMBRE, P_DESCRIPCION, P_CATEGORIA_ID, P_PRECIO_BASE, P_ACTIVO
        FROM PRODUCTOS
        WHERE ID_PRODUCTO = P_ID_PRODUCTO;
    
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20102, 'No se encontró el producto con ID: ' || P_ID_PRODUCTO);
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20103, 'Error al leer el producto: ' || SQLERRM);
    END LEER;
    
    
    PROCEDURE LEER_TODOS (
        P_PRODUCTOS OUT SYS_REFCURSOR
    ) AS
    BEGIN
        -- Ajustado para seleccionar PRECIO_BASE
        OPEN P_PRODUCTOS FOR
            SELECT ID_PRODUCTO, SKU, NOMBRE, DESCRIPCION, CATEGORIA_ID, PRECIO_BASE, ACTIVO
            FROM PRODUCTOS
            ORDER BY NOMBRE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20104, 'Error al listar productos: ' || SQLERRM);
    END LEER_TODOS;


    PROCEDURE ACTUALIZAR (
        P_ID_PRODUCTO IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_CATEGORIA_ID IN NUMBER,
        P_PRECIO_BASE IN NUMBER,
        P_ACTIVO IN NUMBER
    ) AS
    BEGIN
        IF P_PRECIO_BASE < 0 THEN
             RAISE_APPLICATION_ERROR(-20199, 'El precio base del producto no puede ser negativo.');
        END IF;

        -- Ajustado para actualizar PRECIO_BASE
        UPDATE PRODUCTOS
        SET NOMBRE = P_NOMBRE,
            DESCRIPCION = P_DESCRIPCION,
            CATEGORIA_ID = P_CATEGORIA_ID,
            PRECIO_BASE = P_PRECIO_BASE,
            ACTIVO = P_ACTIVO,
            ACTUALIZADO_EN = SYSDATE
        WHERE ID_PRODUCTO = P_ID_PRODUCTO;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20105, 'No se encontró el producto ID: ' || P_ID_PRODUCTO || ' para actualizar.');
        END IF;
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20106, 'Error: El SKU proporcionado ya está en uso por otro producto.');
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20107, 'Error al actualizar el producto: ' || SQLERRM);
    END ACTUALIZAR;


    PROCEDURE ELIMINAR (
        P_ID_PRODUCTO IN NUMBER
    ) AS
    BEGIN
        DELETE FROM PRODUCTOS
        WHERE ID_PRODUCTO = P_ID_PRODUCTO;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20108, 'No se encontró el producto ID: ' || P_ID_PRODUCTO || ' a eliminar.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20109, 'Error al eliminar el producto: ' || SQLERRM);
    END ELIMINAR;

END PKG_PRODUCTO;
/

CREATE OR REPLACE PACKAGE PKG_STOCK AS

    PROCEDURE LEER_POR_BODEGA (
        P_BODEGA_ID IN NUMBER,
        P_STOCK_BODEGA OUT SYS_REFCURSOR
    );
    
    PROCEDURE ACTUALIZAR_CANT (
        P_BODEGA_ID IN NUMBER,
        P_id_producto IN NUMBER,
        P_CANTIDAD_DISPONIBLE IN NUMBER,
        P_CANTIDAD_RESERVADA IN NUMBER
    );

    PROCEDURE ACTUALIZAR_ALERTA (
        P_BODEGA_ID IN NUMBER,
        P_id_producto IN NUMBER,
        P_CANTIDAD_ALERTA IN NUMBER
    );

END PKG_STOCK;
/
CREATE OR REPLACE PACKAGE BODY PKG_STOCK AS

    PROCEDURE LEER_POR_BODEGA (
        P_BODEGA_ID IN NUMBER,
        P_STOCK_BODEGA OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN P_STOCK_BODEGA FOR
            SELECT PB.PRODUCTO_BODEGA_ID,
                   P.NOMBRE AS PRODUCTO,
                   PB.CANTIDAD_DISPONIBLE,
                   PB.CANTIDAD_RESERVADA,
                   PB.CANTIDAD_ALERTA
            FROM PRODUCTOXBODEGA PB
            JOIN PRODUCTOS P ON PB.id_producto = P.ID_PRODUCTO
            WHERE PB.BODEGA_ID = P_BODEGA_ID
            ORDER BY P.NOMBRE;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20120, 'Error al leer el stock de bodega: ' || SQLERRM);
    END LEER_POR_BODEGA;


    PROCEDURE ACTUALIZAR_CANT (
        P_BODEGA_ID IN NUMBER,
        P_id_producto IN NUMBER,
        P_CANTIDAD_DISPONIBLE IN NUMBER,
        P_CANTIDAD_RESERVADA IN NUMBER
    ) AS
    BEGIN
        UPDATE PRODUCTOXBODEGA
        SET CANTIDAD_DISPONIBLE = P_CANTIDAD_DISPONIBLE,
            CANTIDAD_RESERVADA = P_CANTIDAD_RESERVADA
        WHERE BODEGA_ID = P_BODEGA_ID 
          AND id_producto = P_id_producto;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20121, 'No se encontró el registro de stock para actualizar (P_BODEGA_ID: ' || P_BODEGA_ID || ', P_id_producto: ' || P_id_producto || ').');
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20122, 'Error al actualizar stock: ' || SQLERRM);
    END ACTUALIZAR_CANT;
    
    
    PROCEDURE ACTUALIZAR_ALERTA (
        P_BODEGA_ID IN NUMBER,
        P_id_producto IN NUMBER,
        P_CANTIDAD_ALERTA IN NUMBER
    ) AS
    BEGIN
        UPDATE PRODUCTOXBODEGA
        SET CANTIDAD_ALERTA = P_CANTIDAD_ALERTA
        WHERE BODEGA_ID = P_BODEGA_ID 
          AND id_producto = P_id_producto;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20123, 'No se encontró el registro de stock para actualizar la alerta.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20124, 'Error al actualizar nivel de alerta: ' || SQLERRM);
    END ACTUALIZAR_ALERTA;

END PKG_STOCK;
/

CREATE OR REPLACE PACKAGE PKG_CATEGORIA AS
    
    PROCEDURE LEER_TODAS (
        P_CATEGORIAS OUT SYS_REFCURSOR
    );
    
    PROCEDURE CREAR (
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2
    );
    
    PROCEDURE ACTUALIZAR (
        P_CATEGORIA_ID IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_ACTIVO IN NUMBER
    );
    
    PROCEDURE ELIMINAR (
        P_CATEGORIA_ID IN NUMBER
    );

END PKG_CATEGORIA;
/
CREATE OR REPLACE PACKAGE BODY PKG_CATEGORIA AS

    PROCEDURE LEER_TODAS (
        P_CATEGORIAS OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN P_CATEGORIAS FOR
            SELECT CATEGORIA_ID, NOMBRE, DESCRIPCION, ACTIVO
            FROM CATEGORIA
            ORDER BY NOMBRE;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20130, 'Error al listar las categorías: ' || SQLERRM);
    END LEER_TODAS;
    
    PROCEDURE CREAR (
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2
    ) AS
    BEGIN
        INSERT INTO CATEGORIA (NOMBRE, DESCRIPCION, ACTIVO)
        VALUES (P_NOMBRE, P_DESCRIPCION, 1);
        
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20131, 'Error: La categoría ' || P_NOMBRE || ' ya existe.');
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20132, 'Error al crear la categoría: ' || SQLERRM);
    END CREAR;

    PROCEDURE ACTUALIZAR (
        P_CATEGORIA_ID IN NUMBER,
        P_NOMBRE IN VARCHAR2,
        P_DESCRIPCION IN VARCHAR2,
        P_ACTIVO IN NUMBER
    ) AS
    BEGIN
        UPDATE CATEGORIA
        SET NOMBRE = P_NOMBRE,
            DESCRIPCION = P_DESCRIPCION,
            ACTIVO = P_ACTIVO
        WHERE CATEGORIA_ID = P_CATEGORIA_ID;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20133, 'No se encontró la categoría ID: ' || P_CATEGORIA_ID || ' para actualizar.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20134, 'Error al actualizar la categoría: ' || SQLERRM);
    END ACTUALIZAR;

    PROCEDURE ELIMINAR (
        P_CATEGORIA_ID IN NUMBER
    ) AS
    BEGIN
        DELETE FROM CATEGORIA
        WHERE CATEGORIA_ID = P_CATEGORIA_ID;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20135, 'No se encontró la categoría ID: ' || P_CATEGORIA_ID || ' a eliminar.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20136, 'Error al eliminar la categoría: ' || SQLERRM);
    END ELIMINAR;

END PKG_CATEGORIA;
/

CREATE OR REPLACE PACKAGE PKG_REPORTES_STOCK AS

    PROCEDURE SP_OBTENER_PRODUCTOS_DETALLE (
        p_cursor OUT SYS_REFCURSOR
    );

    PROCEDURE SP_TOP5_PRODUCTOS_MAS_VENDIDOS(
        p_categoria_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    );

END PKG_REPORTES_STOCK;
/

CREATE OR REPLACE PACKAGE BODY PKG_REPORTES_STOCK AS

    PROCEDURE SP_TOP5_PRODUCTOS_MAS_VENDIDOS(
        p_categoria_id IN NUMBER,
        p_cursor OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_cursor FOR
            SELECT *
            FROM (
                SELECT
                    p.ID_PRODUCTO,
                    p.NOMBRE,

                    -- Precio promedio
                    (SELECT AVG(e.PRECIO_UNITARIO)
                    FROM ENTRADAS e
                    WHERE e.PRODUCTO_ID = p.ID_PRODUCTO) AS PRECIO,

                    -- Primera imagen correcta
                    (SELECT img.URL
                    FROM IMAGENES_PRODUCTOS img
                    WHERE img.PRODUCTO_ID = p.ID_PRODUCTO
                    ORDER BY img.CREADO_EN
                    FETCH FIRST 1 ROWS ONLY) AS URL_IMAGEN,

                    -- Si no hay ventas → 0
                    NVL(SUM(s.CANTIDAD), 0) AS TOTAL_VENDIDO

                FROM PRODUCTOS p

                -- LEFT JOIN para incluir productos sin ventas
                LEFT JOIN SALIDAS s 
                    ON s.PRODUCTO_ID = p.ID_PRODUCTO

                WHERE p.ACTIVO = 1
                AND p.CATEGORIA_ID = p_categoria_id

                GROUP BY p.ID_PRODUCTO, p.NOMBRE
                ORDER BY TOTAL_VENDIDO DESC
            )
            WHERE ROWNUM <= 5;
    END SP_TOP5_PRODUCTOS_MAS_VENDIDOS;


    PROCEDURE SP_OBTENER_PRODUCTOS_DETALLE (
        p_cursor OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_cursor FOR
        SELECT
            p.ID_PRODUCTO,
            p.NOMBRE AS NOMBRE_PRODUCTO,
            c.NOMBRE AS NOMBRE_CATEGORIA,
            LISTAGG(ip.URL, '; ') WITHIN GROUP (ORDER BY ip.URL) AS URLS_IMAGENES,
            p.PRECIO_BASE AS PRECIO_BASE
        FROM PRODUCTOS p
        JOIN CATEGORIA c ON p.CATEGORIA_ID = c.CATEGORIA_ID
        LEFT JOIN IMAGENES_PRODUCTOS ip ON p.ID_PRODUCTO = ip.PRODUCTO_ID 
        WHERE p.ACTIVO = 1 
        GROUP BY
            p.ID_PRODUCTO,
            p.NOMBRE,
            c.NOMBRE,
            p.PRECIO_BASE;
            END SP_OBTENER_PRODUCTOS_DETALLE;

END PKG_REPORTES_STOCK;
/
