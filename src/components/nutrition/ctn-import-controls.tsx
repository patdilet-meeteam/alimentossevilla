"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { importCtnCsvToDraft } from "@/app/actions/nutrition-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CtnImportControls({ formulationId }: { formulationId: string }) {
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
        const result = await importCtnCsvToDraft(formData);
        setMessage({ ok: result.ok, text: result.message });
        if (result.ok) { formRef.current?.reset(); router.refresh(); }
      } catch (error) {
        setMessage({ ok: false, text: error instanceof Error ? error.message : "No fue posible importar el CTN." });
      }
    });
  }

  return (
    <div className="rounded-md border border-dashed border-[#6FC7DA]/60 bg-[#DDF7FC]/30 p-3">
      <p className="text-sm font-medium text-[#1F2933]">Importar receta CTN</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Crea una nueva versión DRAFT desde cantidades canónicas y conserva los valores nutricionales de cada fila como fuente de esa versión. Puede cargar el libro Excel con hoja CTN o una exportación CSV. Si algún ingrediente no existe en el maestro, no realiza cambios.
      </p>
      <form ref={formRef} onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <input name="formulationId" type="hidden" value={formulationId} />
        <div className="min-w-64 space-y-1.5">
          <Label htmlFor={`ctn-file-${formulationId}`}><FileSpreadsheet className="mr-1 inline size-3.5" />CTN (.xlsx o .csv)</Label>
          <Input id={`ctn-file-${formulationId}`} name="file" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required disabled={pending} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}Importar CTN
        </Button>
      </form>
      {message ? <Alert className="mt-3" variant={message.ok ? "success" : "destructive"}>
        <AlertTitle>{message.ok ? "Borrador creado" : "Importación no completada"}</AlertTitle>
        <AlertDescription>{message.text}</AlertDescription>
      </Alert> : null}
    </div>
  );
}
