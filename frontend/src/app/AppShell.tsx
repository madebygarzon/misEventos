import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { Navbar } from "../components/Navbar";
import { useAuthStore } from "../store/authStore";

export function AppShell() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
