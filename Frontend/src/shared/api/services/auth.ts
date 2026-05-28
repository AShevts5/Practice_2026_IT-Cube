import { publicFetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const authService = {
  async login(body: ApiSchemas["LoginRequest"]) {
    return publicFetchClient.POST("/auth/login", { body });
  },

  async verify2fa(body: ApiSchemas["Verify2FARequest"]) {
    return publicFetchClient.POST("/auth/verify-2fa", { body });
  },

  async forgotPassword(body: ApiSchemas["ForgotPasswordRequest"]) {
    return publicFetchClient.POST("/auth/forgot-password", { body });
  },

  async resetPassword(
    token: string,
    body: ApiSchemas["ResetPasswordRequest"],
  ) {
    return publicFetchClient.POST("/auth/reset-password/{token}", {
      params: { path: { token } },
      body,
    });
  },

  async register(body: ApiSchemas["RegisterRequest"]) {
    return publicFetchClient.POST("/auth/register", { body });
  },

  async refresh() {
    return publicFetchClient.POST("/auth/refresh");
  },
};
