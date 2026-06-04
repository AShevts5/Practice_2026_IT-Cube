import type { ReactNode } from "react";
import { AppHeader } from "./app-header.tsx";

export function AppShell({
  sidebar,
  children,
}: {
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <AppHeader />
      <div
        className={
          sidebar
            ? "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-4 sm:py-8 lg:flex-row"
            : "mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-6 sm:px-4 sm:py-8"
        }
      >
        {sidebar}
        <main className="min-w-0 w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
