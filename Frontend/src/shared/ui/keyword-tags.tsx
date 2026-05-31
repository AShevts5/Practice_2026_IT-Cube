import { parseKeywords } from "@/shared/lib/keywords.ts";
import { cn } from "@/shared/lib/css";

export const keywordTagClassName =
  "rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300";

type KeywordTagsProps = {
  keywords?: string;
  className?: string;
};

export function KeywordTags({ keywords, className }: KeywordTagsProps) {
  const tags = parseKeywords(keywords);
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span key={tag} className={keywordTagClassName}>
          {tag}
        </span>
      ))}
    </div>
  );
}
