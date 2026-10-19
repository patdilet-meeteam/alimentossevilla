/** Exact decimal addition for source fidelity; no binary floats, rounding or normalization. */
export function sumExactDecimalStrings(values: readonly string[]): string {
  const parsed = values.map((value) => {
    const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value.trim());
    if (!match) throw new Error("Decimal inválido");
    let scale = (match[3] ?? "").length - Number(match[4] ?? 0);
    if (Math.abs(scale) > 100) throw new Error("Precisión fuera de rango");
    let digits = match[2] + (match[3] ?? "");
    if (scale < 0) { digits += "0".repeat(-scale); scale = 0; }
    return { units: BigInt((match[1] === "-" ? "-" : "") + digits), scale };
  });
  const scale = Math.max(0, ...parsed.map((value) => value.scale));
  const total = parsed.reduce((sum, value) => sum + value.units * BigInt(10) ** BigInt(scale - value.scale), BigInt(0));
  const negative = total < BigInt(0); const digits = (negative ? -total : total).toString().padStart(scale + 1, "0");
  const number = scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}`.replace(/0+$/, "").replace(/\.$/, "") : digits;
  return (negative && number !== "0" ? "-" : "") + number;
}
