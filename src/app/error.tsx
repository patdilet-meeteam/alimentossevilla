"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado capturado por GlobalError:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-6 rounded-lg bg-white dark:bg-slate-900 border shadow-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Ocurrió un error inesperado
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          El sistema ha capturado una excepción no controlada. Se ha registrado el evento para análisis del equipo técnico.
        </p>
        <div className="pt-2">
          <Button onClick={() => reset()} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reintentar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
