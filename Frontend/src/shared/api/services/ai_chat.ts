import createFetchClient from "openapi-fetch";
import { CONFIG } from "@/shared/model/config";
import { useSession } from "@/shared/model/session";
import type { ApiPaths, ApiSchemas } from "@/shared/api/schema/index.ts";

const aiChatFetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

aiChatFetchClient.use({
  async onRequest({ request }) {
    const token = useSession.getState().getAccessToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
  },
});

export type AiChatMessage = ApiSchemas["AiChatMessage"];

export const aiChatService = {
  async startSession(clientKey: string) {
    return aiChatFetchClient.POST("/public/ai-chat/sessions", {
      body: { client_key: clientKey },
    });
  },

  async getSession(sessionId: number, clientKey: string) {
    return aiChatFetchClient.GET("/public/ai-chat/sessions/{session_id}", {
      params: {
        path: { session_id: sessionId },
        query: { client_key: clientKey },
      },
    });
  },

  async sendMessage(sessionId: number, body: ApiSchemas["AiChatSendMessageRequest"]) {
    return aiChatFetchClient.POST("/public/ai-chat/sessions/{session_id}/messages", {
      params: { path: { session_id: sessionId } },
      body,
    });
  },
};
