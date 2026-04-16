import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notifyError } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await register({ full_name: fullName, email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <Card className="mx-auto mt-8 w-full max-w-lg">
        <CardHeader>
          <CardTitle>Registro</CardTitle>
          <CardDescription>Crea tu cuenta para gestionar eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="register-full-name">Nombre completo</FieldLabel>
                <Input
                  id="register-full-name"
                  placeholder="Nombre y apellido"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="register-email">Correo electrónico</FieldLabel>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="register-password">Contraseña</FieldLabel>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Crea una contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <FieldDescription>Usa una contraseña segura para proteger tu cuenta.</FieldDescription>
              </Field>

              <Button type="submit" disabled={loading}>
                Crear cuenta
              </Button>
              <FieldError>{error}</FieldError>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
