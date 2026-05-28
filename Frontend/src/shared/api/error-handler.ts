import { toast } from "sonner";
import { getErrorMessage, parseApiError } from "@/shared/lib/errors.ts";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

function isAuthRequest(request: Request): boolean {
  const path = new URL(request.url).pathname;
  return AUTH_PATHS.some((p) => path.endsWith(p));
}

export async function handleApiErrorResponse(
  response: Response,
  request: Request,
): Promise<void> {
  if (response.ok) {
    return;
  }

  const body = await parseApiError(response);
  const message = getErrorMessage(body, "Произошла ошибка");

  switch (response.status) {
    case 401: {
      if (!isAuthRequest(request) && useSession.getState().session) {
        useSession.getState().logout();
        toast.error("Сессия истекла. Войдите снова.");
        window.location.assign(ROUTES.LOGIN);
      }
      break;
    }
    case 403:
      toast.error(message || "Доступ запрещён");
      break;
    case 422:
      toast.error(message || "Проверьте введённые данные");
      break;
    case 429:
      toast.error(message || "Слишком много запросов. Попробуйте позже.");
      break;
    default:
      if (response.status >= 500) {
        toast.error("Ошибка сервера. Попробуйте позже.");
      }
  }
}
