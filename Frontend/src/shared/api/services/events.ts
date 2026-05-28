import { publicFetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export const eventsService = {
  async listEvents(status?: ApiSchemas["Event"]["status"]) {
    return publicFetchClient.GET("/events", {
      params: { query: status ? { status } : undefined },
    });
  },

  async getEvent(slug: string) {
    return publicFetchClient.GET("/events/{slug}", {
      params: { path: { slug } },
    });
  },

  async getCases(slug: string, available?: boolean) {
    return publicFetchClient.GET("/events/{slug}/cases", {
      params: {
        path: { slug },
        query: available !== undefined ? { available } : undefined,
      },
    });
  },

  async verifyInvite(slug: string, body: ApiSchemas["VerifyInviteRequest"]) {
    return publicFetchClient.POST("/events/{slug}/verify-invite-code", {
      params: { path: { slug } },
      body,
    });
  },

  async registerTeam(slug: string, body: ApiSchemas["RegisterTeamRequest"]) {
    return publicFetchClient.POST("/events/{slug}/register", {
      params: { path: { slug } },
      body,
    });
  },
};
