import { fetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const adminService = {
  async getStats() {
    return fetchClient.GET("/admin/stats");
  },

  async listEvents(params?: { page?: number; status?: string }) {
    return fetchClient.GET("/admin/events", { params: { query: params } });
  },

  async createEvent(body: ApiSchemas["CreateEventRequest"]) {
    return fetchClient.POST("/admin/events", { body });
  },

  async listTeams(eventId: string) {
    return fetchClient.GET("/admin/events/{eventId}/teams", {
      params: { path: { eventId } },
    });
  },
};
