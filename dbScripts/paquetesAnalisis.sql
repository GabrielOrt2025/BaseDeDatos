-- ============================================
-- PAQUETE: ANALYTICS PARA DASHBOARD
-- ============================================

CREATE OR REPLACE PACKAGE PKG_ANALYTICS_DASHBOARD AS
    
    PROCEDURE SP_OBTENER_ORDENES_DIA(
        p_fecha IN DATE DEFAULT SYSDATE,
        p_total_ordenes OUT NUMBER,
        p_monto_total OUT NUMBER
    );
    
    PROCEDURE SP_OBTENER_VENTAS_DIA(
        p_fecha IN DATE DEFAULT SYSDATE,
        p_total_ventas OUT NUMBER,
        p_monto_ventas OUT NUMBER
    );
    
    FUNCTION FN_CONTAR_USUARIOS_ACTIVOS RETURN NUMBER;
    
    FUNCTION FN_CONTAR_PRODUCTOS_ACTIVOS RETURN NUMBER;
    
    PROCEDURE SP_ORDENES_RECIENTES(
        p_limite IN NUMBER DEFAULT 5,
        p_cursor OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_ALERTAS_STOCK_BAJO(
        p_limite IN NUMBER DEFAULT 3,
        p_cursor OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_ACTIVIDADES_RECIENTES(
        p_limite IN NUMBER DEFAULT 10,
        p_cursor OUT SYS_REFCURSOR
    );
    
    PROCEDURE SP_RESUMEN_DASHBOARD(
        p_ordenes_hoy OUT NUMBER,
        p_monto_ordenes_hoy OUT NUMBER,
        p_ventas_hoy OUT NUMBER,
        p_monto_ventas_hoy OUT NUMBER,
        p_usuarios_activos OUT NUMBER,
        p_productos_activos OUT NUMBER
    );

END PKG_ANALYTICS_DASHBOARD;
/

CREATE OR REPLACE PACKAGE BODY PKG_ANALYTICS_DASHBOARD AS

    -- ============================================
    -- Total de órdenes del día
    -- ============================================
    PROCEDURE SP_OBTENER_ORDENES_DIA(
        p_fecha IN DATE DEFAULT SYSDATE,
        p_total_ordenes OUT NUMBER,
        p_monto_total OUT NUMBER
    )
    AS
    BEGIN
        SELECT 
            COUNT(*),
            NVL(SUM(TOTAL), 0)
        INTO 
            p_total_ordenes,
            p_monto_total
        FROM ORDENES
        WHERE TRUNC(FEHA_ORDEN) = TRUNC(p_fecha);
        
    EXCEPTION
        WHEN OTHERS THEN
            p_total_ordenes := 0;
            p_monto_total := 0;
            RAISE_APPLICATION_ERROR(-20500, 'Error al obtener órdenes del día: ' || SQLERRM);
    END SP_OBTENER_ORDENES_DIA;

    -- ============================================
    -- Ventas del día (facturas pagadas/completadas)
    -- ============================================
    PROCEDURE SP_OBTENER_VENTAS_DIA(
        p_fecha IN DATE DEFAULT SYSDATE,
        p_total_ventas OUT NUMBER,
        p_monto_ventas OUT NUMBER
    )
    AS
    BEGIN
        SELECT 
            COUNT(*),
            NVL(SUM(TOTAL), 0)
        INTO 
            p_total_ventas,
            p_monto_ventas
        FROM FACTURAS
        WHERE TRUNC(FECHA_EMISION) = TRUNC(p_fecha)
        AND ESTADO IN ('PAGADO', 'COMPLETADO');
        
    EXCEPTION
        WHEN OTHERS THEN
            p_total_ventas := 0;
            p_monto_ventas := 0;
            RAISE_APPLICATION_ERROR(-20501, 'Error al obtener ventas del día: ' || SQLERRM);
    END SP_OBTENER_VENTAS_DIA;

    -- ============================================
    -- Contar usuarios activos
    -- ============================================
    FUNCTION FN_CONTAR_USUARIOS_ACTIVOS RETURN NUMBER
    AS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM USUARIOS
        WHERE ACTIVO = 1;
        
        RETURN v_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 0;
    END FN_CONTAR_USUARIOS_ACTIVOS;

    -- ============================================
    -- Contar productos activos
    -- ============================================
    FUNCTION FN_CONTAR_PRODUCTOS_ACTIVOS RETURN NUMBER
    AS
        v_count NUMBER := 0;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM PRODUCTOS
        WHERE ACTIVO = 1;
        
        RETURN v_count;
        
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 0;
    END FN_CONTAR_PRODUCTOS_ACTIVOS;

    -- ============================================
    -- Órdenes recientes
    -- ============================================
    PROCEDURE SP_ORDENES_RECIENTES(
        p_limite IN NUMBER DEFAULT 5,
        p_cursor OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                o.ID_ORDEN,
                o.NUMERO_ORDEN,
                o.USUARIO_ID,
                u.NOMBRE AS NOMBRE_USUARIO,
                u.EMAIL,
                o.ESTADO,
                o.TOTAL,
                o.FEHA_ORDEN,
                s.NOMBRE AS SUCURSAL
            FROM ORDENES o
            JOIN USUARIOS u ON o.USUARIO_ID = u.USUARIO_ID
            LEFT JOIN SUCURSAL s ON o.SUCURSAL_ID = s.SUCURSAL_ID
            ORDER BY o.FEHA_ORDEN DESC
            FETCH FIRST p_limite ROWS ONLY;
            
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20502, 'Error al obtener órdenes recientes: ' || SQLERRM);
    END SP_ORDENES_RECIENTES;

    -- ============================================
    -- Alertas de stock bajo
    -- ============================================
    PROCEDURE SP_ALERTAS_STOCK_BAJO(
        p_limite IN NUMBER DEFAULT 3,
        p_cursor OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_cursor FOR
            SELECT 
                p.ID_PRODUCTO,
                p.NOMBRE AS PRODUCTO,
                p.SKU,
                c.NOMBRE AS CATEGORIA,
                pb.CANTIDAD_DISPONIBLE,
                pb.CANTIDAD_RESERVADA,
                pb.CANTIDAD_ALERTA,
                b.NOMBRE AS BODEGA,
                (pb.CANTIDAD_DISPONIBLE - NVL(pb.CANTIDAD_RESERVADA, 0)) AS STOCK_NETO
            FROM PRODUCTOXBODEGA pb
            JOIN PRODUCTOS p ON pb.PRODUCTO_ID = p.ID_PRODUCTO
            JOIN BODEGA b ON pb.BODEGA_ID = b.BODEGA_ID
            LEFT JOIN CATEGORIA c ON p.CATEGORIA_ID = c.CATEGORIA_ID
            WHERE p.ACTIVO = 1
            AND pb.CANTIDAD_DISPONIBLE <= pb.CANTIDAD_ALERTA
            ORDER BY (pb.CANTIDAD_DISPONIBLE - pb.CANTIDAD_ALERTA) ASC
            FETCH FIRST p_limite ROWS ONLY;
            
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20503, 'Error al obtener alertas de stock: ' || SQLERRM);
    END SP_ALERTAS_STOCK_BAJO;

    -- ============================================
    -- Actividades recientes del sistema
    -- ============================================
    PROCEDURE SP_ACTIVIDADES_RECIENTES(
        p_limite IN NUMBER DEFAULT 10,
        p_cursor OUT SYS_REFCURSOR
    )
    AS
    BEGIN
        OPEN p_cursor FOR
            SELECT * FROM (
                SELECT 
                    'ORDEN' AS TIPO_ACTIVIDAD,
                    o.ID_ORDEN AS ENTIDAD_ID,
                    o.NUMERO_ORDEN AS REFERENCIA,
                    'Nueva orden creada' AS DESCRIPCION,
                    u.NOMBRE AS USUARIO,
                    o.FEHA_ORDEN AS FECHA_ACTIVIDAD,
                    o.TOTAL AS MONTO
                FROM ORDENES o
                JOIN USUARIOS u ON o.USUARIO_ID = u.USUARIO_ID
                
                UNION ALL
                
                SELECT 
                    'FACTURA' AS TIPO_ACTIVIDAD,
                    f.ID_FACTURA AS ENTIDAD_ID,
                    f.NUMERO_FACTURA AS REFERENCIA,
                    'Factura emitida - ' || f.ESTADO AS DESCRIPCION,
                    u.NOMBRE AS USUARIO,
                    f.FECHA_EMISION AS FECHA_ACTIVIDAD,
                    f.TOTAL AS MONTO
                FROM FACTURAS f
                JOIN USUARIOS u ON f.USUARIO_ID = u.USUARIO_ID
                
                UNION ALL
                
                SELECT 
                    'USUARIO' AS TIPO_ACTIVIDAD,
                    u.USUARIO_ID AS ENTIDAD_ID,
                    u.EMAIL AS REFERENCIA,
                    'Nuevo usuario registrado' AS DESCRIPCION,
                    u.NOMBRE AS USUARIO,
                    u.CREADO_EN AS FECHA_ACTIVIDAD,
                    NULL AS MONTO
                FROM USUARIOS u
                WHERE u.CREADO_EN >= SYSDATE - 7 -- Últimos 7 días
                
                UNION ALL
                
                SELECT 
                    'ENTRADA' AS TIPO_ACTIVIDAD,
                    e.ID_ENTRADA AS ENTIDAD_ID,
                    p.NOMBRE AS REFERENCIA,
                    'Entrada de inventario: ' || e.CANTIDAD || ' unidades' AS DESCRIPCION,
                    u.NOMBRE AS USUARIO,
                    e.CREADO_EN AS FECHA_ACTIVIDAD,
                    (e.CANTIDAD * e.PRECIO_UNITARIO) AS MONTO
                FROM ENTRADAS e
                JOIN PRODUCTOS p ON e.PRODUCTO_ID = p.ID_PRODUCTO
                LEFT JOIN USUARIOS u ON e.CREADO_POR = u.USUARIO_ID
                WHERE e.CREADO_EN >= SYSDATE - 7
                
                UNION ALL
                
                SELECT 
                    'SALIDA' AS TIPO_ACTIVIDAD,
                    s.ID_SALIDA AS ENTIDAD_ID,
                    p.NOMBRE AS REFERENCIA,
                    'Salida de inventario: ' || s.CANTIDAD || ' unidades' AS DESCRIPCION,
                    u.NOMBRE AS USUARIO,
                    s.CREADO_EN AS FECHA_ACTIVIDAD,
                    NULL AS MONTO
                FROM SALIDAS s
                JOIN PRODUCTOS p ON s.PRODUCTO_ID = p.ID_PRODUCTO
                LEFT JOIN USUARIOS u ON s.CREADO_POR = u.USUARIO_ID
                WHERE s.CREADO_EN >= SYSDATE - 7
            )
            ORDER BY FECHA_ACTIVIDAD DESC
            FETCH FIRST p_limite ROWS ONLY;
            
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20504, 'Error al obtener actividades recientes: ' || SQLERRM);
    END SP_ACTIVIDADES_RECIENTES;

    -- ============================================
    -- Resumen general del dashboard
    -- ============================================
    PROCEDURE SP_RESUMEN_DASHBOARD(
        p_ordenes_hoy OUT NUMBER,
        p_monto_ordenes_hoy OUT NUMBER,
        p_ventas_hoy OUT NUMBER,
        p_monto_ventas_hoy OUT NUMBER,
        p_usuarios_activos OUT NUMBER,
        p_productos_activos OUT NUMBER
    )
    AS
    BEGIN
        SP_OBTENER_ORDENES_DIA(SYSDATE, p_ordenes_hoy, p_monto_ordenes_hoy);
        
        SP_OBTENER_VENTAS_DIA(SYSDATE, p_ventas_hoy, p_monto_ventas_hoy);
        
        p_usuarios_activos := FN_CONTAR_USUARIOS_ACTIVOS();
        
        p_productos_activos := FN_CONTAR_PRODUCTOS_ACTIVOS();
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20505, 'Error al obtener resumen del dashboard: ' || SQLERRM);
    END SP_RESUMEN_DASHBOARD;

END PKG_ANALYTICS_DASHBOARD;
/