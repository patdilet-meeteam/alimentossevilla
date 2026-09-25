import { Prisma } from "@prisma/client";
import { readSheet } from "read-excel-file/node";

/** Nutrient keys supported by the confirmed TN OFICIAL worksheet. */
export const BANK_NUTRIENT_COLUMNS: Record<string, string> = {
  HUMEDAD: "MOISTURE",
  GRASA: "FAT_TOTAL",
  "GRASA SATURADA": "FAT_SAT",
  TRANS: "FAT_TRANS",
  COLESTEROL: "CHOLESTEROL",
  PROTEINA: "PROTEIN",
  CHO: "CARBS_TOTAL",
  "AZ TOTALES": "SUGAR_TOTAL",
  "AZ ANADIDO": "SUGAR_ADDED",
  ALMIDON: "STARCH",
  FIBRA: "FIBER",
  SODIO: "SODIUM",
  CALCIO: "CALCIUM",
  HIERRO: "IRON",
  ZINC: "ZINC",
  "VIT A": "VITAMIN_A",
  "VIT D": "VITAMIN_D",
};

export interface NutritionalBankRow {
  sourceRow: number;
  sourceDetail: string | null;
  sourceCategory: string | null;
  ingredientName: string;
  valuesPer100g: Record<string, Prisma.Decimal>;
}

function normalizedHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function text(value: unknown): string | null {
  const parsed = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : String(value ?? "").trim();
  return parsed || null;
}

function decimal(value: unknown): Prisma.Decimal | null {
  if (typeof value === "number" && Number.isFinite(value)) return new Prisma.Decimal(value);
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s/g, "");
  if (!normalized || normalized === "-") return null;
  const canonical = normalized.includes(",") && !normalized.includes(".")
    ? normalized.replace(",", ".")
    : normalized.replace(/,/g, "");
  try {
    const parsed = new Prisma.Decimal(canonical);
    return parsed.isNegative() ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Parses the customer-provided TN OFICIAL sheet. The sheet has no SIESA code,
 * so this function deliberately returns names only; matching to master data is
 * performed separately and never creates an Ingredient implicitly.
 */
export function parseNutritionalBankRows(rawRows: readonly (readonly unknown[])[]): NutritionalBankRow[] {
  const headerIndex = rawRows.findIndex((row) => row.some((cell) => normalizedHeader(cell) === "INGREDIENTE"));
  if (headerIndex < 0) throw new Error("No se encontró la columna INGREDIENTE en TN OFICIAL.");

  const header = rawRows[headerIndex].map(normalizedHeader);
  const ingredientIndex = header.indexOf("INGREDIENTE");
  // The confirmed TN OFICIAL workbook leaves the first two header cells blank
  // while placing source and category immediately before INGREDIENTE.
  const sourceIndex = header.indexOf("FUENTE") >= 0 ? header.indexOf("FUENTE") : ingredientIndex - 2;
  const categoryIndex = header.indexOf("CATEGORIA") >= 0 ? header.indexOf("CATEGORIA") : ingredientIndex - 1;
  const nutrientIndexes = Object.entries(BANK_NUTRIENT_COLUMNS)
    .map(([column, nutrient]) => [header.indexOf(column), nutrient] as const)
    .filter(([index]) => index >= 0);

  if (nutrientIndexes.length === 0) throw new Error("TN OFICIAL no contiene columnas nutricionales reconocibles.");

  const parsed: NutritionalBankRow[] = [];
  for (let index = headerIndex + 1; index < rawRows.length; index += 1) {
    const row = rawRows[index];
    const ingredientName = text(row[ingredientIndex]);
    if (!ingredientName) continue;
    const valuesPer100g = Object.fromEntries(
      nutrientIndexes.flatMap(([columnIndex, nutrient]) => {
        const value = decimal(row[columnIndex]);
        return value === null ? [] : [[nutrient, value]];
      }),
    );
    if (Object.keys(valuesPer100g).length === 0) continue;
    parsed.push({
      sourceRow: index + 1,
      sourceDetail: sourceIndex >= 0 ? text(row[sourceIndex]) : null,
      sourceCategory: categoryIndex >= 0 ? text(row[categoryIndex]) : null,
      ingredientName,
      valuesPer100g,
    });
  }
  if (parsed.length === 0) throw new Error("TN OFICIAL no contiene filas nutricionales importables.");
  return parsed;
}

export async function parseNutritionalBankWorkbook(buffer: Buffer): Promise<NutritionalBankRow[]> {
  let rows: unknown[][];
  try {
    rows = await readSheet(buffer, "TN OFICIAL");
  } catch {
    throw new Error("No se pudo leer la hoja TN OFICIAL del Banco Nutricional.");
  }
  return parseNutritionalBankRows(rows);
}
