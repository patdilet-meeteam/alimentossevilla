/** Storage boundary only; never rounds, normalizes a recipe, or supplies absent values. */
export function fitsSourceDecimal(value: string): boolean {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match) return false;
  const exponent = Number(match[4] ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) return false;
  let digits = (match[2] + (match[3] ?? "")).replace(/^0+/, "");
  if (!digits) return true;
  let scale = (match[3] ?? "").length - exponent;
  while (digits.endsWith("0")) { digits = digits.slice(0, -1); scale--; }
  return scale <= 24 && digits.length - scale <= 14;
}
