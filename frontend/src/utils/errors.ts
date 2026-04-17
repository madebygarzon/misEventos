type ApiErrorLike = {
  response?: {
    data?: {
      detail?: unknown;
      message?: string;
    };
  };
  message?: string;
};

function translateKnownError(message: string): string {
  const normalized = message.trim().toLowerCase();

  const knownErrors: Record<string, string> = {
    "event is full": "Este evento ya alcanzó su capacidad máxima.",
    "event not found": "El evento no fue encontrado.",
    "registration not found": "La inscripción no fue encontrada.",
    "user already registered": "Ya estás inscrito en este evento.",
    "already registered": "Ya estás inscrito en este evento.",
    "unauthorized": "No tienes permisos para realizar esta acción.",
    "forbidden": "No tienes acceso a este recurso.",
    "invalid credentials": "Las credenciales ingresadas no son válidas.",
    "validation error": "Hay datos inválidos en el formulario.",
    "network error": "No fue posible conectar con el servidor. Revisa tu conexión.",
    "internal server error": "Ocurrió un error interno en el servidor.",
  };

  return knownErrors[normalized] || message;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "Error no legible";
  }
}

function normalizeDetail(detail: unknown): string {
  if (!detail) {
    return "Ocurrió un error inesperado. Intenta nuevamente.";
  }

  if (typeof detail === "string") {
    return translateKnownError(detail);
  }

  if (Array.isArray(detail)) {
    const items = detail
      .map((item) => {
        if (typeof item === "string") return translateKnownError(item);

        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;

          if (Array.isArray(record.loc) && typeof record.msg === "string") {
            const fieldPath = record.loc
              .filter((segment) => segment !== "body")
              .map((segment) => String(segment))
              .join(".");
            const translated = translateKnownError(record.msg);
            return fieldPath ? `${fieldPath}: ${translated}` : translated;
          }

          if (typeof record.msg === "string") {
            return translateKnownError(record.msg);
          }

          if (typeof record.message === "string") {
            return translateKnownError(record.message);
          }

          return safeStringify(item);
        }

        return String(item);
      })
      .filter(Boolean);

    return items.join(". ") || "Ocurrió un error inesperado. Intenta nuevamente.";
  }

  if (typeof detail === "object") {
    const record = detail as Record<string, unknown>;

    if (typeof record.msg === "string") {
      return translateKnownError(record.msg);
    }

    if (typeof record.message === "string") {
      return translateKnownError(record.message);
    }

    return safeStringify(detail);
  }

  return translateKnownError(String(detail));
}

export function getErrorMessage(error: ApiErrorLike, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (detail !== undefined) {
    return normalizeDetail(detail);
  }

  const message = error?.response?.data?.message || error?.message;
  if (message) {
    return translateKnownError(message);
  }

  return fallback;
}
