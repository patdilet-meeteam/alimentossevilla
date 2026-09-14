"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyCostImport, createCostImport } from "@/app/actions/cost-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Upload } from "lucide-react";

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
          La carga y aplicación de costos está restringida al rol ADMIN mientras no exista una matriz funcional de Finanzas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="cost-period">Periodo mensual</Label>
          <Input id="cost-period" name="period" type="month" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost-file">Archivo de costos</Label>
          <Input id="cost-file" name="file" type="file" accept=".xlsx" required disabled={pending} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
          Importar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Formato confirmado: hoja Hoja1, columnas código, descripción, código repetido, unidad y costo. Máximo 5 MB.
      </p>
      {message ? (
        <Alert variant={message.ok ? "success" : "destructive"}>
          <AlertTitle>{message.ok ? "Importación registrada" : "Importación no completada"}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}
    </form>
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
