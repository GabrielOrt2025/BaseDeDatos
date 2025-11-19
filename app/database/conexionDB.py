import oracledb
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import Config

pool = None

def init_oracle_pool():
    global pool
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
    return pool.acquire()