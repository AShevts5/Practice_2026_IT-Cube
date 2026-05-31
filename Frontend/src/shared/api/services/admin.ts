import { fetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const adminService = {
  async listEvents() {
    return fetchClient.GET("/admin/events");
  },

  async createEvent(body: ApiSchemas["EventCreate"]) {
    return fetchClient.POST("/admin/events", { body });
  },

  async updateEvent(eventId: number, body: ApiSchemas["EventUpdate"]) {
    return fetchClient.PATCH("/admin/events/{event_id}", {
      params: { path: { event_id: eventId } },
      body,
    });
  },

  async listTeams(eventId: number) {
    return fetchClient.GET("/admin/teams/events/{event_id}/teams", {
      params: { path: { event_id: eventId } },
    });
  },

  async listInvites(eventId: number) {
    return fetchClient.GET("/admin/invites/events/{event_id}", {
      params: { path: { event_id: eventId } },
    });
  },
};
