import { fetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const cabinetService = {
  async getTeam() {
    return fetchClient.GET("/team/me");
  },

  async updateTeam(body: ApiSchemas["TeamUpdate"]) {
    return fetchClient.PATCH("/team/me", { body });
  },
};
