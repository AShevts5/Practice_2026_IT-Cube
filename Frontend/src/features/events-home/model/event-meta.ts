import { parseKeywords } from "@/shared/lib/keywords.ts";

export const eventTagsBySlug: Record<string, string[]> = {
  "digital-breakthrough": [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Docker",
    "JWT",
  ],
  "data-olympiad": [
    "Python",
    "Pandas",
    "Scikit-learn",
    "SQL",
    "Визуализация",
    "Jupyter",
  ],
  "product-intensive": [
    "Product",
    "UX",
    "Figma",
    "Agile",
    "MVP",
  ],
};

export const eventBrandBySlug: Record<string, string> = {
  "digital-breakthrough": "IT-КУБ",
  "data-olympiad": "DATA LAB",
  "product-intensive": "PRODUCT",
};

export function getEventTags(slug: string, keywords?: string): string[] {
  const fromField = parseKeywords(keywords);
  if (fromField.length > 0) return fromField;
  return eventTagsBySlug[slug] ?? ["Команды", "Кейсы", "Хакатон"];
}

export function getEventBrand(slug: string): string {
  return eventBrandBySlug[slug] ?? "EVENTS";
}
