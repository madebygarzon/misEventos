import { useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { SectionSpinner } from "@/components/SectionSpinner";
import { useAuthStore } from "@/store/authStore";
import { notifyError } from "@/utils/notifications";

export function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();
  const alertedRef = useRef(false);

  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const waitingForUser = isAuthenticated && !user;

  useEffect(() => {
    if (waitingForUser || alertedRef.current) return;

    if (!isAuthenticated) {
      alertedRef.current = true;
      void notifyError("Debes iniciar sesión para acceder a Métricas.");
      return;
    }

    if (!isAdmin) {
      alertedRef.current = true;
      void notifyError("Acceso denegado. Esta sección es solo para administradores.");
    }
  }, [isAdmin, isAuthenticated, waitingForUser]);

  if (waitingForUser) {
    return <SectionSpinner label="Validando permisos..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
