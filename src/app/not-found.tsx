import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-6 rounded-lg bg-white dark:bg-slate-900 border shadow-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Página no encontrada
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          La ruta solicitada no existe o ha sido reubicada dentro del sistema.
        </p>
        <div className="pt-2">
          <Button asChild size="sm" className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
