"use client";
import { useState } from "react";
import { evaluateSpeciesFatRule, type SpeciesContribution } from "@/lib/nutrition/species-fat-rule";

export function SpeciesFatPreview({ ingredients, initialClassifications = {} }: { ingredients: Array<{ id: string; name: string }>; initialClassifications?: Record<string, SpeciesContribution> }) {
  const [classifications, setClassifications] = useState<Record<string, SpeciesContribution>>(initialClassifications);
  const contributions = ingredients.map((ingredient) => classifications[ingredient.id] ?? { ingredientId: ingredient.id, role: "UNKNOWN" as const, species: null, evidence: null });
  const result = evaluateSpeciesFatRule(contributions);
  const labels = { WITH_FAT_SEAL: "Con sello de grasa según el criterio del cliente", WITHOUT_FAT_SEAL: "Sin sello de grasa según el criterio del cliente", PENDING_CLASSIFICATION: "Pendiente de clasificación completa" };
  function update(id: string, value: Partial<SpeciesContribution>) {
    setClassifications((current) => ({ ...current, [id]: { ...(current[id] ?? { ingredientId: id, role: "UNKNOWN", species: null, evidence: null }), ...value } }));
  }
  return <details className="rounded-md border border-[#D3D8DE] p-3">
    <summary className="cursor-pointer text-sm font-medium">Criterio del cliente: grasa animal y carne de la misma especie</summary>
    <p className="my-2 text-xs text-muted-foreground">Previsualización del diagrama del Director Técnico del 1 de octubre. Clasifique cada ingrediente y cite su fuente. Este criterio se evalúa por composición; el total nutricional de grasas saturadas se conserva por separado.</p>
    <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className="text-left">Ingrediente</th><th>Clasificación</th><th>Especie</th><th>Fuente de clasificación</th></tr></thead><tbody>
      {ingredients.map((ingredient) => { const value = classifications[ingredient.id]; return <tr key={ingredient.id}>
        <td>{ingredient.name}</td><td><select className="m-1 rounded border p-1" aria-label={`Clasificación de ${ingredient.name}`} value={value?.role ?? "UNKNOWN"} onChange={(event) => update(ingredient.id, { role: event.target.value as SpeciesContribution["role"] })}>
          <option value="UNKNOWN">Sin clasificar</option><option value="MEAT">Carne</option><option value="FAT">Grasa animal</option><option value="OTHER">Otro</option>
        </select></td>
        <td><input className="m-1 w-28 rounded border p-1" aria-label={`Especie de ${ingredient.name}`} value={value?.species ?? ""} placeholder="p. ej. cerdo" onChange={(event) => update(ingredient.id, { species: event.target.value })} /></td>
        <td><input className="m-1 w-48 rounded border p-1" aria-label={`Fuente de ${ingredient.name}`} value={value?.evidence ?? ""} placeholder="Documento, hoja y fila" onChange={(event) => update(ingredient.id, { evidence: event.target.value })} /></td>
      </tr>; })}
    </tbody></table></div>
    <p className="mt-2 text-sm font-medium" role="status">{labels[result.status]}</p>
    {result.status === "WITH_FAT_SEAL" ? <p className="text-xs">Grasa sin carne de su especie: {result.orphanFatSpecies.join(", ")}</p> : null}
    <p className="mt-1 text-xs text-muted-foreground">Resultado preliminar con las clasificaciones ingresadas. La emisión y aprobación del rótulo requieren la validación técnica correspondiente.</p>
  </details>;
}
