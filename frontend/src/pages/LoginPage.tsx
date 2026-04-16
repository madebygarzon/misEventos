import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notifyError } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login({ email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <Card className="mx-auto mt-8 w-full max-w-lg">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Accede con tus credenciales para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Correo electrónico</FieldLabel>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FieldDescription>Mínimo 8 caracteres recomendados.</FieldDescription>
              </Field>

              <Button type="submit" disabled={loading}>
                Entrar
              </Button>
              <FieldError>{error}</FieldError>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
