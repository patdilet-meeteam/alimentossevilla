"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Upload } from "lucide-react";
import { importJuneSalchichaMaster } from "@/app/actions/nutrition-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JuneMasterImportControls() {
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
        const result = await importJuneSalchichaMaster(formData);
        setMessage({ ok: result.ok, text: result.message });
        if (result.ok) { formRef.current?.reset(); router.refresh(); }
      } catch (error) {
        setMessage({ ok: false, text: error instanceof Error ? error.message : "No fue posible cargar el maestro piloto." });
      }
    });
  }

  return (
    <section className="rounded-md border border-dashed border-[#6FC7DA]/60 bg-[#DDF7FC]/30 p-4">
      <p className="text-sm font-medium text-[#1F2933]">Cargar maestro piloto de junio</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Crea únicamente las 18 materias primas de Salchicha Desayuno Premium desde la hoja confirmada. Solo reconcilia registros provisionales creados desde costos; si un código ya tiene datos técnicos distintos, no realiza cambios.
      </p>
      <form ref={formRef} onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-64 space-y-1.5">
          <Label htmlFor="june-master-file"><Database className="mr-1 inline size-3.5" />Archivo de junio (.xlsx)</Label>
          <Input id="june-master-file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required disabled={pending} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}Cargar maestro
        </Button>
      </form>
      {message ? <Alert className="mt-3" variant={message.ok ? "success" : "destructive"}>
        <AlertTitle>{message.ok ? "Maestro actualizado" : "Carga no completada"}</AlertTitle>
        <AlertDescription>{message.text}</AlertDescription>
      </Alert> : null}
    </section>
  );
}
