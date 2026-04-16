import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await register({ full_name: fullName, email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <h1>Registro</h1>
      <form className="card grid" onSubmit={onSubmit}>
        <input
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Crear cuenta</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
