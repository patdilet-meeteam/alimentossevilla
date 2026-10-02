import { db } from "@/lib/db";
import { SEAL_THRESHOLDS } from "@/lib/nutrition/warning-seals";

export async function getCurrentRegulatoryParameters() {
  const latest = await db.regulatoryParameterVersion.findFirst({
    orderBy: { version: "desc" },
  });

  return {
    version: latest?.version ?? 1,
    id: latest?.id ?? "regulatory-parameters-v1",
    createdAt: latest?.createdAt ?? new Date("2026-10-01T00:00:00.000Z"),
    createdByEmail: latest?.createdByEmail ?? "Sistema · línea base existente",
    thresholds: {
      SODIUM_MG_PER_100G: latest ? Number(latest.sodiumMgPer100g) : SEAL_THRESHOLDS.SODIUM_MG_PER_100G,
      ENERGY_PERCENTAGE_THRESHOLD: latest ? Number(latest.energyPercentageThreshold) : SEAL_THRESHOLDS.ENERGY_PERCENTAGE_THRESHOLD,
      FAT_TRANS_THRESHOLD: latest ? Number(latest.fatTransPercentageThreshold) : SEAL_THRESHOLDS.FAT_TRANS_THRESHOLD,
    },
  };
}
