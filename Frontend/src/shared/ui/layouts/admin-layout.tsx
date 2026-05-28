import { ROUTES } from "@/shared/model/routes";
import { AppShell } from "@/shared/ui/layout/app-shell.tsx";
import { sidebarNavLinkClass } from "@/shared/ui/layout/sidebar-nav.ts";
import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { to: ROUTES.ADMIN, label: "Дашборд" },
  { to: ROUTES.ADMIN_EVENTS, label: "Мероприятия" },
];

function AdminSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.ADMIN}
            className={({ isActive }) => sidebarNavLinkClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function AdminLayout() {
  return (
    <AppShell sidebar={<AdminSidebar />}>
      <Outlet />
    </AppShell>
  );
}
