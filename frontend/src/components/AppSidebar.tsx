import type { ComponentType } from "react";
import { BarChart3, BriefcaseBusiness, CalendarDays, CirclePlus, LogIn, LogOut, LayoutDashboard, UserCircle2, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";

type NavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export function AppSidebar() {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || user?.roles?.includes("admin"));

  const mainItems: NavigationItem[] = [
    { label: "Inicio", href: "/", icon: LayoutDashboard, exact: true },
    { label: "Eventos", href: "/events", icon: CalendarDays },
    { label: "Soy oferente?", href: "/soy-oferente", icon: BriefcaseBusiness },
    { label: "Métricas", href: "/metricas", icon: BarChart3 },
    ...(isAuthenticated && canManageEvents ? [{ label: "Crear Evento", href: "/events/create", icon: CirclePlus }] : []),
    ...(isAuthenticated ? [{ label: "Mi Perfil", href: "/profile", icon: UserCircle2 }] : []),
    ...(!isAuthenticated ? [{ label: "Iniciar Sesión", href: "/login", icon: LogIn }] : []),
    ...(!isAuthenticated ? [{ label: "Registro", href: "/register", icon: UserPlus }] : [])
  ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Mis Eventos">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CalendarDays className="size-4" />
                </div>
                <div className="grid gap-0 flex-1 text-left text-sm">
                  <span className="truncate font-semibold">Mis Eventos</span>
                  <span className="truncate text-xs">Gestión Global</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu
              className="gap-4"
            >
              {mainItems.map((item) => {
                const isActive = item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={`${item.href}-${item.label}`}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isAuthenticated ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={user?.full_name || "Usuario"}>
                  <UserCircle2 />
                  <span>{user?.full_name || "Usuario"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Cerrar Sesión">
                  <LogOut />
                  <span>Salir</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Acceso">
                <Link to="/login">
                  <LogIn />
                  <span>Acceder</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
