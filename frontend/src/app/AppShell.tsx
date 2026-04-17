import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { AppSidebar } from "../components/AppSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "../components/ui/breadcrumb";
import { Separator } from "../components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import { TooltipProvider } from "../components/ui/tooltip";
import { useAuthStore } from "../store/authStore";

export function AppShell() {
  const { fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const toLabel = (segment: string, prev?: string): string => {
    if (segment === "events") return "Eventos";
    if (segment === "create") return "Crear evento";
    if (segment === "edit") return "Editar evento";
    if (segment === "profile") return "Mi perfil";
    if (segment === "login") return "Iniciar sesión";
    if (segment === "register") return "Registro";
    if (segment === "metricas") return "Métricas";
    if (segment === "soy-oferente") return "Soy oferente";
    if (prev === "events") return "Detalle evento";
    return segment;
  };

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { href: "/", label: "Inicio" },
    ...segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: toLabel(segment, index > 0 ? segments[index - 1] : undefined)
    }))
  ];

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <BreadcrumbItem key={crumb.href}>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <>
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href}>{crumb.label}</Link>
                          </BreadcrumbLink>
                          <BreadcrumbSeparator />
                        </>
                      )}
                    </BreadcrumbItem>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
