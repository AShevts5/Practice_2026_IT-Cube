import { fetchClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema";

export async function fetchCaptainProfile(): Promise<ApiSchemas["CaptainProfile"] | null> {
  const { data, error } = await fetchClient.GET("/captain/me", {});

  if (error || !data) {
    return null;
  }

  return data;
}
