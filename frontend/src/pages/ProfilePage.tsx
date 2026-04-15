import { useEffect, useState } from "react";

import { myRegistrationsRequest } from "../api/registrations";
import type { RegistrationItem } from "../types/registration";
import { getErrorMessage } from "../utils/errors";

export function ProfilePage() {
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await myRegistrationsRequest();
        setItems(data.items);
      } catch (err: any) {
        setError(getErrorMessage(err, "No fue posible cargar mis registros"));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="container">
      <h1>Mi perfil</h1>
      <p className="muted">Mis inscripciones actuales.</p>
      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !items.length && <p className="muted">No tengo inscripciones todavía.</p>}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <p><strong>Evento:</strong> {item.event_id}</p>
          <p><strong>Estado:</strong> {item.status}</p>
          <p className="muted">{new Date(item.registered_at).toLocaleString()}</p>
          {item.notes && <p><strong>Nota:</strong> {item.notes}</p>}
        </div>
      ))}
    </div>
  );
}
