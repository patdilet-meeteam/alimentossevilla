import { Prisma } from "@prisma/client";

type DecimalInput = Prisma.Decimal.Value;

export function calculateProcessOutput(inputQuantityKg: DecimalInput, lossFraction: DecimalInput | null) {
  const input = new Prisma.Decimal(inputQuantityKg);
  const loss = lossFraction === null ? new Prisma.Decimal(0) : new Prisma.Decimal(lossFraction);
  if (!input.isFinite() || input.lessThan(0)) throw new Error("La cantidad total de entrada no puede ser negativa.");
  if (!loss.isFinite() || loss.lessThan(0) || loss.greaterThan(1)) throw new Error("La merma debe estar entre 0 y 1.");

  const lossQuantityKg = input.mul(loss);
  return {
    inputQuantityKg: input,
    lossFraction: loss,
    lossQuantityKg,
    outputQuantityKg: input.minus(lossQuantityKg),
  };
}
