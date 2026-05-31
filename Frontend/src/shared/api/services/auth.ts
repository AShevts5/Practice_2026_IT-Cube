import { publicFetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";
import type { AuthTarget } from "@/shared/model/session";

export const authService = {
  async registerCaptain(body: ApiSchemas["CaptainRegisterRequest"]) {
    return publicFetchClient.POST("/auth/captain/register", { body });
  },

  async startLogin(target: AuthTarget, body: ApiSchemas["LoginRequest"]) {
    switch (target) {
      case "admin":
        return publicFetchClient.POST("/auth/admin/login", { body });
      case "captain":
        return publicFetchClient.POST("/auth/captain/login", { body });
      case "team":
        return publicFetchClient.POST("/auth/team/login", { body });
    }
  },

  async resendOtp(target: AuthTarget, body: ApiSchemas["OtpRequest"]) {
    switch (target) {
      case "admin":
        return publicFetchClient.POST("/auth/admin/otp/send", { body });
      case "captain":
        return publicFetchClient.POST("/auth/captain/otp/send", { body });
      case "team":
        return publicFetchClient.POST("/auth/team/otp/send", { body });
    }
  },

  async verifyOtp(target: AuthTarget, body: ApiSchemas["OtpVerifyRequest"]) {
    switch (target) {
      case "admin":
        return publicFetchClient.POST("/auth/admin/otp/verify", { body });
      case "captain":
        return publicFetchClient.POST("/auth/captain/otp/verify", { body });
      case "team":
        return publicFetchClient.POST("/auth/team/otp/verify", { body });
    }
  },
};
