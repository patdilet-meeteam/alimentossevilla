"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, X } from "lucide-react";
import { createProduct } from "@/app/actions/product-actions";
import {
  normalizeCodigoInterno,
  type ProductCategory,
  type CreateProductInput,
} from "@/lib/validations/products";

const CATEGORIES: Array<{ value: ProductCategory; label: string }> = [
  { value: "SALCHICHA", label: "Salchicha" },
  { value: "CHORIZO", label: "Chorizo" },
  { value: "JAMON", label: "Jamón" },
  { value: "MORTADELA", label: "Mortadela" },
  { value: "TOCINETA", label: "Tocineta" },
  { value: "PERRO_CALIENTE", label: "Perro caliente" },
  { value: "OTRO", label: "Otro" },
];

export function ProductCreateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [codigoInterno, setCodigoInterno] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [categoriaProducto, setCategoriaProducto] = useState<ProductCategory>("SALCHICHA");
  const [descripcion, setDescripcion] = useState("");

  function reset() {
    setCodigoInterno("");
    setNombreComercial("");
    setCategoriaProducto("SALCHICHA");
    setDescripcion("");
    setError(null);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const payload: CreateProductInput = {
      codigoInterno: normalizeCodigoInterno(codigoInterno),
      nombreComercial: nombreComercial.trim(),
      categoriaProducto,
      descripcion: descripcion.trim() || null,
    };
    startTransition(async () => {
      try {
        await createProduct(payload);
        reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido al crear el producto.");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        Nuevo producto
      </Button>
    );
  }

  return (
    <Card className="border-[#D3D8DE]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Nuevo producto</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => { reset(); setOpen(false); }} aria-label="Cerrar">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="codigoInterno">Código interno</Label>
            <Input
              id="codigoInterno"
              required
              minLength={2}
              maxLength={60}
              placeholder="salchicha-desayuno-premium"
              value={codigoInterno}
              onChange={(e) => setCodigoInterno(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números y guiones. Ejemplo: <code>salchicha-desayuno-premium</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreComercial">Nombre comercial</Label>
            <Input
              id="nombreComercial"
              required
              maxLength={255}
              placeholder="Salchicha Desayuno Premium"
              value={nombreComercial}
              onChange={(e) => setNombreComercial(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoriaProducto">Categoría</Label>
            <Select value={categoriaProducto} onValueChange={(v) => setCategoriaProducto(v as ProductCategory)}>
              <SelectTrigger id="categoriaProducto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input
              id="descripcion"
              maxLength={2000}
              placeholder="Salchicha de cerdo tipo alemán, ahumada en frío…"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 md:col-span-2">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => { reset(); setOpen(false); }} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !codigoInterno.trim() || !nombreComercial.trim()}>
              {pending ? <><Loader2 className="mr-2 size-4 animate-spin" />Creando…</> : "Crear producto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
