import type { ApiSchemas } from "@/shared/api/schema/index.ts";

export type ApiErrorBody = ApiSchemas["Error"] & {
  error?: { code?: string; message?: string };
};

export async function parseApiError(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

function detailToMessage(detail: ApiErrorBody["detail"]): string | undefined {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string; loc?: (string | number)[] };
    if (first.loc?.includes("phone")) {
      return "Укажите корректный российский номер телефона (+7…)";
    }
    if (first.msg?.includes("invalid phone")) {
      return "Укажите корректный российский номер телефона (+7…)";
    }
    return first.msg?.replace(/^Value error,\s*/i, "");
  }
  return undefined;
}

export function getErrorMessage(
  body: ApiErrorBody | null,
  fallback: string,
): string {
  return body?.error?.message ?? detailToMessage(body?.detail) ?? fallback;
}
