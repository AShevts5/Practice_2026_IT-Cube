export type ApiTransport = "mock" | "backend";

export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  USE_MOCKS: import.meta.env.VITE_USE_MOCKS !== "false",
  API_TRANSPORT: (import.meta.env.VITE_API_TRANSPORT ?? "mock") as ApiTransport,
  HACKATHON_CHAT_URL: import.meta.env.VITE_HACKATHON_CHAT_URL?.trim() ?? "",
  MENTORS_CHAT_URL: import.meta.env.VITE_MENTORS_CHAT_URL?.trim() ?? "",
} as const;
