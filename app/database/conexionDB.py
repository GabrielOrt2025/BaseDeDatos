import oracledb
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import Config

def get_db_connection():
    try:
        connection = oracledb.connect(
            user = Config.DATABASE_USER,
            password = Config.DATABASE_PASSWORD,
            dsn = Config.DATABASE_DNS
        )
        print("Conectado a Oracle correctamente ")
        return connection
    except Exception as e:
        print(f"Error al conectar con Oracle => \n {e}")
    finally:
        connection.close()
        print("Conexion oracle cerrada")

get_db_connection()