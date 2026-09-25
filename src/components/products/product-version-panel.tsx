"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CtnImportControls } from "@/components/nutrition/ctn-import-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Send, Check, X as XIcon, Archive, AlertTriangle } from "lucide-react";
import {
  addIngredientToVersion,
  approveVersion,
  createDraftVersion,
  getOrCreateFormulation,
  listActiveIngredients,
  obsoleteVersion,
  rejectToDraft,
  removeIngredientFromVersion,
  submitForReview,
  updateIngredientPercentage,
} from "@/app/actions/formulation-actions";
import { calculateFormulationSeals } from "@/app/actions/nutrition-actions";
import type { FormulationVersionStatus } from "@/lib/validations/products";

interface IngredientLite {
  id: string;
  name: string;
  siesaCode: string;
  category: string;
}

interface FormulationIngredientRow {
  id: string;
  porcentaje: string;
  ingredient: IngredientLite;
}

interface FormulationVersionRow {
  id: string;
  numeroSecuencial: number;
  estado: FormulationVersionStatus;
  aprobadaEn: string | null;
  aprobadaPor: { name: string; email: string } | null;
  ingredients: FormulationIngredientRow[];
}

interface FormulationRow {
  id: string;
  baseCalculo: string;
  rendimientoEsperado: string | null;
  versions: FormulationVersionRow[];
}

interface Props {
  productId: string;
  presentations: Array<{ id: string; gramajeNeto: number; porcionDeclarada: number | null }>;
  formulations: FormulationRow[];
  canWrite: boolean;
  canApprove: boolean;
  canReject: boolean;
}

