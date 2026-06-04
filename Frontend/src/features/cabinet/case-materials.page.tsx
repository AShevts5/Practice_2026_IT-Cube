import { publicRqClient, rqClient } from "@/shared/api/instance";
import { getCaseCatalogItem } from "@/features/cabinet/model/case-catalog.ts";
import {
  getHackathonChatLinks,
  getTrackMaterials,
} from "@/features/cabinet/model/case-materials.ts";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { KeywordTags } from "@/shared/ui/keyword-tags.tsx";
import type { LucideIcon } from "lucide-react";
import { ExternalLinkIcon, MessageCircleIcon } from "lucide-react";
import { Link } from "react-router-dom";

function SectionTitle({
  children,
  icon: Icon,
}: {
  children: string;
  icon?: LucideIcon;
}) {
  return (
    <p className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-xs font-bold tracking-[0.14em] uppercase">
      {Icon ? <Icon className="text-primary size-4 shrink-0" aria-hidden /> : null}
      {children}
    </p>
  );
}

function MaterialLinkList({
  items,
  emptyText,
}: {
  items: { label: string; url: string }[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.url}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            <ExternalLinkIcon className="size-4 shrink-0" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function CabinetCaseMaterialsPage() {
  const { data: team, isPending: teamPending, isError } = rqClient.useQuery(
    "get",
    "/team/me",
  );

  const { data: event, isPending: eventPending } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
    { params: { path: { slug: team?.event_slug ?? "" } } },
    { enabled: Boolean(team?.event_slug) },
  );

  if (teamPending || eventPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isError || !team) {
    return <p className="text-destructive">Не удалось загрузить данные команды</p>;
  }

  const track = event?.tracks.find((t) => t.id === team.track_id);
  const catalog = getCaseCatalogItem(
    String(team.track_id),
    team.track_title,
    track ? { description: track.description, keywords: track.keywords } : undefined,
  );
  const materials = track ? getTrackMaterials(track.slug) : [];
  const chatLinks = getHackathonChatLinks();
  const casePublicUrl = track
    ? pathTo(ROUTES.EVENT_CASE, {
        slug: team.event_slug,
        caseId: track.slug,
      })
    : null;

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        title="Материал кейса"
        description="Материалы по вашему направлению и ссылки на чаты"
      />

      <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm dark:bg-card/50 dark:shadow-none">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {catalog.partner}
          </p>
          <p className="mt-1 text-lg font-semibold leading-snug">{catalog.title}</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {catalog.description}
          </p>
          <KeywordTags keywords={track?.keywords} className="mt-3" />
        </div>

        {casePublicUrl ? (
          <Button asChild variant="outline" size="sm">
            <Link to={casePublicUrl}>Страница кейса на сайте</Link>
          </Button>
        ) : null}
      </div>

      <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm dark:bg-card/50 dark:shadow-none">
        <SectionTitle>Материалы</SectionTitle>
        <MaterialLinkList
          items={materials}
          emptyText="Материалы по кейсу будут опубликованы организаторами."
        />
      </div>

      <div className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm dark:bg-card/50 dark:shadow-none">
        <SectionTitle icon={MessageCircleIcon}>Чаты</SectionTitle>
        <MaterialLinkList
          items={chatLinks}
          emptyText="Ссылки на чаты хакатона и менторов будут опубликованы организаторами."
        />
      </div>
    </div>
  );
}

export const Component = CabinetCaseMaterialsPage;
