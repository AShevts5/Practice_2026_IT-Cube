from abc import ABC, abstractmethod
import structlog

from app.config import settings

logger = structlog.get_logger()

class SmsSender(ABC):
    @abstractmethod
    async def send(self, phone: str, message: str) -> None:
        pass


class MockSmsSender(SmsSender):
    async def send(self, phone: str, message: str) -> None:
        logger.info("sms_mock_send", phone=phone, message=message)


def get_sms_sender() -> SmsSender:
    if settings.sms_provider == "mock":
        return MockSmsSender()
    return MockSmsSender()