const EstadoClass: Record<FormulationVersionRow["estado"], string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  IN_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  OBSOLETE: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export function ProductVersionPanel({ productId, presentations, formulations, canWrite, canApprove, canReject }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sealResult, setSealResult] = useState<Awaited<ReturnType<typeof calculateFormulationSeals>> | null>(null);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(presentations[0]?.id ?? null);

  const formulation = formulations[0];
  const versions = useMemo(() => formulation?.versions ?? [], [formulation]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(versions[0]?.id ?? null);
  const activeVersion = useMemo(
    () => versions.find((v) => v.id === activeVersionId) ?? null,
    [versions, activeVersionId],
  );

  const [ingredients, setIngredients] = useState<IngredientLite[]>([]);
  useEffect(() => {
    let cancelled = false;
    listActiveIngredients()
      .then((rows) => {
        if (!cancelled) setIngredients(rows as IngredientLite[]);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const [newIngredientId, setNewIngredientId] = useState<string>("");
  const [newPorcentaje, setNewPorcentaje] = useState<string>("0");

  function clearError() { setError(null); }

  function onCalculateSeals() {
    if (!activeVersion) return;
    clearError();
    startTransition(async () => {
      try {
        const selectedPresentation = presentations.find((presentation) => presentation.id === selectedPresentationId);
        const portionGrams = selectedPresentation?.porcionDeclarada ?? 100;
        const result = await calculateFormulationSeals(activeVersion.id, portionGrams);
        setSealResult(result);
        if (!result.ok) setError(result.message);
      } catch (err) {
        setSealResult(null);
        setError(err instanceof Error ? err.message : "No fue posible calcular los sellos.");
      }
    });
  }

  function onEnsureFormulation() {
    clearError();
    startTransition(async () => {
      try {
        await getOrCreateFormulation({ productId, baseCalculo: 100, rendimientoEsperado: null });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la formulación.");
      }
    });
  }

  function onCreateDraft() {
    if (!formulation) return;
    clearError();
    startTransition(async () => {
      try {
        const v = await createDraftVersion({ formulationId: formulation.id, rendimientoEsperado: null });
        setActiveVersionId(v.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la versión.");
      }
    });
  }

  function withRefresh(action: () => Promise<unknown>) {
    clearError();
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error en la operación.");
      }
    });
  }

  const versionLocked = activeVersion?.estado === "APPROVED" || activeVersion?.estado === "OBSOLETE";
  const suma = activeVersion
    ? activeVersion.ingredients.reduce((acc, fi) => acc + Number(fi.porcentaje), 0)
    : 0;
  const sumaWarning = activeVersion && Math.abs(suma - 100) > 0.0001;

  return (
    <Card className="border-[#D3D8DE]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Formulación</CardTitle>
        {!formulation && canWrite ? (
          <Button size="sm" onClick={onEnsureFormulation} disabled={pending}>
            {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
            Crear formulación
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {formulation ? (
          <>
            {canWrite ? <CtnImportControls formulationId={formulation.id} /> : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Base: {formulation.baseCalculo} kg
                {formulation.rendimientoEsperado
                  ? ` · Merma esperada: ${(Number(formulation.rendimientoEsperado) * 100).toFixed(2)} %`
                  : ""}
              </span>
              <Select
                value={activeVersionId ?? ""}
                onValueChange={(v) => {
                  setActiveVersionId(v || null);
                  setSealResult(null);
                }}
              >
                <SelectTrigger className="ml-auto w-[220px]">
                  <SelectValue placeholder="Seleccionar versión" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      v{v.numeroSecuencial} · {v.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canWrite && (activeVersion?.estado === "DRAFT" || activeVersion?.estado === "IN_REVIEW" || activeVersion?.estado === "APPROVED") ? (
                <Button size="sm" onClick={onCreateDraft} disabled={pending}>
                  <Plus className="mr-1 size-4" /> Nueva v
                </Button>
              ) : null}
              </div>

            {activeVersion ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={EstadoClass[activeVersion.estado]}>
                    {activeVersion.estado}
                  </Badge>
                  {activeVersion.aprobadaPor ? (
                    <span className="text-xs text-muted-foreground">
                      Aprobada por {activeVersion.aprobadaPor.name} el{" "}
                      {activeVersion.aprobadaEn ? new Date(activeVersion.aprobadaEn).toLocaleString("es-CO") : ""}
                    </span>
                  ) : null}
                </div>

                {sumaWarning ? (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <AlertTriangle className="size-4" />
                    La suma de porcentajes es {suma.toFixed(4)} % (se espera 100 %). Esto se registra como advertencia, no como error (OQ-013).
                  </div>
                ) : null}

                {activeVersion.estado === "APPROVED" ? (
                  <div className="space-y-3 rounded-md border border-[#D3D8DE] bg-[#F8FAFC] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Sellos de advertencia</p>
                        <p className="text-xs text-muted-foreground">Evaluación calculada por 100 g con los perfiles nutricionales activos.</p>
                      </div>
                      <Select
                        value={selectedPresentationId ?? ""}
                        onValueChange={(value) => {
                          setSelectedPresentationId(value || null);
                          setSealResult(null);
                        }}
                      >
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Seleccionar porción" />
                        </SelectTrigger>
                        <SelectContent>
                          {presentations.map((presentation) => (
                            <SelectItem key={presentation.id} value={presentation.id}>
                              {presentation.gramajeNeto.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g · porción {presentation.porcionDeclarada === null ? "no definida" : `${presentation.porcionDeclarada.toLocaleString("es-CO", { maximumFractionDigits: 1 })} g`}
                            </SelectItem>
                          ))}
                          {presentations.length === 0 ? <SelectItem value="default">Porción técnica 100 g</SelectItem> : null}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={onCalculateSeals} disabled={pending}>
                        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                        Calcular sellos
                      </Button>
                    </div>
                    {sealResult?.ok && sealResult.seals ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {sealResult.seals.activeSeals.length > 0 ? sealResult.seals.sealTexts.map((seal) => (
                            <Badge key={seal} variant="destructive">{seal}</Badge>
                          )) : <Badge variant="outline">Sin sellos de advertencia</Badge>}
                        </div>
                        <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
                          <span>Sodio: {sealResult.seals.details.sodium.valuePer100g.toFixed(2)} mg/100 g (umbral {sealResult.seals.details.sodium.threshold})</span>
                          <span>Azúcares: {sealResult.seals.details.sugars.percentageOfEnergy.toFixed(2)} % energía (umbral {sealResult.seals.details.sugars.threshold} %)</span>
                          <span>Grasa saturada: {sealResult.seals.details.fatSaturated.percentageOfEnergy.toFixed(2)} % energía (umbral {sealResult.seals.details.fatSaturated.threshold} %)</span>
                          <span>Grasa trans: {sealResult.seals.details.fatTrans.percentageOfEnergy.toFixed(2)} % energía (umbral {sealResult.seals.details.fatTrans.threshold} %)</span>
                        </div>
                        {sealResult.nutrition ? (
                          <div className="space-y-2 rounded-md border border-[#D3D8DE] bg-white p-3">
                            <div>
                              <p className="text-sm font-medium">Información nutricional calculada</p>
                              <p className="text-xs text-muted-foreground">Valores técnicos por 100 g y por la porción comercial seleccionada.</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[460px] text-xs">
                                <thead className="border-b text-left text-muted-foreground">
                                  <tr>
                                    <th className="px-2 py-1">Nutriente</th>
                                    <th className="px-2 py-1 text-right">Por 100 g</th>
                                    <th className="px-2 py-1 text-right">Por porción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    ["Energía", `${sealResult.nutrition.energyKcalPer100g.toFixed(1)} kcal`, `${sealResult.nutrition.energyKcalPerPortion.toFixed(1)} kcal`],
                                    ["Grasas totales", `${(sealResult.nutrition.per100g.FAT_TOTAL ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.FAT_TOTAL ?? 0).toFixed(2)} g`],
                                    ["Grasas saturadas", `${(sealResult.nutrition.per100g.FAT_SAT ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.FAT_SAT ?? 0).toFixed(2)} g`],
                                    ["Grasas trans", `${(sealResult.nutrition.per100g.FAT_TRANS ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.FAT_TRANS ?? 0).toFixed(2)} g`],
                                    ["Carbohidratos", `${(sealResult.nutrition.per100g.CARBS_TOTAL ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.CARBS_TOTAL ?? 0).toFixed(2)} g`],
                                    ["Azúcares", `${(sealResult.nutrition.per100g.SUGAR_TOTAL ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.SUGAR_TOTAL ?? 0).toFixed(2)} g`],
                                    ["Proteína", `${(sealResult.nutrition.per100g.PROTEIN ?? 0).toFixed(2)} g`, `${(sealResult.nutrition.perPortion.PROTEIN ?? 0).toFixed(2)} g`],
                                    ["Sodio", `${(sealResult.nutrition.per100g.SODIUM ?? 0).toFixed(2)} mg`, `${(sealResult.nutrition.perPortion.SODIUM ?? 0).toFixed(2)} mg`],
                                  ].map(([label, per100, perPortion]) => (
                                    <tr key={label} className="border-t">
                                      <td className="px-2 py-1 font-medium">{label}</td>
                                      <td className="px-2 py-1 text-right">{per100}</td>
                                      <td className="px-2 py-1 text-right">{perPortion}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-md border border-[#D3D8DE]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F5F7FA] text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Ingrediente</th>
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2 text-right">%</th>
                        {canWrite && !versionLocked ? <th className="px-3 py-2 text-right">Acciones</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {activeVersion.ingredients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Aún no hay ingredientes en esta versión.
                          </td>
                        </tr>
                      ) : (
                        activeVersion.ingredients.map((fi) => (
                          <Row
                            key={fi.id}
                            fi={fi}
                            disabled={pending || versionLocked}
                            canWrite={canWrite}
                            onUpdate={(p) =>
                              withRefresh(() => updateIngredientPercentage({
                                formulationVersionId: activeVersion.id,
                                ingredientId: fi.ingredient.id,
                                porcentajeParticipacion: p,
                              }))
                            }
                            onRemove={() =>
                              withRefresh(() => removeIngredientFromVersion({
                                formulationVersionId: activeVersion.id,
                                ingredientId: fi.ingredient.id,
                              }))
                            }
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {canWrite && activeVersion.estado === "DRAFT" ? (
                  <div className="grid gap-2 md:grid-cols-[1fr_120px_auto]">
                    <Select value={newIngredientId} onValueChange={setNewIngredientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Agregar ingrediente…" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} · {i.siesaCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.0001"
                      value={newPorcentaje}
                      onChange={(e) => setNewPorcentaje(e.target.value)}
                      aria-label="Porcentaje de participación"
                    />
                    <Button
                      disabled={pending || !newIngredientId || Number.isNaN(Number(newPorcentaje))}
                      onClick={() => withRefresh(async () => {
                        await addIngredientToVersion({
                          formulationVersionId: activeVersion.id,
                          ingredientId: newIngredientId,
                          porcentajeParticipacion: Number(newPorcentaje),
                        });
                        setNewIngredientId("");
                        setNewPorcentaje("0");
                      })}
                    >
                      Agregar
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {canWrite && activeVersion.estado === "DRAFT" ? (
                    <Button
                      variant="outline"
                      onClick={() => withRefresh(() => submitForReview({ formulationVersionId: activeVersion.id }))}
                      disabled={pending}
                    >
                      <Send className="mr-1 size-4" /> Enviar a revisión
                    </Button>
                  ) : null}
                  {canApprove && activeVersion.estado === "IN_REVIEW" ? (
                    <>
                      {canReject ? (
                        <Button
                          variant="outline"
                          onClick={() => withRefresh(() => rejectToDraft({ formulationVersionId: activeVersion.id, motivo: "Rechazada desde panel" }))}
                          disabled={pending}
                        >
                          <XIcon className="mr-1 size-4" /> Rechazar
                        </Button>
                      ) : null}
                      <Button
                        onClick={() => withRefresh(() => approveVersion({ formulationVersionId: activeVersion.id }))}
                        disabled={pending}
                      >
                        <Check className="mr-1 size-4" /> Aprobar
                      </Button>
                    </>
                  ) : null}
                  {canWrite && activeVersion.estado === "APPROVED" ? (
                    <Button
                      variant="outline"
                      onClick={() => withRefresh(() => obsoleteVersion({ formulationVersionId: activeVersion.id, motivo: "Marcada como obsoleta" }))}
                      disabled={pending}
                    >
                      <Archive className="mr-1 size-4" /> Marcar obsoleta
                    </Button>
                  ) : null}
                  {versionLocked ? (
                    <span className="text-xs text-muted-foreground">
                      Esta versión no se puede editar ({activeVersion?.estado}). Para modificarla, cree una nueva versión con el botón <strong>Nueva v</strong> arriba a la derecha; la nueva versión quedará en <strong>Borrador</strong> y la receta actual seguirá vigente hasta que se apruebe el cambio.
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta formulación aún no tiene versiones. {canWrite ? "Cree la primera versión (Draft)." : ""}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este producto aún no tiene una formulación asociada.
          </p>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

function Row({
  fi,
  disabled,
  canWrite,
  onUpdate,
  onRemove,
}: {
  fi: FormulationIngredientRow;
  disabled: boolean;
  canWrite: boolean;
  onUpdate: (p: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fi.porcentaje);

  if (!canWrite) {
    return (
      <tr className="border-t border-[#D3D8DE]">
        <td className="px-3 py-2 font-medium text-[#1F2933]">{fi.ingredient.name}</td>
        <td className="px-3 py-2 text-xs">{fi.ingredient.siesaCode}</td>
        <td className="px-3 py-2 text-xs">{fi.ingredient.category}</td>
        <td className="px-3 py-2 text-right">{Number(fi.porcentaje).toFixed(4)} %</td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-[#D3D8DE]">
      <td className="px-3 py-2 font-medium text-[#1F2933]">{fi.ingredient.name}</td>
      <td className="px-3 py-2 text-xs">{fi.ingredient.siesaCode}</td>
      <td className="px-3 py-2 text-xs">{fi.ingredient.category}</td>
      <td className="px-3 py-2 text-right">
        {editing ? (
          <Input
            type="number"
            min={0}
            max={100}
            step="0.0001"
            defaultValue={fi.porcentaje}
            onChange={(e) => setValue(e.target.value)}
            disabled={disabled}
            className="ml-auto h-8 w-28 text-right"
          />
        ) : (
          <span>{Number(fi.porcentaje).toFixed(4)} %</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {editing ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={disabled}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const n = Number(value);
                if (!Number.isFinite(n)) return;
                onUpdate(n);
                setEditing(false);
              }}
              disabled={disabled || Number.isNaN(Number(value))}
            >
              Guardar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={disabled}>
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={onRemove} disabled={disabled} aria-label="Quitar">
              <XIcon className="size-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
