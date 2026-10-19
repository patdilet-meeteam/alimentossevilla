import { z } from "zod";
import { fitsSourceDecimal } from "@/lib/decimal-storage";
import { sumExactDecimalStrings } from "@/lib/formulations/exact-decimal-sum";
// Strings preserve the full submitted decimal; numbers remain accepted for existing callers.
export function exactNonnegativeDecimal(maximum?: number) {
  return z.union([z.number().finite(), z.string().min(1).max(160)]).superRefine((value, context) => {
    const text = String(value);
    if (!fitsSourceDecimal(text)) { context.addIssue({code: "custom", message: "El valor excede la precisión decimal exacta disponible"}); return; }
    const canonical = sumExactDecimalStrings([text]);
    const [whole, fraction] = canonical.split(".");
    if (canonical.startsWith("-") || (maximum !== undefined && (BigInt(whole) > BigInt(maximum) || (BigInt(whole) === BigInt(maximum) && !!fraction)))) {
      context.addIssue({code: "custom", message: maximum === undefined ? "El valor no puede ser negativo" : `El valor debe estar entre 0 y ${maximum}`});
    }
  });
}
