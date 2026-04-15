import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../app/AppShell";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { EventDetailPage } from "../pages/EventDetailPage";
import { EventFormPage } from "../pages/EventFormPage";
import { EventsListPage } from "../pages/EventsListPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <EventsListPage /> },
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
  }
]);
