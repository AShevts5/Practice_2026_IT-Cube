import aiosmtplib
from email.message import EmailMessage

from app.config import settings

class SmtpEmailSender:
    async def send(self, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        port = settings.smtp_port
        use_ssl = port == 465
        start_tls = not use_ssl and settings.smtp_tls

        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            use_tls=use_ssl,
            start_tls=start_tls,
            timeout=30,
        )
