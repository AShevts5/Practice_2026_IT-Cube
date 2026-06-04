import { CONFIG } from "@/shared/model/config";

export type CaseMaterialLink = {
  label: string;
  url: string;
};

export type HackathonChatLink = {
  label: string;
  url: string;
};

const MATERIALS_BY_TRACK_SLUG: Record<string, CaseMaterialLink[]> = {
  mts: [
    {
      label: "Техническое задание",
      url: "https://platformhackathons.ru/materials/mts-brief.pdf",
    },
    {
      label: "Репозиторий с шаблоном проекта",
      url: "https://github.com/example/mts-hackathon-starter",
    },
  ],
  sber: [
    {
      label: "Описание кейса и критерии",
      url: "https://platformhackathons.ru/materials/sber-brief.pdf",
    },
  ],
  gostech: [
    {
      label: "Документация API",
      url: "https://platformhackathons.ru/materials/gostech-api.pdf",
    },
  ],
  yandex: [
    {
      label: "Датасет для аналитики",
      url: "https://platformhackathons.ru/materials/yandex-dataset.zip",
    },
  ],
};

export function getTrackMaterials(trackSlug: string): CaseMaterialLink[] {
  return MATERIALS_BY_TRACK_SLUG[trackSlug] ?? [];
}

export function getHackathonChatLinks(): HackathonChatLink[] {
  const links: HackathonChatLink[] = [];

  if (CONFIG.HACKATHON_CHAT_URL) {
    links.push({ label: "Чат хакатона", url: CONFIG.HACKATHON_CHAT_URL });
  }

  if (CONFIG.MENTORS_CHAT_URL) {
    links.push({ label: "Чат с менторами", url: CONFIG.MENTORS_CHAT_URL });
  }

  return links;
}
