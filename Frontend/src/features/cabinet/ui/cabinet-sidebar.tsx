import { CABINET_NAV } from "../model/cabinet-nav.ts";
import { cn } from "@/shared/lib/css";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { sidebarNavLinkClass } from "@/shared/ui/layout/sidebar-nav.ts";
import { NavLink } from "react-router-dom";
import { rqClient } from "@/shared/api/instance";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CabinetSidebar() {
  const { session } = useSession();
  const { data: team } = rqClient.useQuery("get", "/cabinet/team");

  const navItems = CABINET_NAV;
  const displayName = team?.captainName ?? session?.email ?? "Капитан";
  const email = team?.email ?? session?.email ?? "";
  const eventTitle = team?.eventTitle ?? "Мероприятие";

  return (
    <aside className="w-56 shrink-0">
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 dark:border-blue-500/25 dark:bg-blue-500/10">
        <p className="text-[10px] font-semibold tracking-wider text-blue-600/80 uppercase dark:text-blue-300/80">
          Мероприятие
        </p>
        <p className="mt-0.5 text-xs leading-snug font-medium text-blue-900 dark:text-blue-50">
          {eventTitle}
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isCases = item.to === ROUTES.CABINET_CHANGE_CASE;

          if (item.disabled || !item.to) {
            return (
              <span
                key={item.label}
                className="text-muted-foreground flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm opacity-45"
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </span>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(sidebarNavLinkClass(isActive), "relative")
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isCases && team ? (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  7
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-border mt-6 flex items-center gap-3 border-t pt-4">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {getInitials(displayName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{email}</p>
        </div>
      </div>
    </aside>
  );
}
