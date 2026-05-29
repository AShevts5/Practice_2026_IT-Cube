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

        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_tls,
        )
