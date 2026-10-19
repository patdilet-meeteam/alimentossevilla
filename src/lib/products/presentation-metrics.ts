/** Derive serving count from net grams and declared grams per serving. */
export function portionsPerPackage(netGrams: string, portionGrams: string | null): number | null {
  if (portionGrams === null || portionGrams.trim() === "" || netGrams.trim() === "") return null;
  const net = Number(netGrams);
  const portion = Number(portionGrams);
  if (!Number.isFinite(net) || !Number.isFinite(portion) || net <= 0 || portion <= 0) return null;
  return net / portion;
}
