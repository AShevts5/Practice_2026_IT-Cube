import { CabinetSidebar } from "./cabinet-sidebar.tsx";
import { AppShell } from "@/shared/ui/layout/app-shell.tsx";
import { Outlet } from "react-router-dom";

export function CabinetLayout() {
  return (
    <AppShell sidebar={<CabinetSidebar />}>
      <Outlet />
    </AppShell>
  );
}
