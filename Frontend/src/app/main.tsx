import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { CONFIG } from "@/shared/model/config";
import { router } from "./router.tsx";

async function bootstrap() {
  if (import.meta.env.DEV && CONFIG.USE_MOCKS) {
    const { enableMocking } = await import("@/shared/api/mocks/index.ts");
    await enableMocking();
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void bootstrap();
