import type { ComponentType } from "react";
import { BarChart3, BriefcaseBusiness, CalendarDays, CirclePlus, LogIn, LogOut, LayoutDashboard, UserCircle2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || user?.roles?.includes("admin"));

  const mainItems: NavigationItem[] = [
    { label: "Inicio", href: "/", icon: LayoutDashboard, exact: true },
    { label: "Eventos", href: "/events", icon: CalendarDays },
    { label: "¿Soy oferente?", href: "/soy-oferente", icon: BriefcaseBusiness },
    ...(isAuthenticated && isAdmin ? [{ label: "Métricas", href: "/metricas", icon: BarChart3 }] : []),
    ...(isAuthenticated && canManageEvents ? [{ label: "Crear Evento", href: "/events/create", icon: CirclePlus }] : []),
    ...(isAuthenticated ? [{ label: "Mi Perfil", href: "/profile", icon: UserCircle2 }] : [])
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="peer/menu-button group/menu-button flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
                  >
                    <LogIn />
                    <span>Acceder</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/login">Iniciar sesión</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/register">Registrarme</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/soy-oferente">Soy oferente?</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <div className="mt-6 w-full px-2">
              <Separator className="mb-3" />
              <div className="flex h-5 items-center justify-center gap-4 text-sm text-sidebar-foreground/80">
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-sidebar-foreground"
                >
                  Apis
                </a>
                <Separator orientation="vertical" />
                <Link to="/manual" target="_blank" rel="noreferrer" className="hover:text-sidebar-foreground">
                  Manual
                </Link>
                <Separator orientation="vertical" />
                <Link to="/source" target="_blank" rel="noreferrer" className="hover:text-sidebar-foreground">
                  Source
                </Link>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
