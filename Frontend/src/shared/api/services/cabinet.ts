import { fetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const cabinetService = {
  async getTeam() {
    return fetchClient.GET("/cabinet/team");
  },

  async updateTeam(body: ApiSchemas["UpdateTeamRequest"]) {
    return fetchClient.PUT("/cabinet/team", { body });
  },

  async getAvailableCases() {
    return fetchClient.GET("/cabinet/available-cases");
  },

  async getAvailableEvents() {
    return fetchClient.GET("/cabinet/available-events");
  },

  async changeCase(body: ApiSchemas["ChangeCaseRequest"]) {
    return fetchClient.POST("/cabinet/change-case", { body });
  },

  async changeEvent(body: ApiSchemas["ChangeEventRequest"]) {
    return fetchClient.POST("/cabinet/change-event", { body });
  },
};
