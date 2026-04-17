import type { ComponentType } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null);
  const [LottiePlayer, setLottiePlayer] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  useEffect(() => {
    fetch("/Login (1).json")
      .then((response) => response.json())
      .then((data) => setLottieData(data))
      .catch(() => setLottieData(null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isJsdom = window.navigator.userAgent.toLowerCase().includes("jsdom");
    if (isJsdom) return;

    import("lottie-react")
      .then((module) => setLottiePlayer(() => module.default))
      .catch(() => setLottiePlayer(null));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await register({ full_name: fullName, email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <h1 className="my-6">Registro</h1>
      <div className="mx-auto mt-8 grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-2">
        <div className="w-full space-y-4">
          <div>
           
            <p className="muted">Crea tu cuenta para gestionar eventos.</p>
          </div>
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
        </div>

        <div className="flex w-full items-center justify-center ">
          {lottieData && LottiePlayer ? (
            <LottiePlayer animationData={lottieData} loop className="h-full w-full max-w-xl" />
          ) : (
            <p className="muted">No se pudo cargar la animación.</p>
          )}
        </div>
      </div>
    </div>
  );
}
