import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { handleApiErrorResponse } from "./error-handler.ts";
import { CONFIG } from "@/shared/model/config";
import { useSession } from "@/shared/model/session";
import type { ApiPaths, ApiSchemas } from "./schema/index.ts";

export const fetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

export const rqClient = createClient(fetchClient);

export const publicFetchClient = createFetchClient<ApiPaths>({
  baseUrl: CONFIG.API_BASE_URL,
});

export const publicRqClient = createClient(publicFetchClient);

const attachErrorHandler = (client: typeof fetchClient) => {
  client.use({
    async onResponse({ response, request }) {
      await handleApiErrorResponse(response, request);
    },
  });
};

attachErrorHandler(fetchClient);
attachErrorHandler(publicFetchClient);

fetchClient.use({
  async onRequest({ request }) {
    const token = await useSession.getState().refreshToken();

    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
      return;
    }

    return new Response(
      JSON.stringify({
        code: "NOT_AUTHORIZED",
        message: "You are not authorized to access this resource",
      } satisfies ApiSchemas["Error"]),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  },
});
