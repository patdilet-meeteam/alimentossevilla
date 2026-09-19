"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IngredientCategory, NutrientSource } from "@prisma/client";
import { Search, Plus, Eye, Pencil, Power } from "lucide-react";

interface NutrientValue {
  id: string;
  value: any; // Decimal from Prisma
  nutrient: {
    key: string;
    displayName: string;
    unit: string;
  };
}

interface NutritionalProfile {
  id: string;
  source: NutrientSource;
  sourceDetail: string | null;
  referenceBase: string;
  isActive: boolean;
  values: NutrientValue[];
}

interface Ingredient {
  id: string;
  name: string;
  genericName: string | null;
  siesaCode: string;
  category: IngredientCategory;
  isAllergen: boolean;
  allergenTags: string[];
  isActive: boolean;
  createdAt: Date;
  profiles: NutritionalProfile[];
}

interface IngredientTableProps {
  ingredients: Ingredient[];
  onEdit?: (id: string) => void;
  onView?: ((id: string) => void) | undefined;
  onDeactivate?: (id: string) => void;
  isAdmin?: boolean;
}

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  CARNE: "Carnes",
  MATERIA_SECA: "Materia Seca",
  EMPAQUE: "Empaques",
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

const CATEGORY_COLORS: Record<IngredientCategory, string> = {
  CARNE: "bg-slate-100 text-slate-700",
  MATERIA_SECA: "bg-slate-100 text-slate-700",
  EMPAQUE: "bg-slate-100 text-slate-700",
  ADITIVO: "bg-slate-100 text-slate-700",
  MPC: "bg-slate-100 text-slate-700",
  MPNC: "bg-slate-100 text-slate-700",
  PROTEINA: "bg-slate-100 text-slate-700",
  AGUA: "bg-slate-100 text-slate-700",
  CONDIMENTO_ESPECIA: "bg-slate-100 text-slate-700",
  CONSERVANTE: "bg-slate-100 text-slate-700",
  REGULADOR_ACIDEZ: "bg-slate-100 text-slate-700",
  SABORIZANTE: "bg-slate-100 text-slate-700",
  COLORANTE: "bg-slate-100 text-slate-700",
  MPC_PROTEINA: "bg-slate-100 text-slate-700",
  OTRO: "bg-slate-100 text-slate-700",
};

const SOURCE_LABELS: Record<NutrientSource, string> = {
  BANCO_ALIMENTOS: "Banco Alimentos",
  LAB_PROVEEDOR: "Lab. Proveedor",
  LITERATURA: "Literatura",
};

export function IngredientTable({
  ingredients,
  onEdit,
  onView: _onView,
  onDeactivate,
  isAdmin = false,
}: IngredientTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [siesaFilter, setSiesaFilter] = useState<string>("all");

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch =
      searchTerm === "" ||
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.siesaCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ingredient.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesCategory =
      categoryFilter === "all" || ingredient.category === categoryFilter;

    const matchesSiesa =
      siesaFilter === "all" ||
      ingredient.siesaCode.startsWith(siesaFilter);

    return matchesSearch && matchesCategory && matchesSiesa;
  });

  const activeProfile = (profiles: NutritionalProfile[]) =>
    profiles.find((p) => p.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Ingredientes ({filteredIngredients.length})</CardTitle>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={siesaFilter} onValueChange={setSiesaFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prefijo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="11">11 - Carnes</SelectItem>
                <SelectItem value="12">12 - Materia Seca</SelectItem>
                <SelectItem value="13">13 - Empaques</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button onClick={() => router.push("/ingredientes/nuevo")}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código SIESA</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron ingredientes
                </TableCell>
              </TableRow>
            ) : (
              filteredIngredients.map((ingredient) => {
                const profile = activeProfile(ingredient.profiles);
                return (
                  <TableRow key={ingredient.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ingredient.name}</div>
                        {ingredient.genericName && (
                          <div className="text-sm text-muted-foreground">
                            {ingredient.genericName}
                          </div>
                        )}
                        {ingredient.isAllergen && ingredient.allergenTags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {ingredient.allergenTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {ingredient.siesaCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={CATEGORY_COLORS[ingredient.category]}>
                        {CATEGORY_LABELS[ingredient.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {profile ? (
                        <div className="text-sm">
                          <Badge variant="outline">
                            {SOURCE_LABELS[profile.source]}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {profile.values.length} nutrientes
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sin perfil
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ingredient.isActive ? "default" : "secondary"}>
                        {ingredient.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/ingredientes/${ingredient.id}`)}
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit?.(ingredient.id)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {ingredient.isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDeactivate?.(ingredient.id)}
                                title="Desactivar"
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
