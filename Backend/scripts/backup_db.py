import os
import subprocess
import sys
from datetime import UTC, datetime
from urllib.parse import urlparse
from app.config import settings


def main() -> None:
    sync_url = settings.database_url_sync
    parsed = urlparse(sync_url)
    host = parsed.hostname or "localhost"
    port = str(parsed.port or 5432)
    user = parsed.username or "itcube"
    password = parsed.password or "itcube"
    dbname = (parsed.path or "/itcube").lstrip("/")

    timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    outfile = f"backup_{dbname}_{timestamp}.sql"

    env = os.environ.copy()
    env["PGPASSWORD"] = password

    cmd = [
        "pg_dump",
        "-h",
        host,
        "-p",
        port,
        "-U",
        user,
        "-d",
        dbname,
        "-f",
        outfile,
    ]
    try:
        subprocess.run(cmd, check=True, env=env)
        print(f"Backup saved to {outfile}")
    except FileNotFoundError:
        print("pg_dump not found. Install PostgreSQL client tools.", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as exc:
        print(f"Backup failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
