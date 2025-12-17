-- ============================================
-- PAQUETE: GESTIÓN DE CARRITO
-- ============================================

CREATE OR REPLACE PACKAGE PKG_CARRITO AS
    
    PROCEDURE SP_ACTUALIZAR_CANTIDAD_RESERVADA(
        p_id_producto IN NUMBER,
        p_id_bodega IN NUMBER,
        p_cantidad_a_reservar IN NUMBER,
        p_resultado OUT VARCHAR2
    );

    PROCEDURE SP_LIBERAR_CANTIDAD_RESERVADA(
        p_id_producto IN NUMBER,
        p_id_bodega IN NUMBER,
        p_cantidad_a_liberar IN NUMBER,
        p_resultado OUT VARCHAR2
    );

    PROCEDURE SP_CARRITO_OBTENER_O_CREAR(
        p_usuario_id IN NUMBER,
        p_carrito_id OUT NUMBER
    );
    
    PROCEDURE SP_CARRITO_AGREGAR_ITEM(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad IN NUMBER,
        p_precio_unitario IN NUMBER
    );
    
    PROCEDURE SP_CARRITO_ACTUALIZAR_CANTIDAD(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad IN NUMBER
    );
    
    PROCEDURE SP_CARRITO_ELIMINAR_ITEM(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad_eliminada OUT NUMBER
    );
    
    PROCEDURE SP_CARRITO_VACIAR(
        p_usuario_id IN NUMBER
    );
    
    PROCEDURE SP_CARRITO_LEER(
        p_usuario_id IN NUMBER,
        p_items OUT SYS_REFCURSOR
    );
    
    -- Funciones
    FUNCTION FN_CARRITO_CALCULAR_TOTAL(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;
    
    FUNCTION FN_CARRITO_CONTAR_ITEMS(
        p_usuario_id IN NUMBER
    ) RETURN NUMBER;

END PKG_CARRITO;
/

CREATE OR REPLACE PACKAGE BODY PKG_CARRITO AS

    PROCEDURE SP_ACTUALIZAR_CANTIDAD_RESERVADA (
        p_id_producto IN NUMBER,
        p_id_bodega IN NUMBER,
        p_cantidad_a_reservar IN NUMBER,
        p_resultado OUT VARCHAR2
    )
    AS
        v_stock_neto_actual NUMBER;
    BEGIN
        SELECT (CANTIDAD_DISPONIBLE - NVL(CANTIDAD_RESERVADA, 0))
        INTO v_stock_neto_actual
        FROM PRODUCTOXBODEGA
        WHERE PRODUCTO_ID = p_id_producto
          AND BODEGA_ID = p_id_bodega
        FOR UPDATE;

        IF v_stock_neto_actual >= p_cantidad_a_reservar THEN
            UPDATE PRODUCTOXBODEGA
            SET CANTIDAD_RESERVADA = NVL(CANTIDAD_RESERVADA, 0) + p_cantidad_a_reservar
            WHERE PRODUCTO_ID = p_id_producto
              AND BODEGA_ID = p_id_bodega;

            p_resultado := 'EXITO';
            COMMIT; 
        ELSE
            p_resultado := 'ERROR: Stock insuficiente. Disponible real: ' || v_stock_neto_actual;
            ROLLBACK;
        END IF;
        
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_resultado := 'ERROR: Producto/Bodega no encontrados.';
            ROLLBACK;
        WHEN OTHERS THEN
            p_resultado := 'ERROR DESCONOCIDO: ' || SQLERRM;
            ROLLBACK;
    END SP_ACTUALIZAR_CANTIDAD_RESERVADA;

    PROCEDURE SP_LIBERAR_CANTIDAD_RESERVADA (
        p_id_producto IN NUMBER,
        p_id_bodega IN NUMBER,
        p_cantidad_a_liberar IN NUMBER,
        p_resultado OUT VARCHAR2
    )
    AS
        v_cantidad_reservada_actual NUMBER;
    BEGIN
        SELECT NVL(CANTIDAD_RESERVADA, 0)
        INTO v_cantidad_reservada_actual
        FROM PRODUCTOXBODEGA
        WHERE PRODUCTO_ID = p_id_producto
          AND BODEGA_ID = p_id_bodega
        FOR UPDATE;

        IF v_cantidad_reservada_actual >= p_cantidad_a_liberar THEN
            UPDATE PRODUCTOXBODEGA
            SET CANTIDAD_RESERVADA = CANTIDAD_RESERVADA - p_cantidad_a_liberar
            WHERE PRODUCTO_ID = p_id_producto
              AND BODEGA_ID = p_id_bodega;

            p_resultado := 'EXITO';
            COMMIT; 
        ELSE
            p_resultado := 'ERROR: Intenta liberar mas de lo reservado.';
            ROLLBACK;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_resultado := 'ERROR: Producto no encontrado.';
            ROLLBACK;
        WHEN OTHERS THEN
            p_resultado := 'ERROR: ' || SQLERRM;
            ROLLBACK;
    END SP_LIBERAR_CANTIDAD_RESERVADA;

    PROCEDURE SP_CARRITO_OBTENER_O_CREAR(
        p_usuario_id IN NUMBER,
        p_carrito_id OUT NUMBER
    )
    AS
    BEGIN
        BEGIN
            SELECT CARRITO_ID INTO p_carrito_id
            FROM CARRITO
            WHERE USUARIO_ID = p_usuario_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                INSERT INTO CARRITO (USUARIO_ID)
                VALUES (p_usuario_id)
                RETURNING CARRITO_ID INTO p_carrito_id;
        END;
    END SP_CARRITO_OBTENER_O_CREAR;

    PROCEDURE SP_CARRITO_AGREGAR_ITEM(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad IN NUMBER,
        p_precio_unitario IN NUMBER
    )
    AS
        v_carrito_id NUMBER;
        v_cantidad_existente NUMBER := 0;
    BEGIN
        IF p_cantidad <= 0 THEN RAISE_APPLICATION_ERROR(-20301, 'Cantidad debe ser > 0'); END IF;
        
        SP_CARRITO_OBTENER_O_CREAR(p_usuario_id, v_carrito_id);
        
        BEGIN
            SELECT CANTIDAD INTO v_cantidad_existente
            FROM ITEM_CARRITO
            WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
            
            UPDATE ITEM_CARRITO
            SET CANTIDAD = v_cantidad_existente + p_cantidad, ACTUALIZADO_EN = SYSDATE
            WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                INSERT INTO ITEM_CARRITO (CARRITO_ID, PRODUCTO_ID, CANTIDAD, PRECIO_UNITARIO) 
                VALUES (v_carrito_id, p_producto_id, p_cantidad, p_precio_unitario);
        END;
        
        UPDATE CARRITO SET ACTUALIZADO_EN = SYSDATE WHERE CARRITO_ID = v_carrito_id;
    END SP_CARRITO_AGREGAR_ITEM;

    PROCEDURE SP_CARRITO_ACTUALIZAR_CANTIDAD(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad IN NUMBER
    )
    AS
        v_carrito_id NUMBER;
        v_cantidad_anterior NUMBER;
        v_diferencia NUMBER;
        v_bodega_default CONSTANT NUMBER := 2;
        v_resultado_reserva VARCHAR2(200);
    BEGIN
        IF p_cantidad <= 0 THEN RAISE_APPLICATION_ERROR(-20304, 'Cantidad debe ser > 0'); END IF;
        
        SP_CARRITO_OBTENER_O_CREAR(p_usuario_id, v_carrito_id);
        
        BEGIN
            SELECT CANTIDAD INTO v_cantidad_anterior
            FROM ITEM_CARRITO
            WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN RAISE_APPLICATION_ERROR(-20305, 'Item no encontrado');
        END;

        v_diferencia := p_cantidad - v_cantidad_anterior;

        IF v_diferencia > 0 THEN
            SP_ACTUALIZAR_CANTIDAD_RESERVADA(p_producto_id, v_bodega_default, v_diferencia, v_resultado_reserva);
            IF v_resultado_reserva != 'EXITO' THEN RAISE_APPLICATION_ERROR(-20306, 'Fallo reserva: ' || v_resultado_reserva); END IF;
        ELSIF v_diferencia < 0 THEN
            SP_LIBERAR_CANTIDAD_RESERVADA(p_producto_id, v_bodega_default, ABS(v_diferencia), v_resultado_reserva);
            IF v_resultado_reserva != 'EXITO' THEN RAISE_APPLICATION_ERROR(-20307, 'Fallo liberar: ' || v_resultado_reserva); END IF;
        END IF;

        UPDATE ITEM_CARRITO SET CANTIDAD = p_cantidad, ACTUALIZADO_EN = SYSDATE
        WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
        
        UPDATE CARRITO SET ACTUALIZADO_EN = SYSDATE WHERE CARRITO_ID = v_carrito_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; RAISE;
    END SP_CARRITO_ACTUALIZAR_CANTIDAD;

    PROCEDURE SP_CARRITO_ELIMINAR_ITEM(
        p_usuario_id IN NUMBER,
        p_producto_id IN NUMBER,
        p_cantidad_eliminada OUT NUMBER
    )
    AS
        v_carrito_id NUMBER;
    BEGIN
        SP_CARRITO_OBTENER_O_CREAR(p_usuario_id, v_carrito_id);
        
        BEGIN
            SELECT CANTIDAD INTO p_cantidad_eliminada
            FROM ITEM_CARRITO
            WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
            
            DELETE FROM ITEM_CARRITO
            WHERE CARRITO_ID = v_carrito_id AND PRODUCTO_ID = p_producto_id;
            
            UPDATE CARRITO SET ACTUALIZADO_EN = SYSDATE WHERE CARRITO_ID = v_carrito_id;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN p_cantidad_eliminada := 0; -- No existía
        END;
    END SP_CARRITO_ELIMINAR_ITEM;

    PROCEDURE SP_CARRITO_VACIAR(
        p_usuario_id IN NUMBER
    )
    AS
        v_carrito_id NUMBER;
        v_resultado VARCHAR2(100);
        v_bodega_default CONSTANT NUMBER := 2;
        CURSOR c_items IS SELECT PRODUCTO_ID, CANTIDAD FROM ITEM_CARRITO WHERE CARRITO_ID = v_carrito_id;
    BEGIN
        BEGIN
            SELECT CARRITO_ID INTO v_carrito_id FROM CARRITO WHERE USUARIO_ID = p_usuario_id;
            
            FOR item IN c_items LOOP
                SP_LIBERAR_CANTIDAD_RESERVADA(item.PRODUCTO_ID, v_bodega_default, item.CANTIDAD, v_resultado);
            END LOOP;
            
            DELETE FROM ITEM_CARRITO WHERE CARRITO_ID = v_carrito_id;
            UPDATE CARRITO SET ACTUALIZADO_EN = SYSDATE WHERE CARRITO_ID = v_carrito_id;
            COMMIT;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN NULL;
            WHEN OTHERS THEN ROLLBACK; RAISE;
        END;
    END SP_CARRITO_VACIAR;

    PROCEDURE SP_CARRITO_LEER(
        p_usuario_id IN NUMBER,
        p_items OUT SYS_REFCURSOR
    )
    AS
        v_carrito_id NUMBER;
    BEGIN
        BEGIN
            SELECT CARRITO_ID INTO v_carrito_id FROM CARRITO WHERE USUARIO_ID = p_usuario_id;
            OPEN p_items FOR
                SELECT ic.ITEM_CARRITO_ID, ic.PRODUCTO_ID, p.NOMBRE, p.SKU, ic.CANTIDAD, ic.PRECIO_UNITARIO,
                       (ic.CANTIDAD * ic.PRECIO_UNITARIO) AS SUBTOTAL, c.NOMBRE, ip.URL
                FROM ITEM_CARRITO ic
                JOIN PRODUCTOS p ON ic.PRODUCTO_ID = p.ID_PRODUCTO
                LEFT JOIN CATEGORIA c ON p.CATEGORIA_ID = c.CATEGORIA_ID
                LEFT JOIN (SELECT PRODUCTO_ID, MIN(URL) AS URL FROM IMAGENES_PRODUCTOS GROUP BY PRODUCTO_ID) ip 
                ON p.ID_PRODUCTO = ip.PRODUCTO_ID
                WHERE ic.CARRITO_ID = v_carrito_id
                ORDER BY ic.CREADO_EN DESC;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN OPEN p_items FOR SELECT NULL FROM DUAL WHERE 1=0;
        END;
    END SP_CARRITO_LEER;

    FUNCTION FN_CARRITO_CALCULAR_TOTAL(p_usuario_id IN NUMBER) RETURN NUMBER AS
        v_total NUMBER := 0;
        v_carrito_id NUMBER;
    BEGIN
        SELECT CARRITO_ID INTO v_carrito_id FROM CARRITO WHERE USUARIO_ID = p_usuario_id;
        SELECT NVL(SUM(CANTIDAD * PRECIO_UNITARIO), 0) INTO v_total FROM ITEM_CARRITO WHERE CARRITO_ID = v_carrito_id;
        RETURN v_total;
    EXCEPTION WHEN OTHERS THEN RETURN 0;
    END FN_CARRITO_CALCULAR_TOTAL;

    FUNCTION FN_CARRITO_CONTAR_ITEMS(p_usuario_id IN NUMBER) RETURN NUMBER AS
        v_count NUMBER := 0;
        v_carrito_id NUMBER;
    BEGIN
        SELECT CARRITO_ID INTO v_carrito_id FROM CARRITO WHERE USUARIO_ID = p_usuario_id;
        SELECT NVL(SUM(CANTIDAD), 0) INTO v_count FROM ITEM_CARRITO WHERE CARRITO_ID = v_carrito_id;
        RETURN v_count;
    EXCEPTION WHEN OTHERS THEN RETURN 0;
    END FN_CARRITO_CONTAR_ITEMS;

END PKG_CARRITO;
/

-- ============================================
-- PAQUETE: GESTIÓN DE VENTAS Y ÓRDENES
-- ============================================

CREATE OR REPLACE PACKAGE PKG_VENTAS AS
    
    -- Procedimientos
    PROCEDURE SP_ORDEN_CREAR_DESDE_CARRITO(
        p_usuario_id IN NUMBER,
        p_sucursal_id IN NUMBER,
        p_direccion_envio_id IN NUMBER,
        p_metodo_pago IN VARCHAR2,
        p_notas IN VARCHAR2,
        p_orden_id OUT NUMBER,
        p_numero_orden OUT VARCHAR2,
        p_factura_id OUT NUMBER
    );
    
    PROCEDURE SP_ORDEN_ACTUALIZAR_ESTADO(
        p_orden_id IN NUMBER,
        p_nuevo_estado IN VARCHAR2
    );
    
    PROCEDURE SP_ORDEN_LEER_POR_USUARIO(
        p_usuario_id IN NUMBER,
        p_ordenes OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_ORDEN_DETALLE(
        p_orden_id IN NUMBER,
        p_detalle OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_PROCESAR_PAGO(
        p_factura_id IN NUMBER,
        p_monto IN NUMBER,
        p_metodo_pago IN VARCHAR2,
        p_pago_id OUT NUMBER
    );
    
    -- Funciones
    FUNCTION FN_GENERAR_NUMERO_ORDEN RETURN VARCHAR2;
    
    FUNCTION FN_GENERAR_NUMERO_FACTURA RETURN VARCHAR2;

END PKG_VENTAS;
/

CREATE OR REPLACE PACKAGE BODY PKG_VENTAS AS

    -- Generar número de orden único
    FUNCTION FN_GENERAR_NUMERO_ORDEN RETURN VARCHAR2
    AS
        v_numero VARCHAR2(50);
        v_existe NUMBER;
    BEGIN
        LOOP
            v_numero := 'ORD-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || 
                        LPAD(DBMS_RANDOM.VALUE(1000, 9999), 4, '0');
            
            SELECT COUNT(*) INTO v_existe
            FROM ORDENES
            WHERE NUMERO_ORDEN = v_numero;
            
            EXIT WHEN v_existe = 0;
        END LOOP;
        
        RETURN v_numero;
    END FN_GENERAR_NUMERO_ORDEN;

    -- Generar número de factura único
    FUNCTION FN_GENERAR_NUMERO_FACTURA RETURN VARCHAR2
    AS
        v_numero VARCHAR2(50);
        v_existe NUMBER;
    BEGIN
        LOOP
            v_numero := 'FAC-' || TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || 
                        LPAD(DBMS_RANDOM.VALUE(10000, 99999), 5, '0');
            
            SELECT COUNT(*) INTO v_existe
            FROM FACTURAS
            WHERE NUMERO_FACTURA = v_numero;
            
            EXIT WHEN v_existe = 0;
        END LOOP;
        
        RETURN v_numero;
    END FN_GENERAR_NUMERO_FACTURA;

    -- Crear orden desde carrito
    PROCEDURE SP_ORDEN_CREAR_DESDE_CARRITO(
        p_usuario_id IN NUMBER,
        p_sucursal_id IN NUMBER,
        p_direccion_envio_id IN NUMBER,
        p_metodo_pago IN VARCHAR2,
        p_notas IN VARCHAR2,
        p_orden_id OUT NUMBER,
        p_numero_orden OUT VARCHAR2,
        p_factura_id OUT NUMBER
    )
    AS
        v_carrito_id NUMBER;
        v_subtotal NUMBER := 0;
        v_total NUMBER := 0;
        v_numero_factura VARCHAR2(50);
        v_item_count NUMBER := 0;
    BEGIN
        -- Verificar que el carrito tenga items
        SELECT CARRITO_ID INTO v_carrito_id
        FROM CARRITO
        WHERE USUARIO_ID = p_usuario_id;
        
        SELECT COUNT(*) INTO v_item_count
        FROM ITEM_CARRITO
        WHERE CARRITO_ID = v_carrito_id;
        
        IF v_item_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20401, 'El carrito está vacío.');
        END IF;
        
        -- Calcular subtotal
        v_subtotal := PKG_CARRITO.FN_CARRITO_CALCULAR_TOTAL(p_usuario_id);
        v_total := v_subtotal; -- Aquí puedes agregar impuestos, envío, etc.
        
        -- Generar número de orden
        p_numero_orden := FN_GENERAR_NUMERO_ORDEN();
        
        -- Crear orden
        INSERT INTO ORDENES (
            USUARIO_ID,
            SUCURSAL_ID,
            NUMERO_ORDEN,
            ESTADO,
            SUBTOTAL,
            TOTAL,
            METODO_PAGO,
            DIRECCION_ENVIO_ID,
            NOTAS
        ) VALUES (
            p_usuario_id,
            p_sucursal_id,
            p_numero_orden,
            'PENDIENTE',
            v_subtotal,
            v_total,
            p_metodo_pago,
            p_direccion_envio_id,
            p_notas
        ) RETURNING ID_ORDEN INTO p_orden_id;
        
        -- Crear factura
        v_numero_factura := FN_GENERAR_NUMERO_FACTURA();
        
        INSERT INTO FACTURAS (
            NUMERO_FACTURA,
            CANAL_ID,
            SUCURSAL_ID,
            ORDEN_ID,
            TOTAL,
            DESCUENTOS,
            ESTADO,
            USUARIO_ID
        ) VALUES (
            v_numero_factura,
            1, -- Canal Web
            p_sucursal_id,
            p_orden_id,
            v_total,
            0,
            'PENDIENTE',
            p_usuario_id
        ) RETURNING ID_FACTURA INTO p_factura_id;
        
        -- Registrar salidas de inventario
        FOR item IN (
            SELECT PRODUCTO_ID, CANTIDAD
            FROM ITEM_CARRITO
            WHERE CARRITO_ID = v_carrito_id
        ) LOOP
            INSERT INTO SALIDAS (
                PRODUCTO_ID,
                BODEGA_ID,
                TIPO_SALIDA_ID,
                CANTIDAD,
                REFERENCIA,
                CREADO_POR
            ) VALUES (
                item.PRODUCTO_ID,
                1, -- Bodega principal por defecto
                1, -- Tipo salida: Venta
                item.CANTIDAD,
                'Orden: ' || p_numero_orden,
                p_usuario_id
            );
        END LOOP;
        
        -- Vaciar carrito
        PKG_CARRITO.SP_CARRITO_VACIAR(p_usuario_id);
        
        COMMIT;
        
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE_APPLICATION_ERROR(-20402, 'Error al crear orden: ' || SQLERRM);
    END SP_ORDEN_CREAR_DESDE_CARRITO;

    -- Actualizar estado de orden
    PROCEDURE SP_ORDEN_ACTUALIZAR_ESTADO(
        p_orden_id IN NUMBER,
        p_nuevo_estado IN VARCHAR2
    )
    AS
    BEGIN
        UPDATE ORDENES
        SET ESTADO = p_nuevo_estado,
            FECHA_COMPLETADO = CASE 
                WHEN p_nuevo_estado = 'COMPLETADO' THEN SYSDATE 
                ELSE FECHA_COMPLETADO 
            END
        WHERE ID_ORDEN = p_orden_id;
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20403, 'Orden no encontrada.');
        END IF;
        
        -- Actualizar estado de factura relacionada
        UPDATE FACTURAS
        SET ESTADO = p_nuevo_estado
        WHERE ORDEN_ID = p_orden_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20404, 'Error al actualizar estado: ' || SQLERRM);
    END SP_ORDEN_ACTUALIZAR_ESTADO;

    -- Leer órdenes por usuario
    PROCEDURE SP_ORDEN_LEER_POR_USUARIO(
        p_usuario_id IN NUMBER,
        p_ordenes OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_ordenes FOR
            SELECT 
                o.ID_ORDEN,
                o.NUMERO_ORDEN,
                o.ESTADO,
                o.SUBTOTAL,
                o.TOTAL,
                o.METODO_PAGO,
                o.FEHA_ORDEN,
                o.FECHA_COMPLETADO,
                s.NOMBRE AS SUCURSAL,
                f.NUMERO_FACTURA
            FROM ORDENES o
            LEFT JOIN SUCURSAL s ON o.SUCURSAL_ID = s.SUCURSAL_ID
            LEFT JOIN FACTURAS f ON o.ID_ORDEN = f.ORDEN_ID
            WHERE o.USUARIO_ID = p_usuario_id
            ORDER BY o.FEHA_ORDEN DESC;
    END SP_ORDEN_LEER_POR_USUARIO;

    -- Obtener detalle de una orden
    PROCEDURE SP_ORDEN_DETALLE(
        p_orden_id IN NUMBER,
        p_detalle OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_detalle FOR
            SELECT 
                s.ID_SALIDA,
                p.ID_PRODUCTO,
                p.NOMBRE AS PRODUCTO_NOMBRE,
                p.SKU,
                s.CANTIDAD,
                p.PRECIO_BASE AS PRECIO_UNITARIO,
                (s.CANTIDAD * p.PRECIO_BASE) AS SUBTOTAL,
                ip.URL AS IMAGEN_URL
            FROM SALIDAS s
            JOIN PRODUCTOS p ON s.PRODUCTO_ID = p.ID_PRODUCTO
            LEFT JOIN (
                SELECT PRODUCTO_ID, MIN(URL) AS URL
                FROM IMAGENES_PRODUCTOS
                GROUP BY PRODUCTO_ID
            ) ip ON p.ID_PRODUCTO = ip.PRODUCTO_ID
            WHERE s.REFERENCIA LIKE '%' || (
                SELECT NUMERO_ORDEN 
                FROM ORDENES 
                WHERE ID_ORDEN = p_orden_id
            ) || '%'
            ORDER BY s.ID_SALIDA;
    END SP_ORDEN_DETALLE;

    -- Procesar pago
    PROCEDURE SP_PROCESAR_PAGO(
        p_factura_id IN NUMBER,
        p_monto IN NUMBER,
        p_metodo_pago IN VARCHAR2,
        p_pago_id OUT NUMBER
    )
    AS
    BEGIN
        INSERT INTO PAGOS (
            FACTURA_ID,
            MONTO,
            MONEDA,
            ESTADO_PAGO,
            METODO_PAGO
        ) VALUES (
            p_factura_id,
            p_monto,
            'CRC',
            'APROBADO',
            p_metodo_pago
        ) RETURNING ID_PAGO INTO p_pago_id;
        
        -- Actualizar estado de factura
        UPDATE FACTURAS
        SET ESTADO = 'PAGADO'
        WHERE ID_FACTURA = p_factura_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20405, 'Error al procesar pago: ' || SQLERRM);
    END SP_PROCESAR_PAGO;

END PKG_VENTAS;
/

