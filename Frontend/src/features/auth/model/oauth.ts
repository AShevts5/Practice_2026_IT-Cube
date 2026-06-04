import { CONFIG } from "@/shared/model/config";

export type OAuthProviderId = "github" | "yandex" | "vk";
export type OAuthFlow = "login" | "register";

export function getOAuthAuthorizeUrl(provider: OAuthProviderId, flow: OAuthFlow) {
  const base = CONFIG.API_BASE_URL.replace(/\/$/, "");
  const path = `${base}/auth/oauth/${provider}/authorize?flow=${flow}`;
  if (path.startsWith("http")) {
    return path;
  }
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  provider_not_configured: "Вход через эту соцсеть временно недоступен",
  provider_mismatch: "Ошибка сессии OAuth, попробуйте снова",
  missing_code: "Авторизация отменена или прервана",
  "Аккаунт не найден. Сначала зарегистрируйтесь как капитан.":
    "Аккаунт не найден. Сначала зарегистрируйтесь как капитан.",
};

export function mapOAuthError(message: string | null) {
  if (!message) return "Не удалось войти через соцсеть";
  return OAUTH_ERROR_MESSAGES[message] ?? decodeURIComponent(message);
}
