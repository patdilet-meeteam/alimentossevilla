import { z } from "zod";

const numericInput = z.string().trim().min(1).regex(/^-?\d+(\.\d+)?$/).transform(Number);
const threshold = numericInput.pipe(z.number().finite().min(0).max(100000));
const energyThreshold = numericInput.pipe(z.number().finite().min(0).max(100));

export const createRegulatoryParameterVersionSchema = z.object({
  sodiumMgPer100g: threshold,
  energyPercentageThreshold: energyThreshold,
  fatTransPercentageThreshold: energyThreshold,
});

export type CreateRegulatoryParameterVersionInput = z.infer<typeof createRegulatoryParameterVersionSchema>;
