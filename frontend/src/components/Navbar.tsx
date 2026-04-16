import { Link } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || user?.roles?.includes("admin"));

  return (
    <nav>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link to="/">Mis Eventos</Link>
          {isAuthenticated && canManageEvents && <Link to="/events/create">Crear evento</Link>}
          {isAuthenticated && <Link to="/profile">Mi perfil</Link>}
        </div>
        <div>
          {!isAuthenticated ? (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registro</Link>
            </>
          ) : (
            <div className="actions" style={{ alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{user?.full_name}</span>
              <button className="secondary" onClick={logout}>Salir</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
