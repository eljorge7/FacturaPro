"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white">
      <h2 className="text-2xl font-bold mb-4 text-red-500">¡Algo salió mal en FacturaPro!</h2>
      <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl border border-red-500">
        <h3 className="font-semibold mb-2">Detalles del Error:</h3>
        <p className="font-mono text-sm text-red-300 break-words mb-4">
          {error.message || "Error desconocido"}
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-indigo-400">Ver Stack Trace</summary>
          <pre className="mt-2 p-4 bg-slate-950 text-slate-300 text-xs overflow-auto rounded">
            {error.stack}
          </pre>
        </details>
      </div>
      <button
        onClick={() => reset()}
        className="mt-8 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
