"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientCategory, NutrientSource, Nutrient } from "@prisma/client";

interface IngredientFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  nutrients?: Nutrient[];
  isSubmitting?: boolean;
}

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  CARNE: "Carnes (11)",
  MATERIA_SECA: "Materia Seca (12)",
  EMPAQUE: "Empaques (13)",
  ADITIVO: "Aditivo",
  MPC: "MPC",
  MPNC: "MPNC",
  PROTEINA: "Proteína",
  AGUA: "Agua",
  CONDIMENTO_ESPECIA: "Condimento / Especia",
  CONSERVANTE: "Conservante",
  REGULADOR_ACIDEZ: "Regulador de acidez",
  SABORIZANTE: "Saborizante",
  COLORANTE: "Colorante",
  MPC_PROTEINA: "MPC / Proteína",
  OTRO: "Otro",
};

const SOURCE_LABELS: Record<NutrientSource, string> = {
  BANCO_ALIMENTOS: "Banco de Alimentos",
  LAB_PROVEEDOR: "Lab. Proveedor",
  LITERATURA: "Literatura Técnica",
};

const SIESA_PREFIXES = [
  { value: "11", label: "11 - Carnes" },
  { value: "12", label: "12 - Materia Seca" },
  { value: "13", label: "13 - Empaques" },
];

export function IngredientForm({
  onSubmit,
  initialData,
  nutrients = [],
  isSubmitting = false,
}: IngredientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    genericName: initialData?.genericName || "",
    siesaCode: initialData?.siesaCode || "",
    category: initialData?.category || "CARNE",
    isAllergen: initialData?.isAllergen || false,
    allergenTags: initialData?.allergenTags || [],
    // Profile fields
    source: initialData?.profiles?.[0]?.source || "BANCO_ALIMENTOS",
    sourceDetail: initialData?.profiles?.[0]?.sourceDetail || "",
    nutrientValues: initialData?.profiles?.[0]?.values?.map((v: any) => ({
      nutrientId: v.nutrientId,
      value: v.value,
      method: v.method || "",
    })) || [],
  });

  const [allergenInput, setAllergenInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addAllergenTag = () => {
    if (allergenInput.trim() && !formData.allergenTags.includes(allergenInput.trim())) {
      setFormData({
        ...formData,
        allergenTags: [...formData.allergenTags, allergenInput.trim()],
      });
      setAllergenInput("");
    }
  };

  const removeAllergenTag = (tag: string) => {
    setFormData({
      ...formData,
      allergenTags: formData.allergenTags.filter((t: string) => t !== tag),
    });
  };

  const handleNutrientValueChange = (nutrientId: string, value: string) => {
    const existing = formData.nutrientValues.findIndex(
      (nv: any) => nv.nutrientId === nutrientId
    );
    if (existing >= 0) {
      const updated = [...formData.nutrientValues];
      updated[existing] = { ...updated[existing], value: value ? parseFloat(value) : 0 };
      setFormData({ ...formData, nutrientValues: updated });
    } else {
      setFormData({
        ...formData,
        nutrientValues: [
          ...formData.nutrientValues,
          { nutrientId, value: value ? parseFloat(value) : 0, method: "" },
        ],
      });
    }
  };

  const requiredNutrients = nutrients.filter((n) => n.isRequiredOnLabel);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Ingrediente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Carne de res molida"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genericName">Nombre Genérico</Label>
              <Input
                id="genericName"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                placeholder="ej. Producto cárnico procesado"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siesaCode">Código SIESA *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.siesaCode.substring(0, 2) || "11"}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      siesaCode: val + formData.siesaCode.substring(2),
                      category:
                        val === "11"
                          ? "CARNE"
                          : val === "12"
                          ? "MATERIA_SECA"
                          : val === "13"
                          ? "EMPAQUE"
                          : formData.category,
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Prefijo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIESA_PREFIXES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="siesaCode"
                  value={formData.siesaCode}
                  onChange={(e) =>
                    setFormData({ ...formData, siesaCode: e.target.value })
                  }
                  placeholder="1100001"
                  className="flex-1"
                  required
                  pattern="^1[123]\d{5}$"
                  title="Código SIESA: 2 dígitos de prefijo + 5 dígitos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val as IngredientCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAllergen"
              checked={formData.isAllergen}
              onCheckedChange={(checked: any) =>
                setFormData({ ...formData, isAllergen: checked as boolean })
              }
            />
            <Label htmlFor="isAllergen" className="cursor-pointer">
              Es alérgeno
            </Label>
          </div>

          {formData.isAllergen && (
            <div className="space-y-2">
              <Label>Etiquetas de Alérgenos</Label>
              <div className="flex gap-2">
                <Input
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  placeholder="ej. Gluten, Lácteos"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAllergenTag())}
                />
                <Button type="button" variant="outline" onClick={addAllergenTag}>
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergenTags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeAllergenTag(tag)}>
                    {tag} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil Nutricional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente de Datos *</Label>
              <Select
                value={formData.source}
                onValueChange={(val) =>
                  setFormData({ ...formData, source: val as NutrientSource })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceDetail">Detalle de Fuente</Label>
              <Input
                id="sourceDetail"
                value={formData.sourceDetail}
                onChange={(e) =>
                  setFormData({ ...formData, sourceDetail: e.target.value })
                }
                placeholder="ej. Ficha técnica proveedor XYZ"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valores Nutricionales (por 100g)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {requiredNutrients.map((nutrient) => {
                const currentValue = formData.nutrientValues.find(
                  (nv: any) => nv.nutrientId === nutrient.id
                );
                return (
                  <div key={nutrient.id} className="space-y-1">
                    <Label className="text-xs">{nutrient.displayName}</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentValue?.value || ""}
                        onChange={(e) =>
                          handleNutrientValueChange(nutrient.id, e.target.value)
                        }
                        placeholder="0"
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">
                        {nutrient.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
