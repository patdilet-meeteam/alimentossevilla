/** Specific source contradictions observed in the audit fixture; not a general recipe heuristic. */
export function getKnownRecipeConflict(productCode: string, components: readonly { siesaCode: string; percentage: string }[]): string | null {
  const fingerprint = components.map(row => `${row.siesaCode}:${Number(row.percentage)}`).sort().join("|");
  const conflicts: Record<string, { fingerprint: string; source: string }> = {
    "mega-combo-faizan": { fingerprint: "mortadela:50|sal:50", source: "Junio (1).xlsx / MEGA COMBO FAIZAN 675 G / B5:E7: paquete de tres productos terminados; no mortadela y sal50/50" },
    "s-per-combo-viand": { fingerprint: "mortadela:25|sal:75", source: "Junio (1).xlsx / SÚPER COMBO VIANDÉ 900 G / B5:E8: paquete de cuatro productos terminados; no mortadela y sal25/75" },
  };
  const conflict = conflicts[productCode];
  return conflict?.fingerprint === fingerprint ? `Receta sin reconciliar con la fuente: ${conflict.source}.` : null;
}
