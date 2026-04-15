type ApiErrorLike = {
  response?: {
    data?: {
      detail?: unknown;
      message?: string;
    };
  };
  message?: string;
};

function normalizeDetail(detail: unknown): string {
  if (!detail) return "Error inesperado";
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const items = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const msg = (item as Record<string, unknown>).msg;
          if (typeof msg === "string") return msg;
          return JSON.stringify(item);
        }
        return String(item);
      })
      .filter(Boolean);

    return items.join(". ") || "Error inesperado";
  }

  if (typeof detail === "object") {
    const maybeMsg = (detail as Record<string, unknown>).msg;
    if (typeof maybeMsg === "string") return maybeMsg;
    return JSON.stringify(detail);
  }

  return String(detail);
}

export function getErrorMessage(error: ApiErrorLike, fallback: string): string {
  const detail = error?.response?.data?.detail;
  if (detail !== undefined) return normalizeDetail(detail);

  const message = error?.response?.data?.message || error?.message;
  if (message) return message;

  return fallback;
}
