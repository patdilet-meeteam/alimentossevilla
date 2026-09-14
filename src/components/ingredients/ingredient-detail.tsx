"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { IngredientCategory, NutrientSource } from "@prisma/client";

interface NutrientValue {
  id: string;
  value: any; // Decimal from Prisma
  method: string | null;
  nutrient: {
    key: string;
    displayName: string;
    unit: string;
    isRequiredOnLabel: boolean;
  };
}

interface NutritionalProfile {
  id: string;
  source: NutrientSource;
  sourceDetail: string | null;
  validFrom: Date;
  referenceBase: string;
  isActive: boolean;
  createdAt: Date;
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
  updatedAt: Date;
  profiles: NutritionalProfile[];
}

interface IngredientDetailProps {
  ingredient: Ingredient;
  onEdit?: () => void;
  onDeactivate?: () => void;
  isAdmin?: boolean;
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
  LAB_PROVEEDOR: "Laboratorio del Proveedor",
  LITERATURA: "Literatura Técnica",
};

export function IngredientDetail({
  ingredient,
  onEdit,
  onDeactivate,
  isAdmin = false,
}: IngredientDetailProps) {
  const router = useRouter();

  const activeProfile = ingredient.profiles.find((p) => p.isActive);

  const formatValue = (val: any): string => {
    const num = typeof val === 'number' ? val : Number(val);
    return num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ingredient.name}</h1>
            {ingredient.genericName && (
              <p className="text-muted-foreground">{ingredient.genericName}</p>
            )}
          </div>
        </div>
        {isAdmin && ingredient.isActive && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={onDeactivate}>
              <Power className="h-4 w-4 mr-2" />
              Desactivar
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Badge variant={ingredient.isActive ? "default" : "secondary"}>
          {ingredient.isActive ? "Activo" : "Inactivo"}
        </Badge>
        <Badge variant="outline">{CATEGORY_LABELS[ingredient.category]}</Badge>
        <code className="bg-muted px-2 py-1 rounded text-sm self-center">
          {ingredient.siesaCode}
        </code>
      </div>

      {ingredient.isAllergen && ingredient.allergenTags.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Alérgenos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex gap-2 flex-wrap">
              {ingredient.allergenTags.map((tag) => (
                <Badge key={tag} variant="destructive">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil Nutricional</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {activeProfile ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Información del Perfil</CardTitle>
                  <Badge variant="default">Vigente</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fuente:</span>
                    <p className="font-medium">{SOURCE_LABELS[activeProfile.source]}</p>
                  </div>
                  {activeProfile.sourceDetail && (
                    <div>
                      <span className="text-muted-foreground">Detalle:</span>
                      <p className="font-medium">{activeProfile.sourceDetail}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Base de referencia:</span>
                    <p className="font-medium">{activeProfile.referenceBase}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vigente desde:</span>
                    <p className="font-medium">
                      {new Date(activeProfile.validFrom).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nutriente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProfile.values
                      .sort((a, b) => {
                        if (a.nutrient.isRequiredOnLabel && !b.nutrient.isRequiredOnLabel) return -1;
                        if (!a.nutrient.isRequiredOnLabel && b.nutrient.isRequiredOnLabel) return 1;
                        return a.nutrient.displayName.localeCompare(b.nutrient.displayName);
                      })
                      .map((nv) => (
                        <TableRow key={nv.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {nv.nutrient.displayName}
                              {nv.nutrient.isRequiredOnLabel && (
                                <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatValue(nv.value)}
                          </TableCell>
                          <TableCell>{nv.nutrient.unit}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {nv.method || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay perfil nutricional vigente
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Perfiles</CardTitle>
            </CardHeader>
            <CardContent>
              {ingredient.profiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay perfiles registrados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Vigente Desde</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Nutrientes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredient.profiles
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div>{SOURCE_LABELS[profile.source]}</div>
                            {profile.sourceDetail && (
                              <div className="text-xs text-muted-foreground">
                                {profile.sourceDetail}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{profile.referenceBase}</TableCell>
                          <TableCell>
                            {new Date(profile.validFrom).toLocaleDateString("es-CL")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={profile.isActive ? "default" : "secondary"}>
                              {profile.isActive ? "Vigente" : "Histórico"}
                            </Badge>
                          </TableCell>
                          <TableCell>{profile.values.length}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
