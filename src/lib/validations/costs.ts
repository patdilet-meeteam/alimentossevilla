import { z } from "zod";

export const costImportPeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "El periodo debe tener formato AAAA-MM");

export const costImportIdSchema = z.string().min(1, "El import es requerido");

export const formulationCostPreviewSchema = z.object({
  costImportId: costImportIdSchema.optional(),
});

export function periodToDate(period: string): Date {
  const validated = costImportPeriodSchema.parse(period);
  return new Date(`${validated}-01T00:00:00.000Z`);
}

export function formatCostPeriod(date: Date): string {
  return date.toISOString().slice(0, 7);
}
