import type { ComponentType } from "react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notifyError } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
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
    const ok = await login({ email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <h1 className="my-6">Iniciar sesión</h1>
      <Card className="mx-auto mt-8">
        <CardContent className="pt-4">
          <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="w-full space-y-4">
              <div>
                <p className="muted text-xl mb-10">Accede con tus credenciales para continuar.</p>
              </div>
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
                  <Button asChild type="button" variant="outline">
                    <Link to="/register">No tengo cuenta</Link>
                  </Button>
                  <FieldError>{error}</FieldError>
                </FieldGroup>
              </form>
            </div>

            <div className="flex min-h-100 w-full items-center justify-center">
              {lottieData && LottiePlayer ? (
                <LottiePlayer animationData={lottieData} loop className="h-full w-full max-w-xl" />
              ) : (
                <p className="muted">No se pudo cargar la animación.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
