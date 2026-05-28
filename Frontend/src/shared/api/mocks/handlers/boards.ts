import type { ApiSchemas } from "../../schema/index.ts";
import { http } from "../http.ts";
import { verifyTokenOrThrow } from "../session.ts";

function randomDate() {
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const end = new Date();

  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  ).toISOString();
}

function generateBoardName() {
  const adjectives = [
    "Стратегический",
    "Креативный",
    "Инновационный",
    "Годовой",
    "Квартальный",
    "Важный",
    "Срочный",
    "Ключевой",
    "Долгосрочный",
    "Оперативный",
    "Тактический",
    "Аналитический",
    "Исследовательский",
  ];

  const nouns = [
    "План",
    "Проект",
    "Дизайн",
    "Отчет",
    "Анализ",
    "Концепт",
    "Процесс",
    "Прототип",
    "Обзор",
    "Презентация",
    "Маркетинг",
    "Разработка",
    "Бюджет",
    "Исследование",
    "Запуск",
    "Совещание",
  ];

  const themes = [
    "Продукта",
    "Команды",
    "Компании",
    "Кампании",
    "Стратегии",
    "Рынка",
    "Бренда",
    "Бизнеса",
    "Проекта",
    "Квартала",
    "Года",
    "Пользователя",
    "Клиента",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  return `${randomAdjective} ${randomNoun} ${randomTheme}`;
}

function generateRandomBoards(count: number): ApiSchemas["Board"][] {
  const result: ApiSchemas["Board"][] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDate();
    const updatedAt = new Date(
      new Date(createdAt).getTime() + Math.random() * 86400000 * 10,
    ).toISOString();
    const lastOpenedAt = new Date(
      new Date(updatedAt).getTime() + Math.random() * 86400000 * 5,
    ).toISOString();

    result.push({
      id: crypto.randomUUID(),
      name: generateBoardName(),
      createdAt,
      updatedAt,
      lastOpenedAt,
      isFavorite: Math.random() > 0.7,
    });
  }

  return result;
}

const boards: ApiSchemas["Board"][] = generateRandomBoards(200);

const notFoundError = {
  message: "Board not found",
  code: "NOT_FOUND",
} as const;

export const boardsHandlers = [
  http.get("/boards", async ({ request, response, query }) => {
    await verifyTokenOrThrow(request);

    const page = Number(query.get("page") || 1);
    const limit = Number(query.get("limit") || 10);
    const search = query.get("search");
    const isFavorite = query.get("isFavorite");
    const sort = query.get("sort");

    let filteredBoards = [...boards];

    if (search) {
      filteredBoards = filteredBoards.filter((board) =>
        board.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (isFavorite !== null) {
      const isFav = String(isFavorite) === "true";
      filteredBoards = filteredBoards.filter(
        (board) => board.isFavorite === isFav,
      );
    }

    if (sort) {
      filteredBoards.sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(b.name);
        }

        return (
          new Date(
            b[sort as keyof ApiSchemas["Board"]].toString(),
          ).getTime() -
          new Date(a[sort as keyof ApiSchemas["Board"]].toString()).getTime()
        );
      });
    }

    const total = filteredBoards.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBoards = filteredBoards.slice(startIndex, endIndex);

    return response(200).json({
      list: paginatedBoards,
      total,
      totalPages,
    });
  }),

  http.get("/boards/{boardId}", async ({ request, response, params }) => {
    await verifyTokenOrThrow(request);

    const board = boards.find((item) => item.id === params.boardId);

    if (!board) {
      return response(404).json(notFoundError);
    }

    board.lastOpenedAt = new Date().toISOString();
    return response(200).json(board);
  }),

  http.post("/boards", async ({ request, response }) => {
    await verifyTokenOrThrow(request);

    const now = new Date().toISOString();
    const board: ApiSchemas["Board"] = {
      id: crypto.randomUUID(),
      name: "New Board",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      isFavorite: false,
    };

    boards.push(board);
    return response(201).json(board);
  }),

  http.put(
    "/boards/{boardId}/favorite",
    async ({ request, response, params }) => {
      await verifyTokenOrThrow(request);

      const board = boards.find((item) => item.id === params.boardId);

      if (!board) {
        return response(404).json(notFoundError);
      }

      const data = await request.json();
      board.isFavorite = data.isFavorite;
      board.updatedAt = new Date().toISOString();

      return response(201).json(board);
    },
  ),

  http.put("/boards/{boardId}/rename", async ({ request, response, params }) => {
    await verifyTokenOrThrow(request);

    const board = boards.find((item) => item.id === params.boardId);

    if (!board) {
      return response(404).json(notFoundError);
    }

    const data = await request.json();
    board.name = data.name;
    board.updatedAt = new Date().toISOString();

    return response(201).json(board);
  }),

  http.delete("/boards/{boardId}", async ({ request, response, params }) => {
    await verifyTokenOrThrow(request);

    const index = boards.findIndex((item) => item.id === params.boardId);

    if (index === -1) {
      return response(404).json(notFoundError);
    }

    boards.splice(index, 1);
    return response(204).empty();
  }),
];
