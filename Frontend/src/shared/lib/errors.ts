import type { ApiSchemas } from "@/shared/api/schema/index.ts";

export type ApiErrorBody = ApiSchemas["Error"];

export async function parseApiError(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

export function getErrorMessage(
  body: ApiErrorBody | null,
  fallback: string,
): string {
  return body?.message ?? fallback;
}
