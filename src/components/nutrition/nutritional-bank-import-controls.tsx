"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { importNutritionalBankProfiles } from "@/app/actions/nutrition-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NutritionalBankImportControls() {
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
        const result = await importNutritionalBankProfiles(formData);
        setMessage({ ok: result.ok, text: result.message });
        if (result.ok) { formRef.current?.reset(); router.refresh(); }
      } catch (error) {
        setMessage({ ok: false, text: error instanceof Error ? error.message : "No fue posible importar el Banco Nutricional." });
      }
    });
  }

  return (
    <section className="rounded-md border border-dashed border-[#6FC7DA]/60 bg-[#DDF7FC]/30 p-4">
      <p className="text-sm font-medium text-[#1F2933]">Actualizar perfiles desde el Banco Nutricional</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Use esta carga cuando reciba una nueva versión aprobada del Banco Nutricional; no es necesaria para consultar el catálogo. Lee la hoja TN OFICIAL. Solo versiona perfiles de ingredientes maestros que coincidan de forma única; no crea ingredientes sin código SIESA ni reemplaza perfiles de laboratorio o literatura.
      </p>
      <form ref={formRef} onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-64 space-y-1.5">
          <Label htmlFor="nutritional-bank-file"><FileSpreadsheet className="mr-1 inline size-3.5" />Nueva versión del Banco (.xlsx)</Label>
          <Input id="nutritional-bank-file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required disabled={pending} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}Versionar perfiles
        </Button>
      </form>
      {message ? <Alert className="mt-3" variant={message.ok ? "success" : "destructive"}>
        <AlertTitle>{message.ok ? "Perfiles versionados" : "Importación no completada"}</AlertTitle>
        <AlertDescription>{message.text}</AlertDescription>
      </Alert> : null}
    </section>
  );
}
