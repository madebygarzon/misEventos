import { Link } from "react-router-dom";

type TestUser = {
  fullName: string;
  email: string;
  password: string;
  role: "Administrador" | "Organizador" | "Asistente";
};

type PermissionRow = {
  action: string;
  visitor: string;
  attendee: string;
  organizer: string;
  admin: string;
};

const TEST_USERS: TestUser[] = [
  {
    fullName: "Carlos Garzon C",
    email: "madebygarzon@gmail.com",
    password: "Admin123*",
    role: "Administrador"
  },
  {
    fullName: "Yuliana Sosa Aguirre",
    email: "ysosa@gmail.com",
    password: "password123",
    role: "Organizador"
  },
  {
    fullName: "Juan Jose Urrego",
    email: "jsosa@gmail.com",
    password: "password123",
    role: "Asistente"
  }
];

const SHARED_COMPONENTS = [
  "Menú lateral con opciones según rol.",
  "Inicio con carrusel de últimos 12 eventos (pausa al pasar el cursor).",
  "Eventos con buscador por nombre, filtro por fecha y paginación.",
  "Detalle de evento con sesiones, ponentes y estado.",
  "Vista ¿Soy oferente? para validar agenda por nombre.",
  "Autenticación con iniciar sesión, registro y cierre de sesión."
];

const GLOBAL_RULES = [
  "El registro crea usuarios con rol por defecto Asistente.",
  "La consulta de eventos y detalles es pública; la inscripción requiere autenticación.",
  "La inscripción solo se habilita si hay cupos disponibles.",
  "No se permite inscripción duplicada al mismo evento.",
  "La navegación y acciones visibles cambian por rol (RBAC)."
];

const PERMISSIONS: PermissionRow[] = [
  {
    action: "Ver inicio, eventos y detalle",
    visitor: "Sí",
    attendee: "Sí",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Inscribirse a evento",
    visitor: "No",
    attendee: "Sí",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Consultar ¿Soy oferente?",
    visitor: "Sí",
    attendee: "Sí",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Editar perfil (nombre/contraseña)",
    visitor: "No",
    attendee: "Sí",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Crear evento",
    visitor: "No",
    attendee: "No",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Editar/eliminar evento propio",
    visitor: "No",
    attendee: "No",
    organizer: "Sí",
    admin: "Sí"
  },
  {
    action: "Editar/eliminar cualquier evento",
    visitor: "No",
    attendee: "No",
    organizer: "No",
    admin: "Sí"
  },
  {
    action: "Ver métricas",
    visitor: "No",
    attendee: "No",
    organizer: "No",
    admin: "Sí"
  },
  {
    action: "Gestionar usuarios y roles",
    visitor: "No",
    attendee: "No",
    organizer: "No",
    admin: "Sí"
  }
];

export function ManualPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Manual de uso</h1>
        <Link to="/" className="text-sm underline underline-offset-4">
          Volver al sistema
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Usuarios de pruebas de flujo</h2>
        <p className="muted">
          Usa estas credenciales para validar permisos por rol y flujos principales del sistema.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Contraseña</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
              </tr>
            </thead>
            <tbody>
              {TEST_USERS.map((user) => (
                <tr key={user.email} className="border-t border-border">
                  <td className="px-4 py-3">{user.fullName}</td>
                  <td className="px-4 py-3 font-mono">{user.email}</td>
                  <td className="px-4 py-3 font-mono">{user.password}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold">
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Reglas globales</h2>
        <p className="muted">Estas reglas aplican en todos los módulos de la plataforma.</p>

        <ul className="list-disc space-y-1 pl-5 text-sm">
          {GLOBAL_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Componentes compartidos</h2>
        <p className="muted">Elementos base que se repiten en los principales flujos.</p>

        <ul className="list-disc space-y-1 pl-5 text-sm">
          {SHARED_COMPONENTS.map((component) => (
            <li key={component}>{component}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Flujos de usuario</h2>
        <p className="muted">
          Guía rápida para validar qué puede hacer cada perfil dentro de la plataforma.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">1) Usuario no logueado</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Menú: Inicio, Eventos, ¿Soy oferente? y Acceder.</li>
              <li>Puede ver listado público, filtrar por nombre/fecha y revisar detalles.</li>
              <li>En detalle de evento puede ver contenido, pero debe autenticarse para inscribirse.</li>
              <li>El menú Acceder muestra iniciar sesión, registrarme y acceso a ¿Soy oferente?.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">2) Usuario logueado - Perfil asistente</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Menú: Inicio, Eventos, ¿Soy oferente?, Mi perfil y Salir.</li>
              <li>Puede inscribirse en eventos con cupos disponibles.</li>
              <li>En Mi perfil puede editar nombre y contraseña (validando clave actual).</li>
              <li>En Agenda de eventos consulta sus eventos inscritos y accede al detalle.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">3) Usuario logueado - Perfil organizador</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Menú: Inicio, Eventos, ¿Soy oferente?, Crear evento, Mi perfil y Salir.</li>
              <li>Crea eventos con nombre, fecha, capacidad, estado, ubicación e imagen.</li>
              <li>En eventos creados por él puede editar/eliminar evento y crear/editar sesiones.</li>
              <li>En Mi perfil ve eventos organizados por mí y agenda personal.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">4) Usuario logueado - Perfil admin</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Menú: Inicio, Eventos, ¿Soy oferente?, Métricas, Crear evento, Mi perfil y Salir.</li>
              <li>Tiene control total sobre todos los eventos y sus sesiones.</li>
              <li>Accede a Gestión de usuarios para cambio de roles.</li>
              <li>Visualiza Métricas con indicadores operativos de la plataforma.</li>
            </ol>
          </article>
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold">Matriz rápida de permisos</h2>
        <p className="muted">Resumen visual de capacidades por tipo de usuario.</p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-semibold">Módulo / Acción</th>
                <th className="px-4 py-3 font-semibold">Visitante</th>
                <th className="px-4 py-3 font-semibold">Asistente</th>
                <th className="px-4 py-3 font-semibold">Organizador</th>
                <th className="px-4 py-3 font-semibold">Administrador</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission.action} className="border-t border-border">
                  <td className="px-4 py-3">{permission.action}</td>
                  <td className="px-4 py-3">{permission.visitor}</td>
                  <td className="px-4 py-3">{permission.attendee}</td>
                  <td className="px-4 py-3">{permission.organizer}</td>
                  <td className="px-4 py-3">{permission.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
