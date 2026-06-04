from dataclasses import dataclass
import httpx
from app.config import settings
from app.core.exceptions import ValidationError

@dataclass(frozen=True, slots=True)
class LlmMessage:
    role: str
    content: str

class LlmClient:
    async def chat(self, messages: list[LlmMessage]) -> str:
        if not settings.llm_api_key:
            raise ValidationError(
                "AI-помощник не настроен на сервере. Обратитесь к организатору."
            )

        payload = {
            "model": settings.llm_model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        }
        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise ValidationError(
                    "AI-сервис временно недоступен. Попробуйте позже."
                ) from exc
            except httpx.RequestError as exc:
                raise ValidationError(
                    "Не удалось связаться с AI-сервисом. Попробуйте позже."
                ) from exc

        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise ValidationError("AI-сервис вернул пустой ответ")
        content = choices[0].get("message", {}).get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValidationError("AI-сервис вернул пустой ответ")
        return content.strip()
