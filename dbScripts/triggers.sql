-- trigger para desactivar cupones vencidos
CREATE OR REPLACE TRIGGER trg_desactivar_cupon_vencido
AFTER INSERT OR UPDATE ON CUPONES
FOR EACH ROW
BEGIN
    IF :NEW.FIN_VIGENCIA < SYSDATE AND :NEW.ACTIVO = 1 THEN
        UPDATE CUPONES
        SET ACTIVO = 0
        WHERE ID_CUPON = :NEW.ID_CUPON;
    END IF;
END;

-- si el cupon llega al limite de usos se desactiva
CREATE OR REPLACE TRIGGER trg_cupon_limite_uso
BEFORE UPDATE OF CONTADOR_USO ON CUPONES
FOR EACH ROW
BEGIN
    IF :NEW.CONTADOR_USO >= :NEW.LIMITE_USO THEN
        :NEW.ACTIVO := 0;
    END IF;
END;


-- se incrementa el contador cuando se usa el cupon en factura
CREATE OR REPLACE TRIGGER trg_incrementar_uso_cupon
AFTER INSERT ON FACTURAS
FOR EACH ROW
BEGIN
    IF :NEW.CUPON_ID IS NOT NULL THEN
        UPDATE CUPONES
        SET CONTADOR_USO = CONTADOR_USO + 1
        WHERE ID_CUPON = :NEW.CUPON_ID;
    END IF;
END;


-- validar que las fechas del cupon sean correctas
CREATE OR REPLACE TRIGGER trg_validar_fechas_cupon
BEFORE INSERT OR UPDATE ON CUPONES
FOR EACH ROW
BEGIN
    -- la fecha de inicio
    IF :NEW.INICIO_VIGENCIA >= :NEW.FIN_VIGENCIA THEN
        RAISE_APPLICATION_ERROR(-20001, 
            'La fecha de inicio tiene que ser antes que la fecha fin');
    END IF;
    
    -- si ya esta vencido se desativa
    IF INSERTING AND :NEW.FIN_VIGENCIA < SYSDATE THEN
        :NEW.ACTIVO := 0;
    END IF;
END;


--PRODCUTOSSSS Y BODEGAS


-- este desactiva producto cuando el stock ya es muy bajo
CREATE OR REPLACE TRIGGER trg_desactivar_producto_stock
AFTER UPDATE OF CANTIDAD_DISPONIBLE ON PRODUCTOXBODEGA
FOR EACH ROW
DECLARE
    v_activo NUMBER;
BEGIN
    IF :NEW.CANTIDAD_DISPONIBLE <= :NEW.CANTIDAD_ALERTA THEN
        SELECT ACTIVO INTO v_activo
        FROM PRODUCTOS
        WHERE ID_PRODUCTO = :NEW.PRODUCTO_ID;
        
        IF v_activo = 1 THEN
            UPDATE PRODUCTOS
            SET ACTIVO = 0, ACTUALIZADO_EN = SYSDATE
            WHERE ID_PRODUCTO = :NEW.PRODUCTO_ID;
        END IF;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL;
END;




-- reactiva el producto cuando hay stock otra vez
CREATE OR REPLACE TRIGGER trg_reactivar_producto_stock
AFTER UPDATE OF CANTIDAD_DISPONIBLE ON PRODUCTOXBODEGA
FOR EACH ROW
DECLARE
    v_activo NUMBER;
    v_umbral NUMBER;
BEGIN
    v_umbral := :NEW.CANTIDAD_ALERTA * 1.1;
    
    IF :NEW.CANTIDAD_DISPONIBLE > :NEW.CANTIDAD_ALERTA THEN
        SELECT ACTIVO INTO v_activo
        FROM PRODUCTOS
        WHERE ID_PRODUCTO = :NEW.PRODUCTO_ID;
        
        IF v_activo = 0 AND :NEW.CANTIDAD_DISPONIBLE >= v_umbral THEN
            UPDATE PRODUCTOS
            SET ACTIVO = 1, ACTUALIZADO_EN = SYSDATE
            WHERE ID_PRODUCTO = :NEW.PRODUCTO_ID;
        END IF;
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        NULL;
END;


-- actualiza stock cuando hay entrada de productos
CREATE OR REPLACE TRIGGER trg_stock_entrada
AFTER INSERT ON ENTRADAS
FOR EACH ROW
BEGIN
    UPDATE PRODUCTOXBODEGA
    SET CANTIDAD_DISPONIBLE = CANTIDAD_DISPONIBLE + :NEW.CANTIDAD
    WHERE PRODUCTO_ID = :NEW.PRODUCTO_ID
      AND BODEGA_ID = :NEW.BODEGA_ID;
    
    -- si no existe el registro se crea
    IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO PRODUCTOXBODEGA (
            BODEGA_ID, PRODUCTO_ID, CANTIDAD_DISPONIBLE, 
            CANTIDAD_RESERVADA, CANTIDAD_ALERTA
        ) VALUES (
            :NEW.BODEGA_ID, :NEW.PRODUCTO_ID, :NEW.CANTIDAD, 0, 10
        );
    END IF;
END;


-- actualiza stock cuando hay salida de productos
CREATE OR REPLACE TRIGGER trg_stock_salida
AFTER INSERT ON SALIDAS
FOR EACH ROW
DECLARE
    v_stock NUMBER;
BEGIN
    SELECT CANTIDAD_DISPONIBLE INTO v_stock
    FROM PRODUCTOXBODEGA
    WHERE PRODUCTO_ID = :NEW.PRODUCTO_ID
      AND BODEGA_ID = :NEW.BODEGA_ID;
    
    IF v_stock < :NEW.CANTIDAD THEN
        RAISE_APPLICATION_ERROR(-20002, 
            'No hay suficiente stock. Disponible: ' || v_stock);
    END IF;
    
    UPDATE PRODUCTOXBODEGA
    SET CANTIDAD_DISPONIBLE = CANTIDAD_DISPONIBLE - :NEW.CANTIDAD
    WHERE PRODUCTO_ID = :NEW.PRODUCTO_ID
      AND BODEGA_ID = :NEW.BODEGA_ID;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20003, 
            'No hay stock registrado para ese producto en esa bodega');
END;


-- =======================
-- FACTURAS
-- =======================

-- crea la secuencia para numero de factura
CREATE SEQUENCE seq_num_factura
START WITH 1000
INCREMENT BY 1
NOCYCLE
CACHE 20;


-- genera numero de factura automatico
CREATE OR REPLACE TRIGGER trg_numero_factura
BEFORE INSERT ON FACTURAS
FOR EACH ROW
BEGIN
    IF :NEW.NUMERO_FACTURA IS NULL THEN
        :NEW.NUMERO_FACTURA := 'FAC-' || 
                               TO_CHAR(SYSDATE, 'YYYY') || '-' || 
                               LPAD(seq_num_factura.NEXTVAL, 4, '0');
    END IF;
END;