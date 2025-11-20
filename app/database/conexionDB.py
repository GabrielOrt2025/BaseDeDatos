import oracledb
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import Config

pool = None

def init_oracle_pool():
    global pool
    
    # Si el pool ya existe, no crear uno nuevo
    if pool is not None:
        try:
            # Verificar si el pool está activo
            test_conn = pool.acquire()
            test_conn.close()
            print("Oracle connection pool ya está inicializado y funcionando!")
            return
        except:
            # Si falla, cerrar el pool viejo y crear uno nuevo
            try:
                pool.close()
            except:
                pass
            pool = None
    
    # Crear nuevo pool
    pool = oracledb.create_pool(
        user=Config.DATABASE_USER,
        password=Config.DATABASE_PASSWORD,
        dsn=Config.DATABASE_DNS,
        min=1,
        max=5,
        increment=1,
        homogeneous=True,
        timeout=60,
        wait_timeout=60,
        max_lifetime_session=3600
    )
    print("Oracle connection pool initialized!")

def get_db_connection():
    global pool
    if pool is None:
        raise RuntimeError("El pool de conexiones no ha sido inicializado. Llama a init_oracle_pool() primero.")
    return pool.acquire()

def close_pool():
    """Cierra el pool de conexiones"""
    global pool
    if pool is not None:
        try:
            pool.close()
            pool = None
            print("Oracle connection pool closed!")
        except Exception as e:
            print(f"Error al cerrar pool: {e}")