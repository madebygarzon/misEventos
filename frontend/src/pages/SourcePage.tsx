import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { SectionSpinner } from "@/components/SectionSpinner";

export function SourcePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const candidates = [
          "/docs/structured_project.md",
          "/public/docs/structured_project.md",
          "/@fs//app/public/docs/structured_project.md"
        ];

        let loadedText = "";
        for (const url of candidates) {
          const response = await fetch(url);
          if (!response.ok) continue;
          const text = await response.text();
          const looksLikeHtml = /^\s*<!doctype html>/i.test(text) || /^\s*<html/i.test(text);
          if (!looksLikeHtml && text.trim().length) {
            loadedText = text;
            break;
          }
        }

        if (!loadedText) {
          throw new Error("No fue posible cargar el markdown de source.");
        }
        setContent(loadedText);
      } catch (err: any) {
        setError(err?.message || "No fue posible cargar el documento de fuente.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Source</h1>
        <Link to="/" className="text-sm underline underline-offset-4">
          Volver al sistema
        </Link>
      </div>

      {loading && <SectionSpinner label="Cargando documentación fuente..." />}
      {!loading && error && <p className="error">{error}</p>}

      {!loading && !error && (
        <article className="rounded-lg border border-border bg-background p-5">
          <div className="markdown-content space-y-3 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </article>
      )}
    </div>
  );
}
