import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useEventsStore } from "../store/eventsStore";

export function EventsListPage() {
  const { events, loading, error, page, pages, fetchEvents } = useEventsStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEvents({ page: 1, limit: 10 });
  }, [fetchEvents]);

  const onSearch = () => {
    fetchEvents({ page: 1, limit: 10, search: search || undefined });
  };

  return (
    <div className="container">
      <h1>Eventos</h1>
      <p className="muted">Consulta, filtra y navega entre eventos disponibles.</p>

      <div className="card grid grid-2">
        <input
          placeholder="Buscar por nombre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={onSearch}>Buscar</button>
      </div>

      {loading && <p className="muted">Cargando eventos...</p>}
      {error && <p className="error">{error}</p>}

      {events.map((event) => (
        <div key={event.id} className="card">
          <h3>{event.name}</h3>
          <p className="muted">{event.location || "Sin ubicación"} · {event.status}</p>
          <p>{event.description || "Sin descripción"}</p>
          <div className="actions">
            <Link to={`/events/${event.id}`}>Ver detalle</Link>
            <Link to={`/events/${event.id}/edit`}>Editar</Link>
          </div>
        </div>
      ))}

      <div className="actions">
        <button className="secondary" disabled={page <= 1} onClick={() => fetchEvents({ page: page - 1 })}>
          Anterior
        </button>
        <span className="muted">Página {page} de {pages}</span>
        <button className="secondary" disabled={page >= pages} onClick={() => fetchEvents({ page: page + 1 })}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
