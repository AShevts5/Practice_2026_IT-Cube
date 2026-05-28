import type { ApiSchemas } from "../schema/index.ts";

export type MockEvent = ApiSchemas["Event"] & {
  startsAt: string;
  endsAt: string;
};

export type MockCase = ApiSchemas["Case"];

export type MockInviteCode = {
  id: string;
  eventId: string;
  code: string;
  status: "active" | "used" | "expired";
  expiresAt: string;
  usedAt?: string;
  usedByTeamId?: string;
};

export type MockTeam = Omit<ApiSchemas["Team"], "canEdit"> & {
  eventId: string;
  caseId: string;
  slug: string;
  registeredAt: string;
  applicationStatus: "pending" | "confirmed";
};

export type MockHistoryEntry = {
  id: string;
  teamId: string;
  action: string;
  createdAt: string;
  details?: string;
};

export const mockEvents: MockEvent[] = [
  {
    id: "1",
    title: "Хакатон «Цифровой прорыв»",
    slug: "digital-breakthrough",
    keywords:
      "React, TypeScript, Node.js, Python, FastAPI, PostgreSQL, Docker, JWT",
    description:
      "Единая платформа регистрации команд на IT-мероприятия: выбор кейса, инвайт-коды, личный кабинет капитана и участников. Командный кейс-чемпионат для студентов и молодых специалистов.",
    status: "active",
    freeSpotsTotal: 42,
    registrationOpen: true,
    startsAt: "2026-06-01T09:00:00Z",
    endsAt: "2026-06-15T18:00:00Z",
  },
  {
    id: "2",
    title: "Олимпиада по аналитике данных",
    slug: "data-olympiad",
    keywords: "Python, Pandas, Scikit-learn, SQL, Визуализация, Jupyter",
    description:
      "Соревнование по машинному обучению и визуализации данных: построение моделей, интерпретация результатов и защита решений перед жюри.",
    status: "active",
    freeSpotsTotal: 18,
    registrationOpen: true,
    startsAt: "2026-07-10T10:00:00Z",
    endsAt: "2026-07-20T20:00:00Z",
  },
  {
    id: "3",
    title: "Интенсив «Продуктовая разработка»",
    slug: "product-intensive",
    keywords: "Product, UX, Figma, Agile, MVP",
    description: "Завершённый поток — регистрация закрыта.",
    status: "completed",
    freeSpotsTotal: 0,
    registrationOpen: false,
    startsAt: "2026-03-01T09:00:00Z",
    endsAt: "2026-03-20T18:00:00Z",
  },
];

export const mockCasesByEvent: Record<string, MockCase[]> = {
  "1": [
    {
      id: "c1",
      name: "Финтех",
      limit: 25,
      occupied: 8,
      free: 17,
      keywords: "React, Node.js, PostgreSQL, Redis, Docker",
      description:
        "Разработать веб-платформу для регистрации команд, выбора кейсов и отслеживания статуса участия в хакатонах.",
    },
    {
      id: "c2",
      name: "EdTech",
      limit: 20,
      occupied: 14,
      free: 6,
      keywords: "Vue, Python, MongoDB",
      description:
        "Создать модульную LMS с треками обучения, геймификацией и аналитикой успеваемости.",
    },
    {
      id: "c3",
      name: "GovTech",
      limit: 18,
      occupied: 11,
      free: 7,
      keywords: "TypeScript, FastAPI, Kafka",
      description:
        "Чат-бот и портал для подачи обращений в органы власти с NLP-маршрутизацией.",
    },
    {
      id: "c4",
      name: "Урбанистика",
      limit: 15,
      occupied: 9,
      free: 6,
      keywords: "React, D3.js, ClickHouse",
      description:
        "Дашборд для транспортного департамента: тепловые карты потоков и прогноз загрузки.",
    },
  ],
  "2": [
    {
      id: "d1",
      name: "Классификация",
      limit: 15,
      occupied: 12,
      free: 3,
      keywords: "Python, Scikit-learn",
      description: "Построение модели классификации на открытом датасете.",
    },
    {
      id: "d2",
      name: "Регрессия",
      limit: 10,
      occupied: 4,
      free: 6,
      keywords: "Python, Pandas",
      description: "Прогнозирование числового показателя по табличным признакам.",
    },
  ],
  "3": [
    {
      id: "p1",
      name: "MVP",
      limit: 5,
      occupied: 5,
      free: 0,
      keywords: "Product, UX",
      description: "Прототип продукта и защита гипотез ценности.",
    },
  ],
};

export const captainTeam: MockTeam = {
  id: "t1",
  name: "Команда Альфа",
  captainName: "Кудинов Кирилл",
  email: "captain@gmail.com",
  phone: "+7 900 123-45-67",
  caseName: "Финтех",
  eventTitle: "Хакатон «Цифровой прорыв»",
  eventId: "1",
  caseId: "c1",
  slug: "digital-breakthrough",
  registeredAt: "2026-05-01T10:00:00Z",
  applicationStatus: "confirmed",
};

export const mockTeamsByEvent: Record<string, MockTeam[]> = {
  "1": [captainTeam],
  "2": [],
  "3": [],
};

export const mockInviteCodes: MockInviteCode[] = [
  {
    id: "inv1",
    eventId: "1",
    code: "INVITE2026",
    status: "active",
    expiresAt: "2026-12-31T23:59:59Z",
  },
  {
    id: "inv2",
    eventId: "1",
    code: "HACK-ALPHA",
    status: "active",
    expiresAt: "2026-08-01T23:59:59Z",
  },
  {
    id: "inv3",
    eventId: "1",
    code: "USED-CODE",
    status: "used",
    expiresAt: "2026-12-31T23:59:59Z",
    usedAt: "2026-04-01T12:00:00Z",
    usedByTeamId: "t99",
  },
];

export const mockHistory: MockHistoryEntry[] = [
  {
    id: "h1",
    teamId: "t1",
    action: "registration",
    createdAt: "2026-05-01T10:00:00Z",
    details: "Регистрация команды",
  },
  {
    id: "h2",
    teamId: "t1",
    action: "case_selected",
    createdAt: "2026-05-01T10:05:00Z",
    details: "Выбран кейс «Финтех»",
  },
];

export function getEventBySlug(slug: string) {
  return mockEvents.find((e) => e.slug === slug);
}

export function getEventById(id: string) {
  return mockEvents.find((e) => e.id === id);
}

export function recalcEventFreeSpots(eventId: string) {
  const event = getEventById(eventId);
  const cases = mockCasesByEvent[eventId] ?? [];
  if (event) {
    event.freeSpotsTotal = cases.reduce((s, c) => s + c.free, 0);
  }
}

export function isEventEditable(eventId: string) {
  const event = getEventById(eventId);
  return event?.status !== "completed";
}

export function addHistory(
  teamId: string,
  action: string,
  details?: string,
) {
  mockHistory.unshift({
    id: `h${Date.now()}`,
    teamId,
    action,
    createdAt: new Date().toISOString(),
    details,
  });
}
