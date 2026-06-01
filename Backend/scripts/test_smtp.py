import asyncio
import sys

from app.config import settings
from app.integrations.email.smtp import SmtpEmailSender


async def _run(to: str) -> None:
    print(
        f"SMTP {settings.smtp_host}:{settings.smtp_port} "
        f"from={settings.smtp_from} user={settings.smtp_user or '(нет)'}"
    )
    await SmtpEmailSender().send(
        to,
        "Тест IT-Куб SMTP",
        "Если вы видите это письмо, отправка OTP настроена верно.",
    )
    print(f"OK: письмо отправлено на {to}")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python /app/scripts/test_smtp.py <email>")
        sys.exit(1)
    try:
        asyncio.run(_run(sys.argv[1]))
    except Exception as exc:
        print(f"Ошибка: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
