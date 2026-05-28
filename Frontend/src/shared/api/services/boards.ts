import { fetchClient } from "../instance.ts";
import type { ApiSchemas } from "../schema/index.ts";

export type BoardsListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isFavorite?: boolean;
  sort?: "createdAt" | "updatedAt" | "lastOpenedAt" | "name";
};

export const boardsService = {
  async listBoards(params?: BoardsListQuery) {
    return fetchClient.GET("/boards", { params: { query: params } });
  },

  async createBoard() {
    return fetchClient.POST("/boards");
  },

  async getBoard(boardId: string) {
    return fetchClient.GET("/boards/{boardId}", {
      params: { path: { boardId } },
    });
  },

  async deleteBoard(boardId: string) {
    return fetchClient.DELETE("/boards/{boardId}", {
      params: { path: { boardId } },
    });
  },

  async updateFavorite(boardId: string, body: ApiSchemas["UpdateBoardFavorite"]) {
    return fetchClient.PUT("/boards/{boardId}/favorite", {
      params: { path: { boardId } },
      body,
    });
  },

  async renameBoard(boardId: string, body: ApiSchemas["RenameBoard"]) {
    return fetchClient.PUT("/boards/{boardId}/rename", {
      params: { path: { boardId } },
      body,
    });
  },
};
