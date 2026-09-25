import { IngredientCategory } from "@prisma/client";
import { readSheet } from "read-excel-file/node";

export const JUNE_SALCHICHA_SHEET = "SCHA DESAYUNO 480 G -14 UND";

export interface JuneSalchichaMasterRow {
  sourceRow: number;
  siesaCode: string;
  name: string;
  category: IngredientCategory;
  /** Exact Bank name used only when the two source files identify it clearly. */
  nutritionalBankName: string | null;
}

const MAPPING: Record<string, Omit<JuneSalchichaMasterRow, "sourceRow" | "siesaCode" | "name">> = {
  "2903003": { category: "MPC", nutritionalBankName: "Brazuelo de Cerdo" },
  "1121009": { category: "MPC", nutritionalBankName: "Tocino de Cerdo" },
  "2903002": { category: "MPC", nutritionalBankName: "Repele (Recorte 72 - 28)" },
  "1131002": { category: "AGUA", nutritionalBankName: "Agua" },
  "1250009": { category: "COLORANTE", nutritionalBankName: "Color rojo AC150" },
  // Confirmado por Director Técnico: ambas denominaciones corresponden al
  // mismo colorante y deben compartir el perfil del Banco Nutricional.
  "1250004": { category: "COLORANTE", nutritionalBankName: "NaranjaPR80J WD" },
  "1210006": { category: "MPNC", nutritionalBankName: "Sal reducida en sodio (60%)" },
  "1210004": { category: "CONSERVANTE", nutritionalBankName: "Sal curante" },
  "121007": { category: "REGULADOR_ACIDEZ", nutritionalBankName: "Supra meat" },
  "1240002": { category: "CONSERVANTE", nutritionalBankName: "INBAC sin sal" },
  "1220014": { category: "PROTEINA", nutritionalBankName: "PVH Líquida" },
  "1220009": { category: "CONDIMENTO_ESPECIA", nutritionalBankName: "Cebolla en polvo" },
  "1210003": { category: "MPNC", nutritionalBankName: "Eritorbato de Sodio" },
  "1260005": { category: "PROTEINA", nutritionalBankName: "Plasma de cerdo Vepro 75 PSC" },
  "1220005": { category: "CONDIMENTO_ESPECIA", nutritionalBankName: "Ajo molido" },
  "1220007": { category: "CONDIMENTO_ESPECIA", nutritionalBankName: "Pimienta negra en polvo" },
  "1220010": { category: "MPNC", nutritionalBankName: "Dextrosa" },
  "1270004": { category: "SABORIZANTE", nutritionalBankName: "Trusmoke oil ex" },
};

function code(value: unknown): string {
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return typeof value === "string" ? value.trim().replace(/\s/g, "") : "";
}

function name(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

/** Parses only the material rows in the confirmed June pilot sheet. */
export function parseJuneSalchichaMasterRows(rawRows: readonly (readonly unknown[])[]): JuneSalchichaMasterRow[] {
  const headerIndex = rawRows.findIndex((row) => String(row[1] ?? "").trim().toUpperCase() === "CÓDIGO" && String(row[2] ?? "").trim().toUpperCase() === "DESCRIPCIÓN");
  if (headerIndex < 0) throw new Error("No se encontró la tabla CÓDIGO / DESCRIPCIÓN de la fórmula de junio.");

  const parsed: JuneSalchichaMasterRow[] = [];
  for (let index = headerIndex + 1; index < rawRows.length; index += 1) {
    const sourceCode = code(rawRows[index][1]);
    const sourceName = name(rawRows[index][2]);
    if (sourceCode.toUpperCase() === "TOTAL" || !sourceCode) break;
    if (!sourceName) throw new Error(`La fila ${index + 1} no tiene descripción.`);
    const mapping = MAPPING[sourceCode];
    if (!mapping) throw new Error(`El código ${sourceCode} no pertenece al maestro piloto confirmado.`);
    parsed.push({ sourceRow: index + 1, siesaCode: sourceCode, name: sourceName, ...mapping });
  }
  if (parsed.length !== Object.keys(MAPPING).length) {
    throw new Error(`La fórmula de junio contiene ${parsed.length} materias primas; se esperaban ${Object.keys(MAPPING).length}.`);
  }
  return parsed;
}

export async function parseJuneSalchichaMasterWorkbook(buffer: Buffer): Promise<JuneSalchichaMasterRow[]> {
  let rows: unknown[][];
  try {
    rows = await readSheet(buffer, JUNE_SALCHICHA_SHEET);
  } catch {
    throw new Error(`No se pudo leer la hoja ${JUNE_SALCHICHA_SHEET} del archivo de junio.`);
  }
  return parseJuneSalchichaMasterRows(rows);
}
