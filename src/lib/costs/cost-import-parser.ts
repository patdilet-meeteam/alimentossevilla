import { readSheet } from "read-excel-file/node";

export const SUPPORTED_COST_UNITS = ["KG", "UND", "MTR"] as const;
export type SupportedCostUnit = (typeof SUPPORTED_COST_UNITS)[number];
export type ParsedCostCodeType = "INSUMO" | null;
export type ParsedCostRowStatus = "VALID" | "INVALID";

export interface ParsedCostRow {
  sourceRow: number;
  sourceCode: string;
  description: string;
  unit: SupportedCostUnit | null;
  unitCost: number;
  codeType: ParsedCostCodeType;
  status: ParsedCostRowStatus;
  issues: string[];
}

export interface ParsedCostWorkbook {
  rows: ParsedCostRow[];
  validItemCount: number;
  warningCount: number;
  duplicateCodes: string[];
}

function normalizeCode(value: unknown): string {
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeDescription(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeUnit(value: unknown): SupportedCostUnit | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toUpperCase();
  return SUPPORTED_COST_UNITS.includes(normalized as SupportedCostUnit)
    ? (normalized as SupportedCostUnit)
    : null;
}

function parseUnitCost(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferCodeType(sourceCode: string): ParsedCostCodeType {
  return /^(11|12|13)/.test(sourceCode) ? "INSUMO" : null;
}

export function parseCostRows(rawRows: readonly (readonly unknown[])[]): ParsedCostWorkbook {
  const parsedRows: ParsedCostRow[] = [];

  rawRows.forEach((raw, index) => {
    const sourceRow = index + 2;
    const primaryCode = normalizeCode(raw[0]);
    const repeatedCode = normalizeCode(raw[2]);
    const description = normalizeDescription(raw[1]);
    const rawUnit = typeof raw[3] === "string" ? raw[3].trim() : "";
    const unit = normalizeUnit(raw[3]);
    const parsedCost = parseUnitCost(raw[4]);

    if (!primaryCode && !repeatedCode && !description && parsedCost === null) return;

    const sourceCode = primaryCode || repeatedCode;
    const issues: string[] = [];
    if (!/^[A-Z0-9]{6,20}$/.test(sourceCode)) issues.push("Código SIESA ausente o inválido");
    if (primaryCode && repeatedCode && primaryCode !== repeatedCode) {
      issues.push("Las dos columnas de código no coinciden");
    }
    if (!description) issues.push("Descripción ausente");
    if (!rawUnit) issues.push("Unidad ausente");
    else if (!unit) issues.push(`Unidad no soportada: ${rawUnit}`);
    if (parsedCost === null) issues.push("Costo unitario ausente o inválido");

    parsedRows.push({
      sourceRow,
      sourceCode: sourceCode || `INVALID-${sourceRow}`,
      description: description || `Fila ${sourceRow} sin descripción`,
      unit,
      unitCost: parsedCost ?? 0,
      codeType: inferCodeType(sourceCode),
      status: issues.length ? "INVALID" : "VALID",
      issues,
    });
  });

  const rowsByCode = new Map<string, ParsedCostRow[]>();
  for (const row of parsedRows) {
    if (row.sourceCode.startsWith("INVALID-")) continue;
    const entries = rowsByCode.get(row.sourceCode) ?? [];
    entries.push(row);
    rowsByCode.set(row.sourceCode, entries);
  }

  const duplicateCodes: string[] = [];
  for (const [code, rows] of rowsByCode) {
    if (rows.length < 2) continue;
    duplicateCodes.push(code);
    // Regla funcional confirmada: cuando un código aparece varias veces, el
    // último costo asignado en el archivo es el vigente. Se conservan todas
    // las filas para trazabilidad, sin convertir el duplicado en un bloqueo.
    const selectedRow = rows.at(-1)!;
    for (const row of rows) {
      row.issues.push(
        row === selectedRow
          ? `Código repetido ${rows.length} veces; se usa este último costo asignado`
          : `Código repetido ${rows.length} veces; reemplazado por la última asignación`,
      );
    }
  }

  return {
    rows: parsedRows,
    validItemCount: parsedRows.filter((row) => row.status === "VALID").length,
    warningCount: parsedRows.filter((row) => row.status !== "VALID" || row.codeType === null).length,
    duplicateCodes: duplicateCodes.sort(),
  };
}

export async function parseCostWorkbook(buffer: Buffer): Promise<ParsedCostWorkbook> {
  let rows: unknown[][];
  try {
    rows = await readSheet(buffer, "Hoja1");
  } catch {
    throw new Error("No se pudo leer la hoja Hoja1 del archivo XLSX.");
  }

  if (rows.length < 2) throw new Error("El archivo no contiene filas de costos.");
  return parseCostRows(rows.slice(1));
}

export function normalizeCostDescription(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
