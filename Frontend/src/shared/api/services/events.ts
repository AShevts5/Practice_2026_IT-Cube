import { publicFetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const eventsService = {
  async listEvents() {
    return publicFetchClient.GET("/public/events");
  },

  async getEvent(slug: string) {
    return publicFetchClient.GET("/public/events/{slug}", {
      params: { path: { slug } },
    });
  },

  async registerTeam(
    eventSlug: string,
    body: ApiSchemas["RegistrationRequest"],
  ) {
    return publicFetchClient.POST("/registration/events/{event_slug}/teams", {
      params: { path: { event_slug: eventSlug } },
      body,
    });
  },
};
