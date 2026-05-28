import { ROUTES } from "../shared/model/routes";
import { createBrowserRouter } from "react-router-dom";
import { App } from "./app.tsx";
import { Providers } from "./providers.tsx";
import { AppHeader } from "@/features/header";
import { PublicLayout } from "@/shared/ui/layouts/public-layout";
import { CabinetLayout } from "@/features/cabinet";
import { AdminLayout } from "@/shared/ui/layouts/admin-layout";
import {
  adminLoader,
  cabinetLoader,
  captainDashboardLoader,
  captainOnlyLoader,
  protectedLoader,
} from "@/shared/model/protected.loaders.ts";
import { CaptainOnlyRoute, ProtectedRoute, RoleRoute } from "@/shared/model/protected.tsx";
import { lazyPage } from "@/shared/lib/lazy-page.ts";

export const router = createBrowserRouter([
  {
    element: (
      <Providers>
        <App />
      </Providers>
    ),
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            lazy: () => import("@/features/events-home/home.page"),
          },
          {
            path: ROUTES.EVENT,
            lazy: () => import("@/features/event-detail/event-detail.page"),
          },
          {
            path: ROUTES.EVENT_CASE,
            lazy: () => import("@/features/case-detail/case-detail.page"),
          },
          {
            path: ROUTES.EVENT_REGISTER,
            lazy: () => import("@/features/event-register/event-register.page"),
          },
          {
            path: ROUTES.LOGIN,
            lazy: lazyPage(() => import("@/features/auth/login.page.tsx")),
          },
          {
            path: ROUTES.VERIFY_2FA,
            lazy: lazyPage(() => import("@/features/auth/verify-2fa.page.tsx")),
          },
          {
            path: ROUTES.FORGOT_PASSWORD,
            lazy: lazyPage(() => import("@/features/auth/forgot-password.page.tsx")),
          },
          {
            path: ROUTES.RESET_PASSWORD,
            lazy: lazyPage(() => import("@/features/auth/reset-password.page.tsx")),
          },
          {
            path: ROUTES.REGISTER,
            lazy: lazyPage(() => import("@/features/auth/register.page.tsx")),
          },
        ],
      },
      {
        loader: cabinetLoader,
        element: <CabinetLayout />,
        children: [
          {
            path: ROUTES.CABINET_DASHBOARD,
            loader: captainDashboardLoader,
            lazy: () => import("@/features/cabinet/dashboard.page"),
          },
          {
            path: ROUTES.CABINET_HISTORY,
            lazy: () => import("@/features/cabinet/history.page"),
          },
          {
            loader: captainOnlyLoader,
            element: <CaptainOnlyRoute />,
            children: [
              {
                path: ROUTES.CABINET_EDIT,
                lazy: () => import("@/features/cabinet/edit.page"),
              },
              {
                path: ROUTES.CABINET_CHANGE_CASE,
                lazy: () => import("@/features/cabinet/change-case.page"),
              },
            ],
          },
        ],
      },
      {
        loader: adminLoader,
        element: <AdminLayout />,
        children: [
          {
            element: <RoleRoute role="admin" />,
            children: [
              {
                path: ROUTES.ADMIN,
                lazy: () => import("@/features/admin/admin-dashboard.page"),
              },
              {
                path: ROUTES.ADMIN_EVENTS,
                lazy: () => import("@/features/admin/admin-events.page"),
              },
              {
                path: ROUTES.ADMIN_EVENT_NEW,
                lazy: () => import("@/features/admin/admin-event-form.page"),
              },
              {
                path: ROUTES.ADMIN_EVENT_EDIT,
                lazy: () => import("@/features/admin/admin-event-form.page"),
              },
              {
                path: ROUTES.ADMIN_EVENT_CASES,
                lazy: () => import("@/features/admin/admin-event-cases.page"),
              },
              {
                path: ROUTES.ADMIN_EVENT_INVITES,
                lazy: () => import("@/features/admin/admin-event-invites.page"),
              },
              {
                path: ROUTES.ADMIN_EVENT_TEAMS,
                lazy: () => import("@/features/admin/admin-event-teams.page"),
              },
            ],
          },
        ],
      },
      {
        loader: protectedLoader,
        element: (
          <div className="min-h-screen">
            <AppHeader />
            <ProtectedRoute />
          </div>
        ),
        children: [
          {
            path: ROUTES.BOARDS,
            lazy: () => import("@/features/boards-list/boards-list.page"),
          },
          {
            path: ROUTES.FAVORITE_BOARDS,
            lazy: () =>
              import("@/features/boards-list/boards-list-favorite.page"),
          },
          {
            path: ROUTES.RECENT_BOARDS,
            lazy: () => import("@/features/boards-list/boards-list-recent.page"),
          },
          {
            path: ROUTES.BOARD,
            lazy: () => import("@/features/board/board.page"),
          },
        ],
      },
      {
        path: "*",
        lazy: () => import("@/features/not-found/not-found.page"),
      },
    ],
  },
]);
