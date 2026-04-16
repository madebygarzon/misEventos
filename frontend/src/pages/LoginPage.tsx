import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login({ email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <h1>Iniciar sesión</h1>
      <form className="card grid" onSubmit={onSubmit}>
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
        <button type="submit" disabled={loading}>Entrar</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
