import type { ComponentType } from "react";
import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
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
    if (password !== confirmPassword) {
      setValidationError("Las contraseñas no coinciden.");
      return;
    }
    setValidationError("");
    const ok = await register({ full_name: fullName, email, password });
    if (ok) navigate("/");
  };

  return (
    <div className="container">
      <h1 className="my-6">Registro</h1>
      <Card className="mx-auto mt-8">
        <CardContent className="pt-4">
          <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="w-full space-y-4">
              <div>
                <p className="muted text-xl mb-10">Crea tu cuenta para gestionar eventos.</p>
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
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crea una contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                    <FieldDescription>Usa una contraseña segura para proteger tu cuenta.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="register-confirm-password">Confirmar contraseña</FieldLabel>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirma tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </Field>

                  <Button type="submit" disabled={loading}>
                    Crear cuenta
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link to="/login">Ya tengo cuenta</Link>
                  </Button>
                  <FieldError>{validationError}</FieldError>
                  <FieldError>{error}</FieldError>
                </FieldGroup>
              </form>
            </div>

            <div className="flex w-full items-center justify-center">
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
