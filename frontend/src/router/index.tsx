import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../app/AppShell";
import { AdminRoute } from "../components/AdminRoute";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { EventDetailPage } from "../pages/EventDetailPage";
import { EventFormPage } from "../pages/EventFormPage";
import { EventsPage } from "../pages/EventsPage";
import { EventsListPage } from "../pages/EventsListPage";
import { LoginPage } from "../pages/LoginPage";
import { ManualPage } from "../pages/ManualPage";
import { MetricsPage } from "../pages/MetricsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OffererPage } from "../pages/OffererPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { SourcePage } from "../pages/SourcePage";

export const router = createBrowserRouter([
  {
    path: "/manual",
    element: <ManualPage />
  },
  {
    path: "/source",
    element: <SourcePage />
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <EventsListPage /> },
      { path: "events", element: <EventsPage /> },
      { path: "soy-oferente", element: <OffererPage /> },
      {
        element: <AdminRoute />,
        children: [{ path: "metricas", element: <MetricsPage /> }]
      },
      { path: "events/:id", element: <EventDetailPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "events/create", element: <EventFormPage /> },
          { path: "events/:id/edit", element: <EventFormPage /> },
          { path: "profile", element: <ProfilePage /> }
        ]
      },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
]);
