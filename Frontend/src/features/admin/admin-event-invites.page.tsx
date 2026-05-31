import { ROUTES, pathTo } from "@/shared/model/routes";
import { EventInvitesPanel } from "@/features/admin/ui/event-invites-panel.tsx";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Link, useParams } from "react-router-dom";

function AdminEventInvitesPage() {
  const { eventId } = useParams();
  const numericId = Number(eventId);

  if (!eventId || !Number.isFinite(numericId)) return null;

  return (
    <div>
      <PageHeader
        title="Инвайт-коды"
        description="Генерация и управление кодами регистрации"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId })}>← Мероприятие</Link>
          </Button>
        }
      />
      <EventInvitesPanel eventId={numericId} />
    </div>
  );
}

export const Component = AdminEventInvitesPage;
