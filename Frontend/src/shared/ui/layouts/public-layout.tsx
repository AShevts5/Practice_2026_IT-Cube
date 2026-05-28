import { AppShell } from "@/shared/ui/layout/app-shell.tsx";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
