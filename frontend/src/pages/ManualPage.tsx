import { Link } from "react-router-dom";

type TestUser = {
  fullName: string;
  email: string;
  password: string;
  role: "Administrador" | "Organizador" | "Asistente";
};

const TEST_USERS: TestUser[] = [
  {
    fullName: "Carlos Garzon C",
    email: "madebygarzon@gmail.com",
    password: "password123",
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
        <h2 className="text-lg font-semibold">Usuarios de prueba para reclutador</h2>
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
        <h2 className="text-lg font-semibold">Flujos de usuario</h2>
        <p className="muted">
          Guía rápida para validar qué puede hacer cada perfil dentro de la plataforma.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">1) Usuario no logueado</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Ingresa a Inicio y puede ver el listado de eventos públicos.</li>
              <li>Usa búsqueda y navegación para revisar eventos y su detalle.</li>
              <li>Si intenta acciones privadas (inscribirse), debe iniciar sesión o registrarse.</li>
              <li>Un usuario no logueado puede consultar si es oferente en alguna sesión.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">2) Usuario logueado - Perfil asistente</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Inicia sesión y navega por eventos disponibles.</li>
              <li>Se inscribe a eventos con cupo.</li>
              <li>Puede cancelar su inscripción cuando aplique.</li>
              <li>En Mi perfil consulta sus inscripciones e historial.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">3) Usuario logueado - Perfil organizador</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Crea, edita y elimina sus propios eventos.</li>
              <li>Define fechas, capacidad, estado e imagen destacada del evento.</li>
              <li>Gestiona sesiones del evento (crear, editar, eliminar).</li>
              <li>Asigna ponentes a sesiones existentes o crea ponentes externos.</li>
            </ol>
          </article>

          <article className="rounded-lg border border-border p-4">
            <h3 className="font-semibold">4) Usuario logueado - Perfil admin</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>Tiene acceso global sobre eventos, sesiones y gestión operativa.</li>
              <li>Puede administrar usuarios y actualizar sus roles.</li>
              <li>Visualiza la sección de Métricas con indicadores de plataforma.</li>
              <li>Puede validar permisos y comportamiento de todos los flujos.</li>
            </ol>
          </article>
        </div>
      </section>
    </div>
  );
}
