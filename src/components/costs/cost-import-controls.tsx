"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { applyCostImport, createCostImport } from "@/app/actions/cost-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload, FileSpreadsheet, Download, ListChecks } from "lucide-react";

interface CostImportControlsProps {
  canManage: boolean;
}

export function CostImportControls({ canManage }: CostImportControlsProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await createCostImport(formData);
        setMessage({ ok: result.ok, text: result.message });
        if (result.ok) {
          formRef.current?.reset();
          router.refresh();
        }
      } catch (error) {
        setMessage({
          ok: false,
          text: error instanceof Error ? error.message : "No fue posible importar el archivo.",
        });
      }
    });
  }

  if (!canManage) {
    return (
      <Alert variant="info">
        <AlertTitle>Consulta habilitada</AlertTitle>
        <AlertDescription>
          En esta versión, la carga y aplicación de costos está habilitada para el perfil Administrador. Finanzas conserva acceso de consulta.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      <Alert variant="info">
        <ListChecks className="size-4" />
        <AlertTitle>¿Qué archivo debo importar?</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            El archivo de costos mensuales que entrega <strong>Finanzas</strong> cada mes.
            Ejemplo: <code className="bg-blue-100 dark:bg-blue-950 px-1 py-0.5 rounded text-xs">Junio costos Base de Datos ME - MPNC - MPC.xlsx</code>.
            NO es el archivo CTN (ese es para el motor nutricional, no para costos).
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            <li><strong>Hoja:</strong> la primera hoja debe llamarse <code>Hoja1</code>.</li>
            <li><strong>Columnas (orden estricto):</strong> código SIESA · descripción · código repetido · unidad · costo unitario.</li>
            <li><strong>Unidades válidas:</strong> <code>KG</code>, <code>UND</code> o <code>MTR</code>.</li>
            <li><strong>Códigos SIESA:</strong> prefijos 11, 12 o 13, sin espacios, 6-20 caracteres.</li>
            <li><strong>Tamaño máximo:</strong> 5 MB.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="cost-period">Periodo mensual</Label>
            <Input id="cost-period" name="period" type="month" required disabled={pending} />
            <p className="text-[11px] text-muted-foreground">
              Formato AAAA-MM · corresponde al mes del archivo de costos.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost-file">
              <FileSpreadsheet className="mr-1 inline size-3.5" />
              Archivo de costos (.xlsx)
            </Label>
            <Input id="cost-file" name="file" type="file" accept=".xlsx" required disabled={pending} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
            Importar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-[#6FC7DA]/50 bg-[#DDF7FC]/40 px-3 py-2 text-xs text-slate-600">
          <Download className="size-3.5 text-[#1C4378]" />
          <span>¿No tenés un archivo con este formato?</span>
          <Link
            href="/plantilla_costos_sevilla.xlsx"
            download
            className="font-medium text-[#1C4378] underline underline-offset-2 hover:text-[#6FC7DA]"
          >
            Descargar plantilla con el formato correcto
          </Link>
        </div>

        {message ? (
          <Alert variant={message.ok ? "success" : "destructive"}>
            <AlertTitle>{message.ok ? "Importación registrada" : "Importación no completada"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        ) : null}
      </form>
    </div>
  );
}

interface ApplyCostImportButtonProps {
  importId: string;
  disabled: boolean;
}

export function ApplyCostImportButton({ importId, disabled }: ApplyCostImportButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await applyCostImport(importId);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No fue posible aplicar la importación.");
      }
    });
  }

  return (
    <div className="space-y-1 text-right">
      <Button size="sm" onClick={apply} disabled={disabled || pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Aplicar
      </Button>
      {error ? <p className="max-w-64 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
