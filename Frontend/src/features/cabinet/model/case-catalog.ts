import { parseKeywords } from "@/shared/lib/keywords.ts";

export type CaseTag = {
  label: string;
  className: string;
};

export type CaseCatalogItem = {
  id: string;
  partner: string;
  partnerColor: string;
  title: string;
  description: string;
  tags: CaseTag[];
};

const tag = (light: string, dark: string) => `${light} ${dark}`;

export const CASE_CATALOG: Record<string, CaseCatalogItem> = {
  c1: {
    id: "c1",
    partner: "МТС",
    partnerColor: "text-violet-600",
    title: "Единая платформа регистрации команд на образовательные хакатоны",
    description:
      "Разработать веб-платформу для регистрации команд, выбора кейсов и отслеживания статуса участия в хакатонах.",
    tags: [
      {
        label: "React",
        className: tag(
          "border-violet-200 bg-violet-50 text-violet-700",
          "dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300",
        ),
      },
      {
        label: "Node.js",
        className: tag(
          "border-violet-200 bg-violet-50 text-violet-700",
          "dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300",
        ),
      },
      {
        label: "PostgreSQL",
        className: tag(
          "border-violet-200 bg-violet-50 text-violet-700",
          "dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300",
        ),
      },
      {
        label: "Redis",
        className: tag(
          "border-violet-200 bg-violet-50 text-violet-700",
          "dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300",
        ),
      },
      {
        label: "Docker",
        className: tag(
          "border-violet-200 bg-violet-50 text-violet-700",
          "dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300",
        ),
      },
    ],
  },
  c2: {
    id: "c2",
    partner: "Сбер",
    partnerColor: "text-emerald-600",
    title: "Цифровая образовательная среда для вузов",
    description:
      "Создать модульную LMS с треками обучения, геймификацией и аналитикой успеваемости.",
    tags: [
      {
        label: "Vue",
        className: tag(
          "border-sky-200 bg-sky-50 text-sky-700",
          "dark:border-sky-500/50 dark:bg-transparent dark:text-sky-300",
        ),
      },
      {
        label: "Python",
        className: tag(
          "border-sky-200 bg-sky-50 text-sky-700",
          "dark:border-sky-500/50 dark:bg-transparent dark:text-sky-300",
        ),
      },
      {
        label: "MongoDB",
        className: tag(
          "border-sky-200 bg-sky-50 text-sky-700",
          "dark:border-sky-500/50 dark:bg-transparent dark:text-sky-300",
        ),
      },
    ],
  },
  c3: {
    id: "c3",
    partner: "ГосТех",
    partnerColor: "text-orange-600",
    title: "Госуслуги 2.0: умный помощник гражданина",
    description:
      "Чат-бот и портал для подачи обращений в органы власти с NLP-маршрутизацией.",
    tags: [
      {
        label: "TypeScript",
        className: tag(
          "border-orange-200 bg-orange-50 text-orange-700",
          "dark:border-orange-500/50 dark:bg-transparent dark:text-orange-300",
        ),
      },
      {
        label: "FastAPI",
        className: tag(
          "border-orange-200 bg-orange-50 text-orange-700",
          "dark:border-orange-500/50 dark:bg-transparent dark:text-orange-300",
        ),
      },
      {
        label: "Kafka",
        className: tag(
          "border-orange-200 bg-orange-50 text-orange-700",
          "dark:border-orange-500/50 dark:bg-transparent dark:text-orange-300",
        ),
      },
    ],
  },
  c4: {
    id: "c4",
    partner: "Яндекс",
    partnerColor: "text-amber-600",
    title: "Аналитика городской мобильности",
    description:
      "Дашборд для транспортного департамента: тепловые карты потоков и прогноз загрузки.",
    tags: [
      {
        label: "React",
        className: tag(
          "border-emerald-200 bg-emerald-50 text-emerald-700",
          "dark:border-emerald-500/50 dark:bg-transparent dark:text-emerald-300",
        ),
      },
      {
        label: "D3.js",
        className: tag(
          "border-emerald-200 bg-emerald-50 text-emerald-700",
          "dark:border-emerald-500/50 dark:bg-transparent dark:text-emerald-300",
        ),
      },
      {
        label: "ClickHouse",
        className: tag(
          "border-emerald-200 bg-emerald-50 text-emerald-700",
          "dark:border-emerald-500/50 dark:bg-transparent dark:text-emerald-300",
        ),
      },
    ],
  },
};

const defaultTagClass =
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300";

function keywordsToTags(keywords: string[]): CaseTag[] {
  return keywords.map((label) => ({
    label,
    className: defaultTagClass,
  }));
}

export function getCaseCatalogItem(
  caseId: string,
  fallbackName?: string,
  meta?: { description?: string; keywords?: string },
) {
  const catalog = CASE_CATALOG[caseId];
  const parsedKeywords = parseKeywords(meta?.keywords);
  const tags =
    parsedKeywords.length > 0
      ? keywordsToTags(parsedKeywords)
      : (catalog?.tags ?? []);

  if (catalog) {
    return {
      ...catalog,
      description: meta?.description ?? catalog.description,
      tags,
    };
  }

  return {
    id: caseId,
    partner: fallbackName ?? "Партнёр",
    partnerColor: "text-muted-foreground",
    title: fallbackName ?? "Кейс",
    description:
      meta?.description ?? "Описание кейса будет опубликовано организаторами.",
    tags,
  };
}
