import { AppBackground } from "@/shared/ui/app-background.tsx";
import { AppFooter } from "@/shared/ui/layout/app-footer.tsx";
import { Outlet } from "react-router-dom";

export function App() {
  return (
    <div className="relative min-h-screen text-foreground">
      <AppBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <AppFooter />
      </div>
    </div>
  );
}
